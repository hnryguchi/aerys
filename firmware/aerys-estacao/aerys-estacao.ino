// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
/*
 * AERYS: firmware da estação (ESP32 DevKit V1 + sensor I2C + OLED SSD1306)
 *
 * Sensores suportados (detecção automática no barramento I2C):
 *   - módulo AHT20 + BMP280 (temperatura/umidade no AHT20, pressão no BMP280)
 *   - BME280 (temperatura, umidade e pressão no mesmo chip)
 *   - BMP280 sozinho (temperatura e pressão; umidade enviada como null)
 *   - ENS160 (qualidade do ar: CO2 equivalente, compostos voláteis e índice UBA),
 *     opcional, no segundo barramento I2C (PINO_SDA_AR / PINO_SCL_AR). Lido direto
 *     pelos registradores, sem biblioteca extra. Sem o sensor, nada muda no envio.
 *
 * - Lê os sensores via I2C.
 * - Mostra as leituras no OLED.
 * - Envia as medições ao endpoint autenticado do AERYS (HTTPS em produção).
 *
 * Princípio: nenhum valor é inventado. Se um sensor não responder, o campo
 * é exibido como "--" e enviado como null.
 *
 * Bibliotecas (Gerenciador de Bibliotecas do Arduino IDE):
 *   Adafruit AHTX0, Adafruit BMP280 Library, Adafruit BME280 Library,
 *   Adafruit SSD1306, Adafruit GFX Library
 *   (e as dependências que o IDE oferecer: Adafruit BusIO, Adafruit Unified Sensor)
 * Placa: "ESP32 Dev Module" (pacote esp32 da Espressif).
 */

#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_BME280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>

#include "config.h"
#include "ca_raizes.h"
#if __has_include("secrets.h")
#include "secrets.h"
#else
#error "Crie firmware/aerys-estacao/secrets.h a partir de secrets.example.h"
#endif

Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp;
Adafruit_BME280 bme;
Adafruit_SSD1306 oled(OLED_LARGURA, OLED_ALTURA, &Wire, -1);

bool ahtOk = false;
bool bmpOk = false;
bool bmeOk = false;
bool oledOk = false;
bool ensOk = false;
uint8_t ensEndereco = 0;

struct Leitura {
  float temperaturaC = NAN;
  float umidadePct = NAN;
  float pressaoHpa = NAN;
  int eco2Ppm = -1;   // -1 = sem leitura válida (enviado como null)
  int tvocPpb = -1;
  int iqaUba = -1;
};

Leitura ultima;
unsigned long ultimoLeituraMs = 0;
unsigned long ultimoEnvioMs = 0;
unsigned long ultimoWifiTentativaMs = 0;
int ultimoHttpStatus = 0;        // 0 = ainda não enviou
unsigned long ultimoEnvioOkMs = 0;

// ---------- ENS160 (qualidade do ar) ----------
// Registradores (datasheet ScioSense ENS160).
const uint8_t ENS_PART_ID = 0x00, ENS_OPMODE = 0x10, ENS_TEMP_IN = 0x13, ENS_RH_IN = 0x15,
              ENS_STATUS = 0x20, ENS_AQI = 0x21, ENS_TVOC = 0x22, ENS_ECO2 = 0x24;
const uint8_t ENS_MODO_PADRAO = 0x02;

TwoWire* ensBus = &Wire;  // definido na detecção: barramento principal ou o segundo

bool ensEscrever(uint8_t reg, const uint8_t* dados, size_t n) {
  ensBus->beginTransmission(ensEndereco);
  ensBus->write(reg);
  ensBus->write(dados, n);
  return ensBus->endTransmission() == 0;
}

bool ensLer(uint8_t reg, uint8_t* dados, size_t n) {
  ensBus->beginTransmission(ensEndereco);
  ensBus->write(reg);
  if (ensBus->endTransmission(false) != 0) return false;
  if (ensBus->requestFrom(ensEndereco, (uint8_t)n) != n) return false;
  for (size_t i = 0; i < n; i++) dados[i] = ensBus->read();
  return true;
}

void iniciarEns160() {
  ensOk = false;
  // Procura primeiro no barramento principal (módulo ligado junto do AHT20/BMP280) e depois no segundo.
  const uint8_t enderecos[] = {ENS160_ENDERECO, (uint8_t)(ENS160_ENDERECO ^ 0x01)};
  TwoWire* barramentos[] = {&Wire, &Wire1};
  for (TwoWire* b : barramentos) {
    for (uint8_t e : enderecos) {
      ensBus = b;
      ensEndereco = e;
      uint8_t id[2];
      if (ensLer(ENS_PART_ID, id, 2) && id[0] == 0x60 && id[1] == 0x01) {
        uint8_t modo = ENS_MODO_PADRAO;
        ensOk = ensEscrever(ENS_OPMODE, &modo, 1);
        break;
      }
    }
    if (ensOk) break;
  }
  if (ensOk) Serial.printf("[sensores] ENS160: ok (0x%02X, %s)\n", ensEndereco, ensBus == &Wire ? "barramento principal" : "segundo barramento");
  else Serial.println("[sensores] ENS160: ausente (ok se o modulo de ar nao estiver ligado)");
}

// Compensação com a temperatura e a umidade reais da estação (melhora a estimativa do ENS160).
void compensarEns160(const Leitura& l) {
  if (!ensOk || isnan(l.temperaturaC) || isnan(l.umidadePct)) return;
  uint16_t t = (uint16_t)lroundf((l.temperaturaC + 273.15f) * 64.0f);
  uint16_t h = (uint16_t)lroundf(l.umidadePct * 512.0f);
  uint8_t bt[2] = {(uint8_t)(t & 0xFF), (uint8_t)(t >> 8)};
  uint8_t bh[2] = {(uint8_t)(h & 0xFF), (uint8_t)(h >> 8)};
  ensEscrever(ENS_TEMP_IN, bt, 2);
  ensEscrever(ENS_RH_IN, bh, 2);
}

int ensEco2Provisorio = -1;  // leitura durante o aquecimento: só no display/Serial, nunca enviada
unsigned long ensUltimoLogMs = 0;

void lerEns160(Leitura& l) {
  if (!ensOk) return;
  uint8_t st;
  if (!ensLer(ENS_STATUS, &st, 1)) return;
  uint8_t validade = (st >> 2) & 0x03;  // 0 normal, 1 aquecendo, 2 primeira partida, 3 inválido
  uint8_t d[5];
  if (!ensLer(ENS_AQI, d, 5)) return;  // AQI (1 byte), TVOC (2), eCO2 (2), little-endian
  int iqa = d[0] & 0x07;
  int tvoc = d[1] | (d[2] << 8);
  int eco2 = d[3] | (d[4] << 8);
  if (millis() - ensUltimoLogMs >= 30000UL) {
    ensUltimoLogMs = millis();
    Serial.printf("[ar] status=0x%02X validade=%u eco2=%d tvoc=%d iqa=%d\n", st, validade, eco2, tvoc, iqa);
  }
  if (validade != 0) {  // nada é enviado enquanto o sensor não estabiliza
    ensEco2Provisorio = (eco2 >= 400 && eco2 <= 65000) ? eco2 : -1;
    return;
  }
  ensEco2Provisorio = -1;
  if (iqa >= 1 && iqa <= 5) l.iqaUba = iqa;
  if (tvoc >= 0 && tvoc <= 65000) l.tvocPpb = tvoc;
  if (eco2 >= 400 && eco2 <= 65000) l.eco2Ppm = eco2;
}

const char* estadoEns160() {
  if (!ensOk) return "";
  uint8_t st;
  if (!ensLer(ENS_STATUS, &st, 1)) return "erro";
  switch ((st >> 2) & 0x03) {
    case 0: return "ok";
    case 1: return "aquecendo";
    case 2: return "1a partida";
    default: return "invalido";
  }
}

// ---------- Sensores ----------

bool valido(float v, float minimo, float maximo) {
  return !isnan(v) && v >= minimo && v <= maximo;
}

bool pressaoOk() { return bmeOk || bmpOk; }

void iniciarSensores() {
  ahtOk = aht.begin();
  // As bibliotecas conferem o ID do chip: BME280 (0x60) e BMP280 (0x58) não se confundem.
  bmeOk = bme.begin(0x76) || bme.begin(0x77);
  bmpOk = !bmeOk && (bmp.begin(0x77) || bmp.begin(0x76));
  if (bmpOk) {
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL, Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16, Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }
  Serial.printf("[sensores] AHT20: %s | BME280: %s | BMP280: %s\n", ahtOk ? "ok" : "ausente",
                bmeOk ? "ok" : "ausente", bmpOk ? "ok" : "ausente");
  if (!ahtOk && !pressaoOk()) Serial.println("[sensores] NENHUM sensor encontrado: confira 3V3, GND, SDA=21, SCL=22");
  iniciarEns160();
}

Leitura lerSensores() {
  Leitura l;
  if (ahtOk) {
    sensors_event_t umid, temp;
    if (aht.getEvent(&umid, &temp)) {
      if (valido(temp.temperature, -40, 85)) l.temperaturaC = temp.temperature;
      if (valido(umid.relative_humidity, 0, 100)) l.umidadePct = umid.relative_humidity;
    }
  }
  if (bmeOk) {
    float p = bme.readPressure() / 100.0F;
    if (valido(p, 300, 1100)) l.pressaoHpa = p;
    // AHT20, se presente, tem prioridade; senão usa o próprio BME280.
    if (isnan(l.temperaturaC)) {
      float t = bme.readTemperature();
      if (valido(t, -40, 85)) l.temperaturaC = t;
    }
    if (isnan(l.umidadePct)) {
      float h = bme.readHumidity();
      if (valido(h, 0, 100)) l.umidadePct = h;
    }
  }
  if (bmpOk) {
    float p = bmp.readPressure() / 100.0F;
    if (valido(p, 300, 1100)) l.pressaoHpa = p;
    // Sem AHT20, usa a temperatura do BMP280 (menos representativa do ar, mas real).
    if (isnan(l.temperaturaC)) {
      float t = bmp.readTemperature();
      if (valido(t, -40, 85)) l.temperaturaC = t;
    }
  }
  compensarEns160(l);
  lerEns160(l);
  return l;
}

// ---------- Display ----------

void textoValor(float v, int casas, const char* unidade, char* out, size_t n) {
  if (isnan(v)) snprintf(out, n, "-- %s", unidade);
  else snprintf(out, n, "%.*f %s", casas, v, unidade);
}

void desenharDisplay() {
  if (!oledOk) return;
  char buf[24];
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);

  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.print("AERYS ");
  oled.print(AERYS_ESTACAO_ID + 6);  // "001"
  oled.setCursor(80, 0);
  oled.print(WiFi.status() == WL_CONNECTED ? "WiFi ok" : "sem WiFi");

  oled.setTextSize(2);
  oled.setCursor(0, 14);
  textoValor(ultima.temperaturaC, 1, "C", buf, sizeof buf);
  oled.print(buf);

  oled.setTextSize(1);
  oled.setCursor(0, 36);
  textoValor(ultima.umidadePct, 0, "%", buf, sizeof buf);
  oled.print("Umid: ");
  oled.print(buf);
  oled.setCursor(0, 46);
  if (ensOk) {
    // Com o sensor de ar, a linha mostra o CO2 estimado (ou o estado do aquecimento).
    if (ultima.eco2Ppm > 0) snprintf(buf, sizeof buf, "CO2: %d ppm", ultima.eco2Ppm);
    // Durante o aquecimento mostra o valor provisório com "~" (não é enviado ao site).
    else if (ensEco2Provisorio > 0) snprintf(buf, sizeof buf, "CO2 ~%d (aquec.)", ensEco2Provisorio);
    else snprintf(buf, sizeof buf, "Ar: %s", estadoEns160());
    oled.print(buf);
  } else {
    textoValor(ultima.pressaoHpa, 1, "hPa", buf, sizeof buf);
    oled.print("Pres: ");
    oled.print(buf);
  }

  oled.setCursor(0, 56);
  if (ultimoHttpStatus == 0) {
    oled.print("Envio: aguardando");
  } else if (ultimoHttpStatus == 201) {
    snprintf(buf, sizeof buf, "Envio ok ha %lus", (millis() - ultimoEnvioOkMs) / 1000);
    oled.print(buf);
  } else {
    snprintf(buf, sizeof buf, "Falha envio: %d", ultimoHttpStatus);
    oled.print(buf);
  }
  oled.display();
}

// ---------- Rede ----------

void garantirWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  unsigned long agora = millis();
  if (ultimoWifiTentativaMs != 0 && agora - ultimoWifiTentativaMs < TIMEOUT_WIFI_MS) return;
  if (ultimoWifiTentativaMs != 0) {
    wl_status_t st = WiFi.status();
    Serial.printf("[wifi] falhou: %s\n", st == WL_NO_SSID_AVAIL   ? "rede nao encontrada (nome errado ou 5 GHz)"
                                         : st == WL_CONNECT_FAILED ? "senha recusada"
                                                                   : "sem resposta da rede");
  }
  ultimoWifiTentativaMs = agora;
  Serial.println("[wifi] conectando...");
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();  // encerra a tentativa anterior antes de começar outra
  WiFi.begin(WIFI_SSID, WIFI_SENHA);
}

void anexarNumero(String& json, const char* campo, float v, int casas, bool virgula) {
  json += "\"";
  json += campo;
  json += "\":";
  if (isnan(v)) json += "null";
  else json += String(v, casas);
  if (virgula) json += ",";
}

int enviarMedicao(const Leitura& l) {
  if (isnan(l.temperaturaC) && isnan(l.umidadePct) && isnan(l.pressaoHpa) && l.eco2Ppm < 0) {
    Serial.println("[envio] nenhum sensor com leitura valida; nada enviado");
    return -10;
  }

  String json = "{";
  anexarNumero(json, "temperatura_c", l.temperaturaC, 2, true);
  anexarNumero(json, "umidade_pct", l.umidadePct, 1, true);
  anexarNumero(json, "pressao_hpa", l.pressaoHpa, 2, true);
  // Campos do ar só vão quando há leitura válida (sensor presente e já estabilizado).
  if (l.eco2Ppm >= 0) json += "\"eco2_ppm\":" + String(l.eco2Ppm) + ",";
  if (l.tvocPpb >= 0) json += "\"tvoc_ppb\":" + String(l.tvocPpb) + ",";
  if (l.iqaUba >= 0) json += "\"iqa_uba\":" + String(l.iqaUba) + ",";
  json += "\"rssi_dbm\":" + String(WiFi.RSSI()) + ",";
  json += "\"firmware\":\"" AERYS_FIRMWARE_VERSAO "\"}";

  String url = AERYS_URL_INGESTAO;
  bool https = url.startsWith("https://");
  HTTPClient http;
  WiFiClientSecure clienteSeguro;
  WiFiClient clienteSimples;

  if (https) {
#ifdef AERYS_CA_PROPRIA
    clienteSeguro.setCACert(AERYS_CA_RAIZ);  // CA definida em secrets.h
#else
    clienteSeguro.setCACert(AERYS_CA_RAIZES);  // raízes públicas de ca_raizes.h
#endif
    if (!http.begin(clienteSeguro, url)) return -1;
  } else {
#ifdef AERYS_PERMITIR_HTTP
    if (!http.begin(clienteSimples, url)) return -1;
#else
    Serial.println("[envio] URL sem HTTPS bloqueada (defina AERYS_PERMITIR_HTTP apenas em bancada)");
    return -2;
#endif
  }

  http.setTimeout(TIMEOUT_HTTP_MS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + AERYS_TOKEN);
  http.addHeader("X-Aerys-Station", AERYS_ESTACAO_ID);
  int status = http.POST(json);
  http.end();
  // O token nunca é impresso no Serial.
  Serial.printf("[envio] HTTP %d | %s\n", status, json.c_str());
  return status;
}

// ---------- Ciclo principal ----------

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("AERYS estacao " AERYS_FIRMWARE_VERSAO " - " AERYS_ESTACAO_ID);

  Wire.begin(PINO_SDA, PINO_SCL);
  Wire1.begin(PINO_SDA_AR, PINO_SCL_AR);
  oledOk = oled.begin(SSD1306_SWITCHCAPVCC, OLED_ENDERECO);
  if (!oledOk) Serial.println("[oled] display nao encontrado");
  if (oledOk) {
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oled.setTextSize(2);
    oled.setCursor(0, 8);
    oled.print("AERYS");
    oled.setTextSize(1);
    oled.setCursor(0, 36);
    oled.print("iniciando...");
    oled.display();
  }

  iniciarSensores();
  garantirWifi();
  ultima = lerSensores();
  ultimoLeituraMs = millis();
  // Primeiro envio ~10 s após ligar (tempo para o Wi-Fi conectar).
  ultimoEnvioMs = millis() - INTERVALO_ENVIO_MS + 10000UL;
}

void loop() {
  unsigned long agora = millis();
  garantirWifi();

  if (agora - ultimoLeituraMs >= INTERVALO_LEITURA_MS) {
    ultimoLeituraMs = agora;
    ultima = lerSensores();
    desenharDisplay();
  }

  if (agora - ultimoEnvioMs >= INTERVALO_ENVIO_MS) {
    ultimoEnvioMs = agora;
    if (!ahtOk && !pressaoOk()) iniciarSensores();  // nova tentativa caso um sensor tenha sido reconectado
    else if (!ensOk) iniciarEns160();               // módulo de ar soldado/ligado depois
    if (WiFi.status() == WL_CONNECTED) {
      ultimoHttpStatus = enviarMedicao(ultima);
      if (ultimoHttpStatus == 201) ultimoEnvioOkMs = millis();
    } else {
      Serial.println("[envio] sem Wi-Fi; medicao nao enviada");
    }
    desenharDisplay();
  }
  delay(20);
}

/*
 * AERYS: firmware da estação (ESP32 DevKit V1 + sensor I2C + OLED SSD1306)
 *
 * Sensores suportados (detecção automática no barramento I2C):
 *   - módulo AHT20 + BMP280 (temperatura/umidade no AHT20, pressão no BMP280)
 *   - BME280 (temperatura, umidade e pressão no mesmo chip)
 *   - BMP280 sozinho (temperatura e pressão; umidade enviada como null)
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

struct Leitura {
  float temperaturaC = NAN;
  float umidadePct = NAN;
  float pressaoHpa = NAN;
};

Leitura ultima;
unsigned long ultimoLeituraMs = 0;
unsigned long ultimoEnvioMs = 0;
unsigned long ultimoWifiTentativaMs = 0;
int ultimoHttpStatus = 0;        // 0 = ainda não enviou
unsigned long ultimoEnvioOkMs = 0;

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
  textoValor(ultima.pressaoHpa, 1, "hPa", buf, sizeof buf);
  oled.print("Pres: ");
  oled.print(buf);

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
  ultimoWifiTentativaMs = agora;
  Serial.println("[wifi] conectando...");
  WiFi.mode(WIFI_STA);
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
  if (isnan(l.temperaturaC) && isnan(l.umidadePct) && isnan(l.pressaoHpa)) {
    Serial.println("[envio] nenhum sensor com leitura valida; nada enviado");
    return -10;
  }

  String json = "{";
  anexarNumero(json, "temperatura_c", l.temperaturaC, 2, true);
  anexarNumero(json, "umidade_pct", l.umidadePct, 1, true);
  anexarNumero(json, "pressao_hpa", l.pressaoHpa, 2, true);
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

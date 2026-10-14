// AERYS — configurações NÃO secretas da estação.
// Segredos (Wi-Fi, token, URL) ficam em secrets.h, que não é versionado.
#pragma once

#define AERYS_FIRMWARE_VERSAO "0.1.0"

// I2C do ESP32 DevKit V1 (30 pinos)
#define PINO_SDA 21
#define PINO_SCL 22

// Endereços I2C usuais
#define OLED_ENDERECO 0x3C   // alguns módulos usam 0x3D
#define OLED_LARGURA 128
#define OLED_ALTURA 64
// BMP280: 0x77 ou 0x76 (o firmware tenta os dois). AHT20: 0x38 (fixo).

// Intervalos
#define INTERVALO_LEITURA_MS 5000UL    // atualização do display
#define INTERVALO_ENVIO_MS 60000UL     // envio ao servidor (o servidor aceita no mínimo 10 s)
#define TIMEOUT_HTTP_MS 10000UL
#define TIMEOUT_WIFI_MS 20000UL

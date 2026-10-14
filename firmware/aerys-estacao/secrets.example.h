// AERYS — MODELO de segredos da estação.
// 1. Copie este arquivo para "secrets.h" (mesma pasta). secrets.h é ignorado pelo Git.
// 2. Preencha os valores. NUNCA coloque chaves do banco de dados aqui.
#pragma once

#define WIFI_SSID "nome-da-rede"
#define WIFI_SENHA "senha-da-rede"

// Identificador permanente da estação (o mesmo da URL /estacao/aerys-001)
#define AERYS_ESTACAO_ID "aerys-001"

// Token do dispositivo, gerado com: npm run device:token -- aerys-001
// (o servidor guarda apenas o hash; este token só permite enviar medições desta estação)
#define AERYS_TOKEN "cole-aqui-o-token-gerado"

// Endpoint de ingestão.
// Produção (HTTPS):     "https://SEU-DOMINIO/api/v1/ingestao"
// Bancada na rede local: "http://192.168.0.10:3000/api/v1/ingestao"  (exige AERYS_PERMITIR_HTTP)
#define AERYS_URL_INGESTAO "https://exemplo.invalid/api/v1/ingestao"

// Descomente SOMENTE para testes de bancada em rede local confiável.
// #define AERYS_PERMITIR_HTTP

// Certificado raiz (CA) do domínio de produção, em formato PEM.
// Veja firmware/README.md ("Certificado HTTPS") para obter o certificado correto.
static const char AERYS_CA_RAIZ[] PROGMEM = R"PEM(
-----BEGIN CERTIFICATE-----
COLE-AQUI-O-CERTIFICADO-RAIZ
-----END CERTIFICATE-----
)PEM";

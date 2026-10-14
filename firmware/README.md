# Firmware da estação AERYS

_Versão 0.1.0 — 14/10/2026. Status: escrito, **ainda não compilado nem gravado**._

## Preparação (Arduino IDE 2.x)

1. **Placas**: Gerenciador de Placas → instale “esp32” (Espressif Systems). Selecione **ESP32 Dev Module**.
2. **Bibliotecas** (Gerenciador de Bibliotecas), aceitando as dependências sugeridas:
   - Adafruit AHTX0
   - Adafruit BMP280 Library
   - Adafruit BME280 Library
   - Adafruit SSD1306
   - Adafruit GFX Library
3. Copie `aerys-estacao/secrets.example.h` para `aerys-estacao/secrets.h` e preencha.
   `secrets.h` é ignorado pelo Git — confira com `git status` que ele não aparece.
4. Gere o token: `npm run device:token -- aerys-001`
   - o **token** vai para `secrets.h` (`AERYS_TOKEN`);
   - o **hash** vai para o servidor (`AERYS_DEVICE_TOKENS`).
5. Abra `aerys-estacao/aerys-estacao.ino`, compile e grave. Monitor Serial: 115200 baud.

## Teste de bancada (sem nuvem)

Com computador e ESP32 **na mesma rede Wi-Fi**:

```bash
# .env.local
AERYS_DATA_SOURCE=local
AERYS_DEVICE_TOKENS=aerys-001:<hash gerado>

npm run dev:lan
```

No `secrets.h`:

```c
#define AERYS_URL_INGESTAO "http://IP-DO-COMPUTADOR:3000/api/v1/ingestao"
#define AERYS_PERMITIR_HTTP
```

O Windows pode pedir para liberar o Node no firewall (rede **privada**). Após ~10 s, o Monitor Serial
deve mostrar `[envio] HTTP 201` e a página `http://localhost:3000/estacao/aerys-001` deve
mudar para **Online**. Remova `AERYS_PERMITIR_HTTP` depois do teste.

## Certificado HTTPS (produção)

O firmware valida o servidor com o certificado raiz (CA) do domínio. Para obter a CA do domínio
definitivo, com o site já publicado:

```bash
openssl s_client -connect SEU-DOMINIO:443 -showcerts </dev/null
```

No último certificado exibido, leia o campo `issuer` (por exemplo, `ISRG Root X1`). Baixe esse
**certificado raiz** do site oficial da autoridade certificadora (formato PEM) e cole-o em
`AERYS_CA_RAIZ`. Prefira a raiz em vez da intermediária, que muda com mais frequência.
Se a hospedagem trocar de autoridade certificadora, o envio falhará (o OLED mostra “Falha envio”)
e a CA precisa ser atualizada. Teste sempre na bancada antes de instalar a estação.

## Códigos no display / Serial

| Código | Significado |
|---|---|
| 201 | Medição aceita |
| 401 | Token ou estação incorretos |
| 422 | Valor fora da faixa ou formato inválido |
| 429 | Envio frequente demais (mínimo 10 s) |
| 503 | Servidor em modo demonstrativo ou banco indisponível |
| -1 / negativo | Falha de conexão/TLS antes da resposta HTTP |
| -2 | URL HTTP bloqueada (falta `AERYS_PERMITIR_HTTP` na bancada) |
| -10 | Nenhum sensor com leitura válida (nada enviado) |

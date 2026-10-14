# Hardware — estação AERYS-001

_Atualizado em 14/10/2026. A placa e os sensores existem, mas o firmware deste repositório
ainda não foi gravado nem testado neles._

## Componentes

| Componente | Função | Interface | Endereço I²C |
|---|---|---|---|
| ESP32 DevKit V1 (WROOM-32, 30 pinos) | Microcontrolador + Wi-Fi | — | — |
| AHT20 | Temperatura e umidade relativa | I²C | 0x38 |
| BMP280 | Pressão atmosférica (e temperatura) | I²C | 0x77 ou 0x76 |
| OLED SSD1306 0,96″ 128×64 | Display local | I²C | 0x3C (às vezes 0x3D) |
| Protoboard, jumpers, USB/powerbank | Montagem e alimentação | — | — |

> O firmware **detecta automaticamente** o sensor: módulo AHT20 + BMP280, **BME280** (temperatura,
> umidade e pressão no mesmo chip, endereço 0x76/0x77) ou BMP280 sozinho. O BMP280 sozinho não mede
> umidade: nesse caso a umidade é enviada como `null` e o site mostra “—”. O Monitor Serial informa
> qual sensor foi encontrado (`[sensores] AHT20: … | BME280: … | BMP280: …`).

## Ligações (barramento I²C compartilhado)

| Módulo | VCC | GND | SDA | SCL |
|---|---|---|---|---|
| AHT20 + BMP280 | 3V3 | GND | GPIO 21 | GPIO 22 |
| OLED SSD1306 | 3V3 | GND | GPIO 21 | GPIO 22 |

- Use **3V3**, não 5 V/VIN, salvo se o módulo indicar regulador próprio.
- Todos os módulos no mesmo par SDA/SCL (em paralelo).
- Mantenha o sensor **longe do ESP32 e do display** (ambos aquecem) e fora do sol direto;
  caso contrário a temperatura medida fica mais alta que a do ar.

## Verificação na bancada

1. Grave o firmware (ver `firmware/README.md`) e abra o Monitor Serial a 115200 baud.
2. Confirme a linha `[sensores] AHT20: ok | BMP280: ok`.
3. O OLED deve mostrar temperatura, umidade, pressão e o estado do Wi-Fi/envio.
4. Valores plausíveis em ambiente interno: 15–35 °C, 30–80 %, ~900–1030 hPa (depende da altitude).

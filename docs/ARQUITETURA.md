# Arquitetura

_Atualizado em 14/10/2026._

```
ESP32 (AHT20 + BMP280 + OLED)
   │  HTTPS POST /api/v1/ingestao
   │  Authorization: Bearer <token do dispositivo>, X-Aerys-Station: aerys-001
   ▼
Next.js (servidor)  ── valida token (hash SHA-256), corpo (Zod), faixa física, frequência
   │  chave SECRETA (somente nesta rota)
   ▼
PostgreSQL (Supabase)  ── RLS: leitura pública só de estações públicas; sem UPDATE/DELETE
   ▲  chave PUBLICÁVEL (leitura, sujeita a RLS)
   │
Next.js (páginas e GET /api/v1/...)  ──►  Navegador / PWA / QR Code
```

## Componentes

- **Interface**: Next.js 16 (App Router, React 19), CSS próprio com tokens (claro/escuro),
  gráficos em SVG próprio (sem biblioteca de gráficos), PWA (manifesto + service worker).
- **Camada de dados** (`src/lib/data`): interface `MeasurementReader`/`MeasurementWriter` com três
  implementações (`demo`, `local`, `supabase`). Os componentes visuais não acessam a fonte diretamente.
- **Estado de conectividade** (`src/lib/domain/status.ts`): derivado apenas de evidência real —
  “Online” somente se a última medição real tiver no máximo max(3 × intervalo esperado, 5 min).
  Dados demonstrativos nunca aparecem como online.
- **Horário da medição**: horário de **recebimento** no servidor. O ESP32 não tem relógio de tempo
  real; isso evita horários inconsistentes e impede que o dispositivo “escolha” o horário.
- **Agregação**: 24 h em intervalos de 10 min; 7 dias em intervalos de 1 h (função SQL
  `medicoes_agregadas`, `security invoker`). Lacunas ficam visíveis no gráfico.

## Rotas

| Rota | Método | Acesso |
|---|---|---|
| `/`, `/painel`, `/sobre` | GET | Público |
| `/estacao/{id}` (`?periodo=24h|7d`) | GET | Público — URL permanente usada no QR |
| `/estacao/{id}/qr` | GET | Público — folha de QR para imprimir/projetar |
| `/api/v1/estacoes` | GET | Público, limitado (120/min/IP) |
| `/api/v1/estacoes/{id}` | GET | Público, limitado |
| `/api/v1/estacoes/{id}/medicoes?periodo=` | GET | Público, limitado |
| `/api/v1/ingestao` | POST | Somente dispositivos autenticados |

Métodos não implementados respondem 405.

## Por que estas escolhas

Ver [DECISOES.md](DECISOES.md).

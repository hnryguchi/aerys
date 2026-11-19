# AERYS

[Português](README.md) · **English**

Urban environmental monitoring platform: low-cost stations (ESP32) send
temperature, humidity and pressure to a public dashboard, also reachable via QR Code.

> Source code visible for portfolio purposes. **All rights reserved** (`UNLICENSED`): copying, modifying or redistributing it without the author's permission is not allowed.
> Personal project; no real third-party data in this repository.

## Current status (2026-10-14)

| Part | Status |
|---|---|
| Interface (home, dashboard, station, about, QR, PWA) | Implemented and tested locally |
| Public read API + authenticated ingestion | Implemented and tested locally |
| Database (Supabase migration with RLS) | Written and tested on embedded PostgreSQL; **not applied** to any remote project |
| ESP32 firmware | Written; **not yet compiled or flashed to the board** |
| Public deployment | **Not done** (pending authorization) |

## Requirements

- Node.js >= 20.9 (tested with 24)
- For the firmware: Arduino IDE 2.x with the ESP32 board package (Espressif)

## Quick start

```bash
npm install
cp .env.example .env.local      # AERYS_DATA_SOURCE=demo by default
npm run dev                     # http://localhost:3000
```

In `demo` mode, every page shows **"Dados demonstrativos — não são medições reais"**
(demonstration data, not real measurements) and ingestion is disabled.

## Data modes (`AERYS_DATA_SOURCE`)

| Mode | Use | Data |
|---|---|---|
| `demo` | Preview the interface | Simulated series, always flagged |
| `local` | Bench tests with the board on the same network | Real, stored in `data/local/` (ignored by Git) |
| `supabase` | Production | Real, PostgreSQL with RLS |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run dev:lan` | Development (`:lan` accepts connections from the local network, for the board) |
| `npm test` | Unit, API and database permission tests |
| `npm run typecheck` | Type checking |
| `npm run check` | Types + tests + production build |
| `npm run audit:deps` | Vulnerability audit of production dependencies |
| `npm run device:token -- aerys-001` | Generates the device token (firmware) and its hash (server) |
| `npm run qr -- --site https://domain` | Generates final QR Codes in `saida/qrcodes/` |

## Structure

```
src/app/            pages and API routes (Next.js App Router)
src/components/     reusable visual components
src/lib/domain/     types, metrics, connectivity state, aggregation
src/lib/data/       data layer (demo, local, supabase), separate from the interface
src/lib/security/   device authentication, validation, rate limiting
supabase/           versioned migrations, seed and RLS tests
firmware/           station firmware (Arduino/ESP32)
scripts/            device token and QR Code generation
tests/              automated tests (Vitest)
docs/               architecture, security, hardware, decisions, deployment, IP
```

## Documentation

The documents below are written in Portuguese.

- [Architecture](docs/ARQUITETURA.md)
- [Security](docs/SEGURANCA.md)
- [Hardware and wiring](docs/HARDWARE.md) · [Firmware](firmware/README.md)
- [Deployment (Vercel + Supabase)](docs/DEPLOY.md)
- [Presentation script](docs/APRESENTACAO.md)
- [Decision log](docs/DECISOES.md) · [Phase roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md)
- [Intellectual property checklist](docs/PROPRIEDADE-INTELECTUAL.md)

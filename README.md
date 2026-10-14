# AERYS

Plataforma de monitoramento ambiental urbano: estações de baixo custo (ESP32) enviam
temperatura, umidade e pressão para um painel público, acessível também por QR Code.

> Repositório **privado**. O site é público; o código-fonte não.
> Software proprietário — todos os direitos reservados (ver `package.json`: `UNLICENSED`).

## Estado atual (14/10/2026)

| Parte | Situação |
|---|---|
| Interface (início, painel, estação, sobre, QR, PWA) | Implementada e testada localmente |
| API de leitura pública + ingestão autenticada | Implementada e testada localmente |
| Banco (migração Supabase com RLS) | Escrita e testada em PostgreSQL embutido; **não aplicada** em nenhum projeto remoto |
| Firmware ESP32 | Escrito; **ainda não compilado nem gravado na placa** |
| Deploy público | **Não realizado** (aguarda autorização) |

## Requisitos

- Node.js ≥ 20.9 (testado com 24)
- Para o firmware: Arduino IDE 2.x com o pacote de placas ESP32 (Espressif)

## Início rápido

```bash
npm install
cp .env.example .env.local      # AERYS_DATA_SOURCE=demo por padrão
npm run dev                     # http://localhost:3000
```

No modo `demo`, todas as páginas exibem **“Dados demonstrativos — não são medições reais”**
e a ingestão fica desativada.

## Modos de dados (`AERYS_DATA_SOURCE`)

| Modo | Uso | Dados |
|---|---|---|
| `demo` | Visualizar a interface | Série simulada, sempre sinalizada |
| `local` | Testes de bancada com a placa na mesma rede | Reais, gravados em `data/local/` (ignorado pelo Git) |
| `supabase` | Produção | Reais, PostgreSQL com RLS |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` / `npm run dev:lan` | Desenvolvimento (o `:lan` aceita conexões da rede local, para a placa) |
| `npm test` | Testes unitários, de API e de permissões do banco |
| `npm run typecheck` | Verificação de tipos |
| `npm run check` | Tipos + testes + build de produção |
| `npm run audit:deps` | Auditoria de vulnerabilidades das dependências de produção |
| `npm run device:token -- aerys-001` | Gera token do dispositivo (firmware) e hash (servidor) |
| `npm run qr -- --site https://dominio` | Gera QR Codes definitivos em `saida/qrcodes/` |

## Estrutura

```
src/app/            páginas e rotas de API (Next.js App Router)
src/components/     componentes visuais reutilizáveis
src/lib/domain/     tipos, métricas, estado de conectividade, agregação
src/lib/data/       camada de dados (demo, local, supabase) — separada da interface
src/lib/security/   autenticação de dispositivo, validação, limitação de frequência
supabase/           migrações versionadas, seed e testes de RLS
firmware/           firmware da estação (Arduino/ESP32)
scripts/            geração de token de dispositivo e de QR Codes
tests/              testes automatizados (Vitest)
docs/               arquitetura, segurança, hardware, decisões, deploy, PI
```

## Documentação

- [Arquitetura](docs/ARQUITETURA.md)
- [Segurança](docs/SEGURANCA.md)
- [Hardware e ligações](docs/HARDWARE.md) · [Firmware](firmware/README.md)
- [Deploy (Vercel + Supabase)](docs/DEPLOY.md)
- [Roteiro de apresentação](docs/APRESENTACAO.md)
- [Registro de decisões](docs/DECISOES.md) · [Roteiro de fases](docs/ROADMAP.md) · [Changelog](CHANGELOG.md)
- [Checklist de propriedade intelectual](docs/PROPRIEDADE-INTELECTUAL.md)

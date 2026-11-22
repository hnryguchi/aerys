# Roteiro por fases

_Atualizado em 22/11/2026._

| Fase | Descrição | Situação |
|---|---|---|
| 1 | Auditoria do ambiente e preparação segura | **Concluída** |
| 2 | Repositório no GitHub | **Concluída** |
| 3 | MVP visual com dados demonstrativos | **Concluída** |
| 4 | Testes, documentação e revisão de segurança | **Concluída** (ver SEGURANCA.md) |
| 5 | Banco de dados e integração real com o ESP32 | **Concluída** (16/10: estação enviando dados reais) |
| 6 | Deploy público e QR Codes definitivos | **Concluída** (`aerys-mu.vercel.app/estacao/aerys-001`) |
| 7 | Sensor de qualidade do ar (ENS160 + AHT21) | **Parcial**: site, API, migração e firmware 0.2.0 prontos; falta aplicar a migração, soldar o módulo e gravar |
| 8 | Aparelho em caixa com app de instalação; rede nas Naves do Conhecimento | Futuro |
| 9 | Versão para postes e praças (GPS) e sensor PM2.5 | Futuro |

## Próximas tarefas sugeridas

1. Aplicar a migração `20261120000000_qualidade_ar.sql` no Supabase de produção.
2. Soldar o módulo ENS160 + AHT21 no segundo barramento I²C (GPIO 25/26) e gravar o firmware 0.2.0 (ver firmware/README.md).
3. Manter o banco ativo (o plano gratuito pausa após 7 dias sem uso).

# Roteiro por fases

_Atualizado em 14/10/2026._

| Fase | Descrição | Situação |
|---|---|---|
| 1 | Auditoria do ambiente e preparação segura | **Concluída** (pasta, `.gitignore`, Git local, identidade local) |
| 2 | Repositório privado no GitHub | **Pendente** — aguarda autorização para criar e enviar |
| 3 | MVP visual com dados demonstrativos | **Concluída localmente** |
| 4 | Testes, documentação e revisão de segurança | **Concluída localmente** (ver SEGURANCA.md) |
| 5 | Banco de dados e integração real com o ESP32 | **Parcial** — código pronto e testado localmente; firmware não compilado; banco remoto não criado |
| 6 | Deploy público autorizado e QR Codes definitivos | **Pendente** — página e gerador de QR prontos; aguarda URL definitiva |
| 7 | Várias estações e novos sensores (PM2.5) | Futuro |

## Próximas tarefas sugeridas

1. Compilar e gravar o firmware; teste de bancada em modo `local`.
2. Autorizar Fase 2 (repositório privado) e Fase 6 (Supabase + Vercel com contas pessoais).
3. Repetir os testes de RLS e endpoints no ambiente publicado.
4. Gerar e testar os QR Codes definitivos.
5. Abrigo da estação (proteção contra sol/chuva com ventilação) antes de instalação externa.

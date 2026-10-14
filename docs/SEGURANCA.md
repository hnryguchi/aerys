# Segurança

_Atualizado em 14/10/2026. Este documento descreve o que foi implementado e **o que foi efetivamente
testado**. Segurança não é considerada “concluída”: o ambiente de produção ainda não existe._

## Controles implementados

| Controle | Onde | Testado? |
|---|---|---|
| Rotas públicas só leem (sem POST/PUT/PATCH/DELETE → 405) | `src/app/api/v1/estacoes/**` | Sim — teste automatizado e requisição HTTP real |
| Ingestão autenticada por dispositivo (token aleatório de 256 bits; servidor guarda só SHA-256; comparação em tempo constante) | `src/lib/security/device-auth.ts` | Sim — token ausente, errado, de outra estação |
| Token vinculado à estação (um token não envia por outra estação) | idem | Sim |
| Validação estrita (Zod): tipos, faixas físicas, campos extras rejeitados, ao menos uma variável | `src/lib/security/validation.ts` | Sim |
| Limite de tamanho do corpo (1 KB) e `Content-Type` obrigatório | rota de ingestão | Sim |
| Limitação de frequência: leitura 120/min/IP; ingestão 30/min/IP antes da autenticação; 1 medição/10 s por estação | `src/lib/security/limiters.ts` | Sim |
| Erros genéricos ao público (sem stack trace nem detalhes internos) | `src/lib/http.ts`, `error.tsx` | Sim (respostas inspecionadas) |
| Logs sem credenciais (token nunca registrado; firmware não imprime o token) | `logEvent`, firmware | Sim (teste verifica ausência do token no log) |
| Configuração validada; erros citam nomes de variáveis, nunca valores | `src/lib/config.ts` | Sim |
| Cabeçalhos: CSP, HSTS (produção), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; `X-Powered-By` removido | `next.config.ts` | Sim (inspecionados em servidor de produção local) |
| RLS: anon/authenticated leem só estações públicas e colunas públicas; sem INSERT/UPDATE/DELETE | `supabase/migrations/` | Sim — PostgreSQL embutido (PGlite) com papéis simulados; teste de mutação confirmou que o teste detecta permissão indevida |
| `service_role` sem UPDATE/DELETE (nem o servidor apaga medições) | migração | Sim |
| Chave secreta do Supabase só no servidor (sem prefixo `NEXT_PUBLIC_`), só na rota de ingestão | `supabase-repository.ts` | Revisão de código; teste confirma uso da chave certa em cada operação |
| Firmware sem credenciais do banco; HTTPS com CA fixada; HTTP só com opção explícita de bancada | `firmware/` | **Não testado** (firmware ainda não compilado) |
| QR Code contém apenas a URL pública; URLs temporárias/locais/HTTP recusadas | `src/lib/qr-policy.ts`, `scripts/gerar-qrcodes.mjs` | Sim |
| Auditoria de dependências | `npm audit` | Sim — 0 vulnerabilidades em 14/10/2026 |

## Limitações conhecidas

1. **Rate limit em memória** é por instância. Em hospedagem serverless com várias instâncias,
   complementar com o firewall/WAF da hospedagem.
2. **CSP com `'unsafe-inline'` em scripts**: o Next.js injeta scripts inline de hidratação. Migrar
   para CSP com *nonce* é uma melhoria futura.
3. **Página de estação inexistente** responde com status 200 (conteúdo “não encontrada” e
   `noindex`) por causa do carregamento em streaming. Sem impacto de segurança.
4. **RLS testada em PGlite**, não em um projeto Supabase real. Após criar o projeto, repetir os
   testes contra ele (ver DEPLOY.md, “Verificação pós-deploy”).
5. **Token do dispositivo fica no flash do ESP32.** Quem tiver acesso físico à placa pode extraí-lo.
   Mitigação: token só envia medições daquela estação; revogação = trocar o hash no servidor.
6. **Modo `local`** usa HTTP na rede local; destina-se apenas a bancada.

## Rotina antes de cada commit

```bash
git status && git diff --cached --stat
git diff --cached | grep -nE "sb_secret|service_role|BEGIN (RSA|EC|OPENSSH)|AERYS_TOKEN \"[A-Za-z0-9_-]{32}" || echo "ok"
npm run check
```

## Política de acesso aos dados (resumo)

| Papel | estacoes | medicoes | Função `medicoes_agregadas` |
|---|---|---|---|
| anon / authenticated | SELECT onde `publico = true` | SELECT de colunas públicas, só de estações públicas | Executa com as permissões de quem chama |
| service_role (servidor) | SELECT, INSERT | SELECT, INSERT | Sim |
| UPDATE / DELETE | Ninguém (via API) | Ninguém (via API) | — |

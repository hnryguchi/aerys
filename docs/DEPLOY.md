# Deploy (Vercel + Supabase)

_Atualizado em 14/10/2026. **Nada foi publicado.** Todo passo que cria conta, projeto, domínio ou
recurso remoto depende de autorização explícita do titular do projeto._

Ambos têm plano gratuito suficiente para o protótipo. Verifique os termos vigentes antes de aderir;
não ative recursos pagos.

## 1. Supabase (banco)

1. Crie um projeto com **sua conta pessoal** (região próxima: São Paulo, se disponível).
2. SQL Editor → execute, em ordem:
   - `supabase/migrations/20261014000000_estacoes_medicoes.sql`
   - `supabase/seed.sql`
3. Settings → API: copie a **Project URL**, a chave **publishable** e a chave **secret**.
4. Não crie nenhuma política adicional sem revisar `docs/SEGURANCA.md`.

## 2. Vercel (site)

1. Importe o repositório privado `aerys` com **sua conta pessoal**. O repositório continua privado;
   apenas o site fica público.
2. Variáveis de ambiente (Production):

| Variável | Valor |
|---|---|
| `AERYS_DATA_SOURCE` | `supabase` |
| `NEXT_PUBLIC_SITE_URL` | URL definitiva (ex.: `https://aerys-xxxx.vercel.app` ou domínio próprio) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | chave publishable |
| `SUPABASE_SECRET_KEY` | chave secret (**nunca** com prefixo `NEXT_PUBLIC_`) |
| `AERYS_DEVICE_TOKENS` | `aerys-001:<hash>` (de `npm run device:token`) |

3. Deploy. Anote a URL.

> Sobre a URL: um subdomínio `*.vercel.app` com o nome do projeto é estável enquanto o projeto
> existir, mas um domínio próprio é mais adequado para QR Codes impressos de longo prazo.
> Compra de domínio e alteração de DNS dependem de autorização.

## 3. Verificação pós-deploy (antes de gerar QR Codes definitivos)

```bash
SITE=https://SUA-URL
curl -s -o /dev/null -w "%{http_code}\n" $SITE/painel                       # 200
curl -s -o /dev/null -w "%{http_code}\n" -X POST $SITE/api/v1/estacoes      # 405
curl -s -w " %{http_code}\n" -X POST $SITE/api/v1/ingestao \
  -H 'content-type: application/json' -H 'x-aerys-station: aerys-001' \
  -d '{"temperatura_c":20,"umidade_pct":50,"pressao_hpa":1000}'             # 401
curl -sI $SITE/painel | grep -i content-security-policy                     # presente
```

E com a chave **publishable**, confirme que o banco recusa escrita direta:

```bash
curl -s -w " %{http_code}\n" -X POST "$SUPABASE_URL/rest/v1/medicoes" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" -H 'content-type: application/json' \
  -d '{"estacao_id":"aerys-001","temperatura_c":20}'                        # 401/403
```

## 4. Firmware e QR

1. Ajuste `secrets.h`: `AERYS_URL_INGESTAO="https://SUA-URL/api/v1/ingestao"`, CA raiz, sem `AERYS_PERMITIR_HTTP`.
2. Grave e confirme `HTTP 201` no Monitor Serial e **Online** no site.
3. `npm run qr -- --site https://SUA-URL` → `saida/qrcodes/aerys-001.svg|png`.

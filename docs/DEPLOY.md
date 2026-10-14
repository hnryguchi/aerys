# Deploy (Vercel + Supabase pelo Marketplace da Vercel)

_Atualizado em 14/10/2026. Passos com conta, projeto ou recurso remoto são executados pelo titular,
com a própria conta. **Chaves e tokens nunca devem ser colados em conversas, issues ou commits.**_

Use sempre os planos **gratuitos** (Hobby na Vercel, Free no Supabase). Não ative recursos pagos.

## Etapa 1 — Site no ar em modo demonstração (≈ 5 min)

1. Vercel → **Add New… → Project** → **Import Git Repository**.
   - Se `hnryguchi/aerys` não aparecer: **Adjust GitHub App Permissions** → *Only select repositories* →
     marque apenas `aerys`. O repositório **continua privado**; só o site fica público.
2. Framework: Next.js (detectado). Em **Environment Variables**, adicione:
   - `AERYS_DATA_SOURCE` = `demo`
3. **Deploy**. Anote a URL de produção (ex.: `https://NOME-DO-PROJETO.vercel.app`).
4. Settings → Environment Variables → adicione `NEXT_PUBLIC_SITE_URL` = essa URL (sem `/` no fim)
   → Deployments → **Redeploy**.

Neste ponto o site já funciona publicamente, com o aviso “Dados demonstrativos”.

## Etapa 2 — Banco de dados (Supabase criado pela própria Vercel)

1. No projeto da Vercel: aba **Storage** → **Create Database** → **Supabase** → plano **Free**,
   região mais próxima (ex.: São Paulo) → **Connect** ao projeto (ambientes Production e Preview).
   A Vercel cria a conta/projeto Supabase e **injeta as variáveis** (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, …) automaticamente — você não copia chave nenhuma.
2. Ainda em Storage, clique no banco → **Open in Supabase** → **SQL Editor** → **New query**:
   - cole o conteúdo de `supabase/migrations/20261014000000_estacoes_medicoes.sql` → **Run**;
   - nova query com o conteúdo de `supabase/seed.sql` → **Run**.
   Ambos devem terminar com “Success. No rows returned”.
3. **Não** crie políticas, tabelas ou chaves adicionais sem revisar `docs/SEGURANCA.md`.

> Atenção: a integração também cria variáveis `NEXT_PUBLIC_SUPABASE_*`. A chave *anon* é pública por
> natureza (protegida pela RLS); a **service role** nunca recebe prefixo `NEXT_PUBLIC_` — confira.

## Etapa 3 — Token da placa e ativação dos dados reais

1. **Em um terminal seu, fora de qualquer assistente** (PowerShell comum), na pasta do projeto:
   ```
   npm run device:token -- aerys-001
   ```
   - a linha `#define AERYS_TOKEN "..."` vai para `firmware/aerys-estacao/secrets.h`;
   - a linha `AERYS_DEVICE_TOKENS=aerys-001:...` vai para a Vercel (próximo passo).
2. Vercel → Settings → Environment Variables:
   - `AERYS_DEVICE_TOKENS` = `aerys-001:<hash>` (marque **Sensitive**)
   - altere `AERYS_DATA_SOURCE` para `supabase`
3. **Redeploy**. A estação passa a mostrar “Sem dados” (correto: nenhuma medição real ainda).

## Etapa 4 — Placa enviando

`secrets.h`: Wi-Fi, `AERYS_TOKEN`, `AERYS_URL_INGESTAO = "https://SUA-URL/api/v1/ingestao"` e a CA raiz
(ver `firmware/README.md`). Grave a placa; o Monitor Serial deve mostrar `HTTP 201` e o site, **Online**.

## Verificação pós-deploy (pode ser feita por qualquer pessoa, só usa endpoints públicos)

```bash
SITE=https://SUA-URL
curl -s -o /dev/null -w "%{http_code}\n" $SITE/painel                       # 200
curl -s -o /dev/null -w "%{http_code}\n" -X POST $SITE/api/v1/estacoes      # 405
curl -s -w " %{http_code}\n" -X POST $SITE/api/v1/ingestao \
  -H 'content-type: application/json' -H 'x-aerys-station: aerys-001' \
  -d '{"temperatura_c":20,"umidade_pct":50,"pressao_hpa":1000}'             # 401 (ou 503 no modo demo)
curl -sI $SITE/painel | grep -i content-security-policy                     # presente
```

E a escrita direta no banco com a chave pública deve ser recusada (RLS) — teste no próprio
SQL Editor do Supabase:

```sql
set role anon;
insert into public.medicoes (estacao_id, temperatura_c) values ('aerys-001', 20);  -- deve dar "permission denied"
reset role;
```

## QR Code definitivo

Com a URL de produção confirmada: `npm run qr -- --site https://SUA-URL` → `saida/qrcodes/aerys-001.svg|png`.
Ou abra `https://SUA-URL/estacao/aerys-001/qr` (sem o aviso de TESTE quando `NEXT_PUBLIC_SITE_URL` está correta).

> URL `*.vercel.app` é estável enquanto o projeto existir. Para QR impresso de longo prazo, um domínio
> próprio é melhor — compra de domínio e DNS dependem de autorização.

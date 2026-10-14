#!/usr/bin/env bash
# Aplica a migração em um PostgreSQL descartável (Docker) que simula os papéis do
# Supabase (anon, authenticated, service_role com BYPASSRLS) e executa rls.test.sql.
# Não acessa nenhum serviço remoto. O contêiner é removido ao final.
set -euo pipefail
cd "$(dirname "$0")/../.."

NAME="aerys-rls-test-$$"
PW="teste-local-$$"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD="$PW" postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U postgres -q 2>/dev/null && break
  sleep 1
done
sleep 1

psql_run() { docker exec -i "$NAME" psql -v ON_ERROR_STOP=1 -q -U postgres -d postgres "$@"; }

psql_run <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
SQL

psql_run < supabase/migrations/20261014000000_estacoes_medicoes.sql
psql_run < supabase/seed.sql
psql_run -t < supabase/tests/rls.test.sql

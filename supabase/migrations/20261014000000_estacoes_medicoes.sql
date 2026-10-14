-- AERYS — esquema inicial: estações e medições
-- Princípios:
--   * Leitura anônima apenas de estações marcadas como públicas e de suas medições.
--   * Nenhuma escrita/alteração/exclusão por anon ou authenticated.
--   * Escrita somente pelo servidor (rota de ingestão) com a chave secreta (papel service_role).

-- ---------- Tabelas ----------

create table public.estacoes (
  id                    text primary key check (id ~ '^aerys-[0-9]{3}$'),
  nome                  text not null check (char_length(nome) between 1 and 80),
  descricao             text not null default '' check (char_length(descricao) <= 500),
  localizacao           text check (char_length(localizacao) <= 160),
  intervalo_esperado_s  integer not null default 60 check (intervalo_esperado_s between 10 and 3600),
  sensores              text[] not null default '{}',
  publico               boolean not null default false,
  criado_em             timestamptz not null default now()
);

comment on table public.estacoes is 'Estações AERYS. Somente linhas com publico = true são legíveis anonimamente.';

create table public.medicoes (
  id             bigint generated always as identity primary key,
  estacao_id     text not null references public.estacoes (id) on delete restrict,
  medido_em      timestamptz not null default now(),
  temperatura_c  real check (temperatura_c between -40 and 85),
  umidade_pct    real check (umidade_pct between 0 and 100),
  pressao_hpa    real check (pressao_hpa between 300 and 1100),
  rssi_dbm       smallint check (rssi_dbm between -127 and 0),
  firmware       text check (char_length(firmware) <= 32),
  constraint medicoes_alguma_variavel check (
    temperatura_c is not null or umidade_pct is not null or pressao_hpa is not null
  )
);

comment on table public.medicoes is 'Medições recebidas pela rota de ingestão (horário = recebimento no servidor).';

create index medicoes_estacao_tempo_idx on public.medicoes (estacao_id, medido_em desc);

-- ---------- Privilégios (menor privilégio) ----------
-- O Supabase concede privilégios amplos por padrão a anon/authenticated; revogamos tudo
-- e concedemos apenas SELECT.

revoke all on table public.estacoes from anon, authenticated;
revoke all on table public.medicoes from anon, authenticated;
grant select on table public.estacoes to anon, authenticated;
grant select (estacao_id, medido_em, temperatura_c, umidade_pct, pressao_hpa) on table public.medicoes to anon, authenticated;

grant select, insert on table public.estacoes to service_role;
grant select, insert on table public.medicoes to service_role;

-- ---------- RLS ----------

alter table public.estacoes enable row level security;
alter table public.medicoes enable row level security;
alter table public.estacoes force row level security;
alter table public.medicoes force row level security;

create policy estacoes_leitura_publica on public.estacoes
  for select to anon, authenticated
  using (publico);

create policy medicoes_leitura_publica on public.medicoes
  for select to anon, authenticated
  using (exists (select 1 from public.estacoes e where e.id = estacao_id and e.publico));

-- Escrita apenas pelo servidor. service_role ignora RLS no Supabase (BYPASSRLS);
-- a política abaixo documenta a intenção e cobre ambientes sem BYPASSRLS.
create policy medicoes_insercao_servidor on public.medicoes
  for insert to service_role
  with check (true);

create policy estacoes_leitura_servidor on public.estacoes
  for select to service_role
  using (true);

-- Nenhuma política de UPDATE/DELETE: alterações e exclusões ficam bloqueadas para todos
-- os papéis sujeitos a RLS. Correções de dados devem ser feitas por migração revisada.

-- ---------- Série agregada (leitura pública) ----------

create or replace function public.medicoes_agregadas(
  p_estacao text,
  p_desde timestamptz,
  p_bucket_minutos integer
)
returns table (
  bucket timestamptz,
  temperatura_c real,
  umidade_pct real,
  pressao_hpa real
)
language sql
stable
security invoker          -- respeita RLS de quem chama
set search_path = ''
as $$
  select
    date_bin(make_interval(mins => greatest(1, least(p_bucket_minutos, 1440))), m.medido_em, timestamptz '2000-01-01') as bucket,
    avg(m.temperatura_c)::real,
    avg(m.umidade_pct)::real,
    avg(m.pressao_hpa)::real
  from public.medicoes m
  where m.estacao_id = p_estacao
    and m.medido_em >= greatest(p_desde, now() - interval '31 days')
  group by 1
  order by 1;
$$;

revoke all on function public.medicoes_agregadas(text, timestamptz, integer) from public;
grant execute on function public.medicoes_agregadas(text, timestamptz, integer) to anon, authenticated, service_role;

-- AERYS: sensor de qualidade do ar (ENS160 + AHT21) e local da Mostra JCC 2026.
-- Colunas novas são opcionais: estações sem o sensor continuam gravando só o clima.

alter table public.medicoes
  add column eco2_ppm integer check (eco2_ppm between 400 and 65000),
  add column tvoc_ppb integer check (tvoc_ppb between 0 and 65000),
  add column iqa_uba  smallint check (iqa_uba between 1 and 5);

comment on column public.medicoes.eco2_ppm is 'CO2 equivalente estimado pelo ENS160 (ppm).';
comment on column public.medicoes.tvoc_ppb is 'Compostos orgânicos voláteis totais, ENS160 (ppb).';
comment on column public.medicoes.iqa_uba  is 'Índice de qualidade do ar do ENS160, escala UBA (1 excelente a 5 muito ruim).';

alter table public.medicoes drop constraint medicoes_alguma_variavel;
alter table public.medicoes add constraint medicoes_alguma_variavel check (
  temperatura_c is not null or umidade_pct is not null or pressao_hpa is not null or eco2_ppm is not null
);

-- Leitura pública das novas variáveis (rssi_dbm e firmware continuam restritos).
grant select (eco2_ppm, tvoc_ppb, iqa_uba) on table public.medicoes to anon, authenticated;

-- Série agregada passa a incluir o ar. O tipo de retorno muda, então a função é recriada.
drop function public.medicoes_agregadas(text, timestamptz, integer);

create function public.medicoes_agregadas(
  p_estacao text,
  p_desde timestamptz,
  p_bucket_minutos integer
)
returns table (
  bucket timestamptz,
  temperatura_c real,
  umidade_pct real,
  pressao_hpa real,
  eco2_ppm real,
  tvoc_ppb real,
  iqa_uba real
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_bin(make_interval(mins => greatest(1, least(p_bucket_minutos, 1440))), m.medido_em, timestamptz '2000-01-01') as bucket,
    avg(m.temperatura_c)::real,
    avg(m.umidade_pct)::real,
    avg(m.pressao_hpa)::real,
    avg(m.eco2_ppm)::real,
    avg(m.tvoc_ppb)::real,
    avg(m.iqa_uba)::real
  from public.medicoes m
  where m.estacao_id = p_estacao
    and m.medido_em >= greatest(p_desde, now() - interval '31 days')
  group by 1
  order by 1;
$$;

revoke all on function public.medicoes_agregadas(text, timestamptz, integer) from public;
grant execute on function public.medicoes_agregadas(text, timestamptz, integer) to anon, authenticated, service_role;

-- Estação na Mostra JCC 2026 (Museu de Arte do Rio) com o novo sensor.
update public.estacoes
set localizacao = 'Museu de Arte do Rio (MAR) · Praça Mauá, 5, Centro, Rio de Janeiro',
    descricao   = 'Primeira estação do projeto: ESP32 com sensores de clima (temperatura, umidade e pressão), de qualidade do ar e display OLED.',
    sensores    = array[
      'Temperatura, umidade e pressão (AHT20 + BMP280)',
      'Qualidade do ar: CO₂ estimado e compostos voláteis (ENS160 + AHT21)'
    ]
where id = 'aerys-001';

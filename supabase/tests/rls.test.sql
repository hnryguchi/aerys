-- Testes de permissões (executados por run-rls-test.sh em um PostgreSQL descartável).
-- Cada bloco falha (RAISE EXCEPTION) se a permissão estiver errada.
\set ON_ERROR_STOP on

-- Dados de teste: estação pública com medição + estação privada com medição.
insert into public.estacoes (id, nome, publico) values ('aerys-900', 'Privada de teste', false);
insert into public.medicoes (estacao_id, temperatura_c, umidade_pct, pressao_hpa) values ('aerys-001', 24.5, 60, 1012.0);
insert into public.medicoes (estacao_id, temperatura_c, umidade_pct, pressao_hpa) values ('aerys-900', 30.0, 40, 1000.0);

-- ===== anon =====
set role anon;

do $$ begin
  if (select count(*) from public.estacoes) <> 1 then raise exception 'anon deveria ver só a estação pública'; end if;
  if exists (select 1 from public.estacoes where id = 'aerys-900') then raise exception 'anon viu estação privada'; end if;
  if (select count(*) from public.medicoes where estacao_id = 'aerys-001') <> 1 then raise exception 'anon deveria ler medições públicas'; end if;
  if exists (select 1 from public.medicoes where estacao_id = 'aerys-900') then raise exception 'anon leu medição privada'; end if;
  if (select count(*) from public.medicoes_agregadas('aerys-900', now() - interval '1 day', 10)) <> 0 then raise exception 'RPC vazou estação privada'; end if;
  if (select count(*) from public.medicoes_agregadas('aerys-001', now() - interval '1 day', 10)) <> 1 then raise exception 'RPC deveria agregar estação pública'; end if;
end $$;

do $$ begin
  begin insert into public.medicoes (estacao_id, temperatura_c) values ('aerys-001', 1); raise exception 'FALHA: anon inseriu medição';
  exception when insufficient_privilege then null; end;
  begin update public.medicoes set temperatura_c = 99; raise exception 'FALHA: anon alterou medição';
  exception when insufficient_privilege then null; end;
  begin delete from public.medicoes; raise exception 'FALHA: anon excluiu medição';
  exception when insufficient_privilege then null; end;
  begin insert into public.estacoes (id, nome, publico) values ('aerys-901', 'x', true); raise exception 'FALHA: anon criou estação';
  exception when insufficient_privilege then null; end;
  begin update public.estacoes set publico = true; raise exception 'FALHA: anon alterou estação';
  exception when insufficient_privilege then null; end;
  begin perform rssi_dbm from public.medicoes limit 1; raise exception 'FALHA: anon leu coluna técnica rssi_dbm';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ===== authenticated (mesmas regras de anon) =====
set role authenticated;
do $$ begin
  if exists (select 1 from public.estacoes where id = 'aerys-900') then raise exception 'authenticated viu estação privada'; end if;
  begin insert into public.medicoes (estacao_id, temperatura_c) values ('aerys-001', 1); raise exception 'FALHA: authenticated inseriu';
  exception when insufficient_privilege then null; end;
  begin delete from public.medicoes; raise exception 'FALHA: authenticated excluiu';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ===== service_role (servidor) =====
set role service_role;
do $$ begin
  insert into public.medicoes (estacao_id, temperatura_c, umidade_pct, pressao_hpa) values ('aerys-001', 22.0, 55, 1013.0);
  begin update public.medicoes set temperatura_c = 0; raise exception 'FALHA: service_role alterou (não deveria ter UPDATE)';
  exception when insufficient_privilege then null; end;
  begin delete from public.medicoes; raise exception 'FALHA: service_role excluiu (não deveria ter DELETE)';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ===== Restrições de domínio =====
do $$ begin
  begin insert into public.medicoes (estacao_id, umidade_pct) values ('aerys-001', 150); raise exception 'FALHA: aceitou umidade 150';
  exception when check_violation then null; end;
  begin insert into public.medicoes (estacao_id) values ('aerys-001'); raise exception 'FALHA: aceitou medição vazia';
  exception when check_violation then null; end;
  begin insert into public.medicoes (estacao_id, temperatura_c) values ('aerys-777', 20); raise exception 'FALHA: aceitou estação inexistente';
  exception when foreign_key_violation then null; end;
end $$;

select 'RLS_OK' as resultado;

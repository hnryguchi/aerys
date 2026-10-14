-- Cadastro da primeira estação. Sem medições: dados reais chegam apenas pela ingestão.
insert into public.estacoes (id, nome, descricao, localizacao, intervalo_esperado_s, sensores, publico)
values (
  'aerys-001',
  'AERYS-001',
  'Primeira estação do projeto: protótipo com ESP32, sensor de temperatura, umidade e pressão e display OLED.',
  null,
  60,
  array['Temperatura, umidade e pressão (AHT20 + BMP280 ou BME280)'],
  true
)
on conflict (id) do nothing;

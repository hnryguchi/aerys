# Changelog

## [0.2.0] · 20/11/2026

### Adicionado
- Qualidade do ar (ENS160 + AHT21): CO₂ estimado, compostos voláteis e índice de 1 a 5 na ingestão, no banco e no site.
- Página da estação mais interativa: resumo "Como está o ar aqui agora?", escala de qualidade do ar tocável, sensação térmica com dica, contador "ao vivo", explicação de cada medida e seletor de gráfico.
- Local de instalação (Museu de Arte do Rio, Mostra JCC 2026) com link para o mapa.
- Migração `20261120000000_qualidade_ar.sql` (colunas opcionais, leitura pública, série agregada) e testes.

### Alterado
- Next.js 16.4.1 → 16.4.6 (correções de segurança).
- Leitura do Supabase tolera banco ainda sem as colunas do sensor de ar; firmware antigo continua aceito.

## [0.1.0] — 14/10/2026 (não publicado)

### Adicionado
- Interface pública: início, painel, página por estação (`/estacao/aerys-001`), sobre, página de QR Code.
- Gráficos de 24 h e 7 dias (temperatura, umidade, pressão) com tooltip, teclado e tabela.
- Estados de carregamento, erro, ausência de dados e offline; PWA instalável.
- Fontes de dados `demo` (sinalizada), `local` (bancada) e `supabase`.
- API pública somente leitura e ingestão autenticada por dispositivo.
- Migração PostgreSQL com RLS, seed da estação AERYS-001 e testes de permissões.
- Firmware ESP32 (AHT20 + BMP280 + OLED) — não compilado nesta versão.
- Scripts de geração de token de dispositivo e de QR Codes definitivos.
- Documentação: arquitetura, segurança, hardware, deploy, apresentação, decisões, PI.

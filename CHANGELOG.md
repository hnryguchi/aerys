# Changelog

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

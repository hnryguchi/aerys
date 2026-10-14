# Registro de decisões

Formato: data · decisão · motivo · alternativas consideradas.

## 14/10/2026

**D-001 · Projeto pessoal, isolado de recursos de terceiros.**
Pasta própria fora de pastas sincronizadas de trabalho; identidade Git configurada apenas no
repositório; nenhum código, credencial ou recurso de terceiros reutilizado.

**D-002 · Next.js 16 (App Router) + TypeScript.**
Uma base para páginas públicas, API de leitura e ingestão, com bom suporte a hospedagem gratuita.
Alternativas: SPA + backend separado (mais peças para manter).

**D-003 · Supabase (PostgreSQL) acessado via PostgREST com `fetch`, sem SDK.**
Menos dependências, controle explícito de qual chave é usada em cada operação.
Leitura com chave publicável (sujeita a RLS); escrita somente na rota de ingestão com chave secreta.

**D-004 · Autenticação do ESP32 por token próprio, com hash no servidor (variável de ambiente).**
Simples, revogável e sem credencial de banco no firmware. Para muitas estações, migrar para uma
tabela de dispositivos.

**D-005 · Horário da medição = horário de recebimento.**
O ESP32 não possui RTC; evita relógio errado e manipulação do horário pelo dispositivo.

**D-006 · Três fontes de dados (`demo`, `local`, `supabase`), nunca misturadas.**
Permite desenvolver sem hardware (com aviso explícito) e testar na bancada sem nuvem.

**D-007 · Gráficos em SVG próprio, um gráfico por variável (um eixo cada).**
Evita dependência de biblioteca de gráficos e eixos duplos. Cores validadas para daltonismo nos
temas claro e escuro; cada gráfico tem título, rótulo do último valor, tooltip e tabela alternativa.

**D-008 · Estado “Online” apenas com evidência.**
Última medição real há no máximo max(3 × intervalo esperado, 5 min).

**D-009 · Testes de RLS em PostgreSQL embutido (PGlite).**
Docker não disponível no ambiente; PGlite executa a migração real com papéis simulados.
Deve ser repetido contra o projeto Supabase real após o deploy.

**D-010 · Sem licença open source.**
`UNLICENSED` / todos os direitos reservados até decisão do titular.

## Nota de procedência

O desenvolvimento desta versão contou com o auxílio de ferramentas de assistência à programação,
sob direção e revisão do titular do projeto. As dependências de terceiros mantêm suas licenças
originais (ver `package-lock.json` e `node_modules/*/LICENSE`).

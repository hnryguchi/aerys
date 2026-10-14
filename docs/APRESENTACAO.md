# Apresentação de 5 minutos — roteiro

_Preparado em 14/10/2026 para a apresentação de sábado, 17/10/2026._

## Roteiro (≈ 5 min)

| Tempo | Conteúdo | O que mostrar |
|---|---|---|
| 0:00–0:40 | **Problema**: dados ambientais urbanos são escassos, caros ou difíceis de entender | Página inicial |
| 0:40–1:30 | **Proposta**: estações de baixo custo + painel público acessível por QR Code | Hero + “Como os dados chegam até você” |
| 1:30–2:30 | **Hardware**: ESP32, AHT20 + BMP280, OLED | A placa ligada, display mostrando as leituras |
| 2:30–3:45 | **Demonstração ao vivo**: público escaneia o QR e vê a estação no celular | `/estacao/aerys-001/qr` projetado; depois a página da estação |
| 3:45–4:30 | **Segurança e honestidade dos dados**: envio autenticado, público só lê, estado “Online” só com dado real, aviso em dados simulados | Selo de status; aviso de demonstração (se aplicável) |
| 4:30–5:00 | **Próximos passos**: PM2.5, mais estações, parcerias com escolas | Página “Sobre” |

## Três cenários possíveis no sábado

**A — Site publicado e placa enviando (ideal).** Exige, até sexta: autorização e criação das contas
pessoais (Supabase, Vercel), deploy, gravação do firmware e teste. QR definitivo.

**B — Placa enviando para o notebook (rede local).** Funciona sem nuvem: notebook com
`npm run dev:lan` em modo `local` e a placa na mesma rede (por exemplo, o roteador do celular).
O público vê pelo notebook projetado; o QR desta situação é **de teste** (a página avisa) e
só funciona para quem estiver na mesma rede.

**C — Sem placa conectada.** Modo `demo`, com o aviso “Dados demonstrativos — não são medições
reais” visível. A placa pode ser mostrada fisicamente com o display ligado.

Recomendação: preparar **B como garantia** e tentar **A**. Não apresentar dados demonstrativos
como reais em nenhum cenário.

## Checklist do dia

- [ ] Carregador/powerbank da placa e cabo USB de dados
- [ ] Notebook com `npm run build` feito e `.env.local` correto
- [ ] Teste do Wi-Fi do local (ou roteador do celular)
- [ ] QR impresso ou projetado — conferir que abre a URL certa em um celular antes de começar
- [ ] Aba da página da estação já aberta como plano de contingência
- [ ] Frases a evitar: “estação instalada”, “dados validados”, “usuários” — o projeto é um protótipo

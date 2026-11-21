// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sobre o projeto" };

export default function SobrePage() {
  return (
    <div className="container page prose">
      <p className="eyebrow">Sobre</p>
      <h1>Sobre o AERYS</h1>
      <p>
        O AERYS é uma plataforma de monitoramento ambiental urbano que busca tornar dados ambientais mais acessíveis a
        estudantes, professores e moradores e, no futuro, a pesquisadores e gestores públicos.
      </p>

      <h2>Situação atual</h2>
      <p>
        O projeto está em fase de <strong>protótipo</strong>. A primeira estação (AERYS-001) usa componentes de baixo
        custo e está em desenvolvimento e testes. As medições exibidas pela plataforma <strong>não passaram por validação
        científica</strong> nem por calibração contra instrumentos de referência; servem para fins educativos e de
        acompanhamento de tendências.
      </p>
      <p>
        Quando a plataforma estiver exibindo dados simulados, isso é indicado com o aviso
        “Dados demonstrativos: não são medições reais”.
      </p>

      <h2>Hardware da primeira estação</h2>
      <ul>
        <li>Microcontrolador ESP32 (Wi-Fi integrado).</li>
        <li>Sensor digital de temperatura, umidade relativa e pressão atmosférica (AHT20 + BMP280 ou BME280).</li>
        <li>Display OLED de 0,96″ para leitura local.</li>
      </ul>

      <h2>Como funciona</h2>
      <p>
        A estação lê os sensores e envia as medições pela internet a um endpoint autenticado, com uma credencial exclusiva
        do dispositivo. O servidor valida os dados, registra o horário de recebimento e os armazena. O painel público
        apenas <em>consulta</em> essas medições. Não é possível enviar, alterar ou excluir dados pelas páginas públicas.
      </p>

      <h2>Estado de conexão</h2>
      <ul>
        <li>
          <strong>Online</strong>: a estação enviou dados recentemente.
        </li>
        <li>
          <strong>Sem comunicação</strong>: não há envio recente; os últimos dados podem estar desatualizados.
        </li>
        <li>
          <strong>Sem dados</strong>: nenhuma medição foi recebida ainda.
        </li>
        <li>
          <strong>Demonstração</strong>: dados simulados; não há estação física conectada.
        </li>
      </ul>

      <h2>Limitações</h2>
      <ul>
        <li>Sensores de baixo custo têm incerteza maior que equipamentos profissionais.</li>
        <li>A posição da estação (sol, abrigo, ventilação) influencia fortemente a temperatura medida.</li>
        <li>Falhas de energia ou de Wi-Fi geram lacunas no histórico, que são exibidas como interrupções no gráfico.</li>
      </ul>

      <h2>Próximos passos</h2>
      <ul>
        <li>Instalação e testes de campo da primeira estação.</li>
        <li>Sensores de material particulado (PM2.5).</li>
        <li>Novas estações e comparação entre bairros.</li>
      </ul>

      <h2>Privacidade</h2>
      <p>
        As páginas públicas não exigem cadastro e não usam cookies de rastreamento. As estações enviam apenas dados
        ambientais e informações técnicas do dispositivo (como intensidade do sinal Wi-Fi e versão do firmware).
      </p>
    </div>
  );
}

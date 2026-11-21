import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AirNow } from "@/components/AirNow";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DemoBanner } from "@/components/DemoBanner";
import { LineChart } from "@/components/LineChart";
import { MetricTile } from "@/components/MetricTile";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepository, getSnapshot } from "@/lib/data";
import { PERIOD_CONFIG } from "@/lib/domain/aggregate";
import { getMetric, METRICS, METRICS_AR, METRICS_CLIMA } from "@/lib/domain/metrics";
import { STATUS_LABEL } from "@/lib/domain/status";
import type { MetricKey } from "@/lib/domain/types";
import { formatAge, formatDateTime } from "@/lib/format";
import { parsePeriod, stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

/** Faixa de boas-vindas da Mostra JCC 2026 (some sozinha depois do evento). */
const MOSTRA_ATE = Date.parse("2026-11-25T03:00:00Z");

type Params = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Estação ${id.toUpperCase()}` };
}

function parseMetric(v: string | string[] | undefined): MetricKey | null {
  const s = Array.isArray(v) ? v[0] : v;
  return METRICS.find((m) => m.key === s)?.key ?? null;
}

export default async function EstacaoPage({ params, searchParams }: Params) {
  const { id } = await params;
  if (!stationIdSchema.safeParse(id).success) notFound();
  const sp = await searchParams;
  const period = parsePeriod(sp.periodo);

  const repo = getRepository();
  const now = new Date();
  const snap = await getSnapshot(repo, id, now);
  if (!snap) notFound();
  const history = await repo.getHistory(id, period, now);

  const { durationMs, bucketMs } = PERIOD_CONFIG[period];
  const toMs = now.getTime();
  const fromMs = toMs - durationMs;
  const { station, ultima, status } = snap;
  const demo = repo.source === "demo";

  const temAr = ultima?.eco2Ppm != null || history.some((h) => h.eco2Ppm != null);
  const metricasGrafico = temAr ? [...METRICS_AR, ...METRICS_CLIMA] : METRICS_CLIMA;
  const pedida = parseMetric(sp.metrica);
  const metrica = getMetric(pedida && metricasGrafico.some((m) => m.key === pedida) ? pedida : metricasGrafico[0]!.key);
  const link = (q: { periodo?: string; metrica?: string }) =>
    `/estacao/${id}?periodo=${q.periodo ?? period}&metrica=${q.metrica ?? metrica.key}`;

  return (
    <div className="container page">
      <AutoRefresh intervalMs={30_000} />
      {demo && <DemoBanner />}

      {toMs < MOSTRA_ATE && (
        <p className="mostra-strip">
          <span aria-hidden="true">👋</span> Você está na <strong>Mostra Jovens Cientistas Cariocas 2026</strong>. Esta é a estação que está na mesa, medindo o ar daqui.
        </p>
      )}

      <div className="station-head">
        <div>
          <p className="eyebrow">Estação</p>
          <h1 style={{ marginBottom: 6 }}>{station.nome}</h1>
          {station.localizacao ? (
            <p className="local">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span>
                {station.localizacao}{" "}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.localizacao)}`} target="_blank" rel="noopener noreferrer">
                  ver no mapa
                </a>
              </span>
            </p>
          ) : (
            <p className="muted" style={{ margin: 0 }}>Local de instalação a definir</p>
          )}
        </div>
        <div className="station-status">
          <StatusBadge status={status} />
          <span className="small muted">{STATUS_LABEL[status]}</span>
        </div>
      </div>

      <AirNow ultima={ultima} status={status} demo={demo} />

      {temAr && (
        <>
          <h2 className="group-title">Qualidade do ar</h2>
          <div className="grid grid-3">
            {METRICS_AR.map((m) => (
              <MetricTile key={m.key} metric={m.key} value={ultima?.[m.key] ?? null} />
            ))}
          </div>
        </>
      )}

      <h2 className="group-title">Clima</h2>
      <div className="grid grid-3">
        {METRICS_CLIMA.map((m) => (
          <MetricTile key={m.key} metric={m.key} value={ultima?.[m.key] ?? null} />
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        Última medição: <strong>{formatDateTime(ultima?.medidoEm)}</strong>
        {ultima && !demo && <> ({formatAge(ultima.medidoEm, now)})</>} · horário de Brasília · a página se atualiza sozinha
      </p>

      <div className="history-head">
        <h2 style={{ margin: 0 }}>Como mudou ao longo do tempo</h2>
        <nav className="segmented" aria-label="Período do histórico">
          {(["24h", "7d"] as const).map((p) => (
            <Link key={p} href={link({ periodo: p })} aria-current={p === period ? "true" : undefined} scroll={false} replace>
              {p === "24h" ? "24 horas" : "7 dias"}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="chips" aria-label="Escolha o que ver no gráfico">
        {metricasGrafico.map((m) => (
          <Link key={m.key} href={link({ metrica: m.key })} aria-current={m.key === metrica.key ? "true" : undefined} scroll={false} replace>
            <span className="metric-key" style={{ background: `var(${m.corVar})` }} aria-hidden="true" />
            {m.rotulo}
          </Link>
        ))}
      </nav>

      {history.length === 0 ? (
        <div className="card state">
          <h2>Ainda não há medições</h2>
          <p className="muted">Quando a estação enviar dados, o histórico aparecerá aqui.</p>
        </div>
      ) : (
        <section className="card chart-card" aria-labelledby={`h-${metrica.key}`}>
          <div className="chart-head">
            <h3 id={`h-${metrica.key}`}>
              <span className="metric-key" style={{ background: `var(${metrica.corVar})` }} aria-hidden="true" />
              {metrica.rotulo}
            </h3>
            <span className="small muted">{metrica.unidade}</span>
          </div>
          <p className="small muted" style={{ margin: "0 0 6px" }}>
            {metrica.explicacao} Toque no gráfico para ver cada horário.
          </p>
          <LineChart
            metric={metrica.key}
            period={period}
            fromMs={fromMs}
            toMs={toMs}
            bucketMs={bucketMs}
            points={history.map((h) => ({ t: Date.parse(h.medidoEm), v: h[metrica.key] ?? null }))}
          />
        </section>
      )}

      <section className="card" style={{ marginTop: 28 }}>
        <h2>Sobre esta estação</h2>
        <p className="muted">{station.descricao}</p>
        <dl className="kv">
          <dt>Identificador</dt>
          <dd>{station.id}</dd>
          <dt>Sensores</dt>
          <dd>{station.sensores.join(" · ") || "sem dado"}</dd>
          <dt>Envio esperado</dt>
          <dd>a cada {station.intervaloEsperadoS} s</dd>
          <dt>Fonte dos dados</dt>
          <dd>{demo ? "Simulação (demonstrativa)" : "Medições recebidas da estação"}</dd>
        </dl>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          <Link href={`/estacao/${id}/qr`}>QR Code desta estação</Link>
        </p>
      </section>
    </div>
  );
}

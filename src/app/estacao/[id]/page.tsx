import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DemoBanner } from "@/components/DemoBanner";
import { LineChart } from "@/components/LineChart";
import { MetricTile } from "@/components/MetricTile";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepository, getSnapshot } from "@/lib/data";
import { PERIOD_CONFIG } from "@/lib/domain/aggregate";
import { METRICS } from "@/lib/domain/metrics";
import { STATUS_LABEL } from "@/lib/domain/status";
import { formatAge, formatDateTime } from "@/lib/format";
import { parsePeriod, stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Estação ${id.toUpperCase()}` };
}

export default async function EstacaoPage({ params, searchParams }: Params) {
  const { id } = await params;
  if (!stationIdSchema.safeParse(id).success) notFound();
  const period = parsePeriod((await searchParams).periodo);

  const repo = getRepository();
  const now = new Date();
  const snap = await getSnapshot(repo, id, now);
  if (!snap) notFound();
  const history = await repo.getHistory(id, period, now);

  const { durationMs, bucketMs } = PERIOD_CONFIG[period];
  const toMs = now.getTime();
  const fromMs = toMs - durationMs;
  const { station, ultima, status } = snap;

  return (
    <div className="container page">
      <AutoRefresh />
      {repo.source === "demo" && <DemoBanner />}

      <div className="station-head">
        <div>
          <p className="eyebrow">Estação</p>
          <h1 style={{ marginBottom: 6 }}>{station.nome}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {station.localizacao ?? "Local de instalação a definir"}
          </p>
        </div>
        <div className="station-status">
          <StatusBadge status={status} />
          <span className="small muted">{STATUS_LABEL[status]}</span>
        </div>
      </div>

      <p className="small muted">
        Última medição: <strong>{formatDateTime(ultima?.medidoEm)}</strong>
        {ultima && repo.source !== "demo" && <> ({formatAge(ultima.medidoEm, now)})</>} · horário de Brasília
      </p>

      <div className="grid grid-3" style={{ margin: "12px 0 28px" }}>
        {METRICS.map((m) => (
          <MetricTile key={m.key} metric={m.key} value={ultima?.[m.key] ?? null} />
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Histórico</h2>
        <nav className="segmented" aria-label="Período do histórico">
          {(["24h", "7d"] as const).map((p) => (
            <Link key={p} href={`/estacao/${id}?periodo=${p}`} aria-current={p === period ? "true" : undefined} scroll={false} replace>
              {p === "24h" ? "24 horas" : "7 dias"}
            </Link>
          ))}
        </nav>
      </div>

      {history.length === 0 ? (
        <div className="card state">
          <h2>Ainda não há medições</h2>
          <p className="muted">Quando a estação enviar dados, o histórico aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid">
          {METRICS.map((m) => (
            <section key={m.key} className="card chart-card" aria-labelledby={`h-${m.key}`}>
              <div className="chart-head">
                <h3 id={`h-${m.key}`}>
                  <span className="metric-key" style={{ background: `var(${m.corVar})` }} aria-hidden="true" />
                  {m.rotulo}
                </h3>
                <span className="small muted">{m.unidade}</span>
              </div>
              <LineChart
                metric={m.key}
                period={period}
                fromMs={fromMs}
                toMs={toMs}
                bucketMs={bucketMs}
                points={history.map((h) => ({ t: Date.parse(h.medidoEm), v: h[m.key] }))}
              />
            </section>
          ))}
        </div>
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
          <dd>{repo.source === "demo" ? "Simulação (demonstrativa)" : "Medições recebidas da estação"}</dd>
        </dl>
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          <Link href={`/estacao/${id}/qr`}>QR Code desta estação</Link>
        </p>
      </section>
    </div>
  );
}

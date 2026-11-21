import Link from "next/link";
import { nivelAr } from "@/lib/domain/air";
import { METRICS_CLIMA } from "@/lib/domain/metrics";
import type { StationSnapshot } from "@/lib/domain/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function StationCard({ snap }: { snap: StationSnapshot }) {
  const { station, ultima, status } = snap;
  const ar = nivelAr(ultima);
  return (
    <article className="card" aria-labelledby={`st-${station.id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <h3 id={`st-${station.id}`} style={{ margin: 0 }}>
          <Link href={`/estacao/${station.id}`}>{station.nome}</Link>
        </h3>
        <StatusBadge status={status} />
      </div>
      <p className="small muted" style={{ marginBottom: 14 }}>
        {station.localizacao ?? "Local de instalação a definir"}
      </p>
      {ultima ? (
        <dl className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: 0 }}>
          {METRICS_CLIMA.map((m) => (
            <div key={m.key}>
              <dt className="small muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="metric-key" style={{ background: `var(${m.corVar})` }} aria-hidden="true" />
                {m.rotulo.split(" ")[0]}
              </dt>
              <dd style={{ margin: 0, fontWeight: 650, fontSize: "1.2rem", fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(ultima[m.key], m.casasDecimais)}
                <span className="small muted"> {m.unidade}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">Ainda não há medições desta estação.</p>
      )}
      {ar && (
        <p className="ar-pill" style={{ "--nivel": `var(${ar.corVar})` } as React.CSSProperties}>
          <span aria-hidden="true">{ar.emoji}</span> Qualidade do ar: <strong>{ar.rotulo}</strong>
        </p>
      )}
      <p className="small muted" style={{ margin: "14px 0 0" }}>
        Última medição: {formatDateTime(ultima?.medidoEm)}
      </p>
    </article>
  );
}

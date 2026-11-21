// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { getMetric } from "@/lib/domain/metrics";
import type { MetricKey } from "@/lib/domain/types";
import { formatNumber } from "@/lib/format";

export function MetricTile({ metric, value }: { metric: MetricKey; value: number | null }) {
  const d = getMetric(metric);
  return (
    <div className="card metric">
      <span className="metric-label">
        <span className="metric-key" style={{ background: `var(${d.corVar})` }} aria-hidden="true" />
        {d.rotulo}
      </span>
      <span className="metric-value">
        {formatNumber(value, d.casasDecimais)}
        {value !== null && <span className="metric-unit">{d.unidade}</span>}
      </span>
      {value === null && <span className="small muted">Sem leitura disponível</span>}
      <details className="metric-help">
        <summary>O que é isso?</summary>
        <p>{d.explicacao}</p>
      </details>
    </div>
  );
}

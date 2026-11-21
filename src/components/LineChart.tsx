// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMetric } from "@/lib/domain/metrics";
import type { MetricKey, Period } from "@/lib/domain/types";
import { formatDateTime, formatDay, formatNumber, formatTime } from "@/lib/format";

export interface ChartPoint {
  t: number;
  v: number | null;
}

interface Props {
  metric: MetricKey;
  period: Period;
  points: ChartPoint[];
  fromMs: number;
  toMs: number;
  bucketMs: number;
}

const H = 200;
const M = { top: 14, right: 58, bottom: 26, left: 46 };
const BRT_OFFSET_MS = -3 * 3600_000; // Brasil sem horário de verão desde 2019

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

function yDomain(values: number[]): { lo: number; hi: number; ticks: number[] } {
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1) {
    const mid = (hi + lo) / 2;
    lo = mid - 0.5;
    hi = mid + 0.5;
  }
  const step = niceStep(hi - lo, 4);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { lo, hi, ticks };
}

function xTicks(fromMs: number, toMs: number, period: Period): number[] {
  const step = period === "24h" ? 6 * 3600_000 : 24 * 3600_000;
  const first = Math.ceil((fromMs + BRT_OFFSET_MS) / step) * step - BRT_OFFSET_MS;
  const out: number[] = [];
  for (let t = first; t <= toMs; t += step) out.push(t);
  return out;
}

export function LineChart({ metric, period, points, fromMs, toMs, bucketMs }: Props) {
  const def = getMetric(metric);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const valid = useMemo(() => points.filter((p): p is { t: number; v: number } => p.v !== null), [points]);
  const last = valid.at(-1) ?? null;

  if (valid.length === 0) {
    return <div className="chart-empty">Sem medições de {def.rotulo.toLowerCase()} neste período.</div>;
  }

  const values = valid.map((p) => p.v);
  const { lo, hi, ticks } = yDomain(values);
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = H - M.top - M.bottom;
  const x = (t: number) => M.left + ((t - fromMs) / (toMs - fromMs)) * innerW;
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * innerH;

  // Segmentos contínuos: quebra quando há lacuna maior que 2 intervalos.
  const segments: { t: number; v: number }[][] = [];
  let cur: { t: number; v: number }[] = [];
  for (const p of valid) {
    const prev = cur.at(-1);
    if (prev && p.t - prev.t > bucketMs * 2.01) {
      segments.push(cur);
      cur = [];
    }
    cur.push(p);
  }
  if (cur.length) segments.push(cur);

  const linePath = (seg: { t: number; v: number }[]) => seg.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const areaPath = (seg: { t: number; v: number }[]) =>
    `${linePath(seg)}L${x(seg.at(-1)!.t).toFixed(1)},${M.top + innerH}L${x(seg[0]!.t).toFixed(1)},${M.top + innerH}Z`;

  const color = `var(${def.corVar})`;
  const fmt = (v: number) => formatNumber(v, def.casasDecimais);
  const activePoint = active !== null ? valid[active] : null;

  function nearestIndex(clientX: number): number {
    const rect = wrapRef.current!.getBoundingClientRect();
    const t = fromMs + ((clientX - rect.left - M.left) / innerW) * (toMs - fromMs);
    let best = 0;
    for (let i = 1; i < valid.length; i++) if (Math.abs(valid[i]!.t - t) < Math.abs(valid[best]!.t - t)) best = i;
    return best;
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const d = e.key === "ArrowLeft" ? -1 : 1;
      setActive((a) => Math.min(valid.length - 1, Math.max(0, (a ?? valid.length - 1) + (a === null ? 0 : d))));
    } else if (e.key === "Escape") setActive(null);
  }

  const summary = `${def.rotulo}, ${period === "24h" ? "últimas 24 horas" : "últimos 7 dias"}: mínima ${fmt(Math.min(...values))} ${def.unidade}, máxima ${fmt(Math.max(...values))} ${def.unidade}, mais recente ${fmt(last!.v)} ${def.unidade}.`;
  const tipLeft = activePoint ? Math.min(Math.max(x(activePoint.t) - 70, 0), Math.max(0, width - 150)) : 0;

  return (
    <>
      <div ref={wrapRef} className="chart-wrap" onPointerLeave={() => setActive(null)}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
            onPointerMove={(e) => setActive(nearestIndex(e.clientX))}
            onPointerDown={(e) => setActive(nearestIndex(e.clientX))}
          >
            {ticks.map((tv) => (
              <g key={tv}>
                <line x1={M.left} x2={M.left + innerW} y1={y(tv)} y2={y(tv)} stroke="var(--grid)" strokeWidth={1} />
                <text x={M.left - 8} y={y(tv)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--text-3)">
                  {formatNumber(tv, Number.isInteger(tv) ? 0 : 1, false)}
                </text>
              </g>
            ))}
            {xTicks(fromMs, toMs, period).map((t) => (
              <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--text-3)">
                {period === "24h" ? formatTime(t) : formatDay(t)}
              </text>
            ))}
            {segments.map((seg, i) => (
              <path key={`a${i}`} d={areaPath(seg)} fill={color} opacity={0.1} />
            ))}
            {segments.map((seg, i) =>
              seg.length === 1 ? (
                <circle key={`l${i}`} cx={x(seg[0]!.t)} cy={y(seg[0]!.v)} r={2.5} fill={color} />
              ) : (
                <path key={`l${i}`} d={linePath(seg)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ),
            )}
            {last && (
              <g>
                <circle cx={x(last.t)} cy={y(last.v)} r={4} fill={color} stroke="var(--surface)" strokeWidth={2} />
                <text x={x(last.t) + 8} y={y(last.v)} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--text)">
                  {fmt(last.v)} {def.unidade}
                </text>
              </g>
            )}
            {activePoint && (
              <g pointerEvents="none">
                <line x1={x(activePoint.t)} x2={x(activePoint.t)} y1={M.top} y2={M.top + innerH} stroke="var(--text-3)" strokeWidth={1} />
                <circle cx={x(activePoint.t)} cy={y(activePoint.v)} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {activePoint && (
          <div className="chart-tooltip" style={{ left: tipLeft }} role="status">
            {formatDateTime(new Date(activePoint.t).toISOString())}
            <br />
            <b>
              {fmt(activePoint.v)} {def.unidade}
            </b>
          </div>
        )}
      </div>
      <details className="table-view">
        <summary>Ver dados em tabela</summary>
        <div className="table-scroll">
          <table className="data">
            <caption className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              {summary}
            </caption>
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col">
                  {def.rotulo} ({def.unidade})
                </th>
              </tr>
            </thead>
            <tbody>
              {[...valid].reverse().map((p) => (
                <tr key={p.t}>
                  <td>{formatDateTime(new Date(p.t).toISOString())}</td>
                  <td>{fmt(p.v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

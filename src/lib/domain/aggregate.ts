import type { Measurement, Period } from "./types";

export const PERIOD_CONFIG: Record<Period, { durationMs: number; bucketMs: number }> = {
  "24h": { durationMs: 24 * 3600_000, bucketMs: 10 * 60_000 },
  "7d": { durationMs: 7 * 24 * 3600_000, bucketMs: 60 * 60_000 },
};

function mean(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null && Number.isFinite(x));
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/**
 * Agrupa medições em intervalos fixos (média por intervalo), alinhados à época Unix.
 * Intervalos sem medição não são preenchidos: lacunas permanecem visíveis no gráfico.
 */
export function bucketize(measurements: Measurement[], fromMs: number, toMs: number, bucketMs: number): Measurement[] {
  const groups = new Map<number, Measurement[]>();
  for (const m of measurements) {
    const t = Date.parse(m.medidoEm);
    if (Number.isNaN(t) || t < fromMs || t > toMs) continue;
    const b = Math.floor(t / bucketMs) * bucketMs;
    const g = groups.get(b);
    if (g) g.push(m);
    else groups.set(b, [m]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([b, g]) => ({
      stationId: g[0]!.stationId,
      medidoEm: new Date(b).toISOString(),
      temperaturaC: mean(g.map((m) => m.temperaturaC)),
      umidadePct: mean(g.map((m) => m.umidadePct)),
      pressaoHpa: mean(g.map((m) => m.pressaoHpa)),
      eco2Ppm: mean(g.map((m) => m.eco2Ppm ?? null)),
      tvocPpb: mean(g.map((m) => m.tvocPpb ?? null)),
      iqaUba: mean(g.map((m) => m.iqaUba ?? null)),
    }));
}

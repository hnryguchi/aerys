import { PERIOD_CONFIG } from "../domain/aggregate";
import { STATION_CATALOG } from "../domain/stations";
import type { Measurement, Period, Station } from "../domain/types";
import type { MeasurementReader } from "./repository";

/**
 * DADOS DEMONSTRATIVOS: NÃO SÃO MEDIÇÕES REAIS.
 * Série sintética determinística (ciclo diário + ruído pseudoaleatório),
 * usada apenas para visualizar a interface antes da integração da estação.
 */

const BRT_OFFSET_H = -3;

/** Ruído determinístico em [-1, 1] a partir de um inteiro. */
function noise(n: number, salt: number): number {
  let x = (n ^ (salt * 0x9e3779b1)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return (x / 0xffffffff) * 2 - 1;
}

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

/** Ruído diário interpolado suavemente (sem saltos na virada do dia). */
function smoothDaily(tMs: number, salt: number): number {
  const d = tMs / 86_400_000;
  const i = Math.floor(d);
  const f = d - i;
  const s = f * f * (3 - 2 * f);
  return noise(i, salt) * (1 - s) + noise(i + 1, salt) * s;
}

export function demoMeasurementAt(stationId: string, tMs: number): Measurement {
  const hourLocal = (((tMs / 3600_000 + BRT_OFFSET_H) % 24) + 24) % 24;
  const step = Math.floor(tMs / 600_000);
  // Mínima por volta das 6h, máxima por volta das 15h.
  const diurnal = Math.sin(((hourLocal - 9) / 24) * 2 * Math.PI);
  const dayShift = smoothDaily(tMs, 7) * 2.5;
  const temp = 23 + dayShift + 5 * diurnal + noise(step, 11) * 0.4;
  const umid = 68 - dayShift * 2 - 17 * diurnal + noise(step, 13) * 2;
  const pres = 1014 + smoothDaily(tMs, 17) * 3 + 1.2 * Math.sin((hourLocal / 12) * 2 * Math.PI) + noise(step, 19) * 0.2;
  return {
    stationId,
    medidoEm: new Date(tMs).toISOString(),
    temperaturaC: round(temp, 1),
    umidadePct: round(Math.min(100, Math.max(0, umid)), 0),
    pressaoHpa: round(pres, 1),
  };
}

export class DemoRepository implements MeasurementReader {
  readonly source = "demo" as const;

  async listStations(): Promise<Station[]> {
    return [...STATION_CATALOG];
  }

  async getStation(id: string): Promise<Station | null> {
    return STATION_CATALOG.find((s) => s.id === id) ?? null;
  }

  async getLatest(stationId: string, now: Date = new Date()): Promise<Measurement | null> {
    if (!(await this.getStation(stationId))) return null;
    const t = Math.floor(now.getTime() / 60_000) * 60_000;
    return demoMeasurementAt(stationId, t);
  }

  async getHistory(stationId: string, period: Period, now: Date = new Date()): Promise<Measurement[]> {
    if (!(await this.getStation(stationId))) return [];
    const { durationMs, bucketMs } = PERIOD_CONFIG[period];
    const end = Math.floor(now.getTime() / bucketMs) * bucketMs;
    const out: Measurement[] = [];
    for (let t = end - durationMs + bucketMs; t <= end; t += bucketMs) out.push(demoMeasurementAt(stationId, t));
    return out;
  }
}

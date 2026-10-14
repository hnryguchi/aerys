import type { MetricKey } from "./types";

export interface MetricDefinition {
  key: MetricKey;
  rotulo: string;
  unidade: string;
  casasDecimais: number;
  /** Faixa física aceita na ingestão (limites de operação dos sensores). */
  min: number;
  max: number;
  /** Token CSS da cor da série (identidade da variável, igual em todo o app). */
  corVar: string;
}

export const METRICS: readonly MetricDefinition[] = [
  { key: "temperaturaC", rotulo: "Temperatura", unidade: "°C", casasDecimais: 1, min: -40, max: 85, corVar: "--series-temp" },
  { key: "umidadePct", rotulo: "Umidade relativa", unidade: "%", casasDecimais: 0, min: 0, max: 100, corVar: "--series-umid" },
  { key: "pressaoHpa", rotulo: "Pressão atmosférica", unidade: "hPa", casasDecimais: 1, min: 300, max: 1100, corVar: "--series-pres" },
] as const;

export function getMetric(key: MetricKey): MetricDefinition {
  const m = METRICS.find((d) => d.key === key);
  if (!m) throw new Error(`Métrica desconhecida: ${key}`);
  return m;
}

// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
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
  /** "clima" (AHT/BMP) ou "ar" (ENS160). */
  grupo: "clima" | "ar";
  /** Explicação curta para o público. */
  explicacao: string;
}

export const METRICS: readonly MetricDefinition[] = [
  { key: "temperaturaC", rotulo: "Temperatura", unidade: "°C", casasDecimais: 1, min: -40, max: 85, corVar: "--series-temp", grupo: "clima",
    explicacao: "O quanto o ar está quente ou frio aqui, agora." },
  { key: "umidadePct", rotulo: "Umidade relativa", unidade: "%", casasDecimais: 0, min: 0, max: 100, corVar: "--series-umid", grupo: "clima",
    explicacao: "Quanto vapor de água há no ar. Muito alta deixa o calor abafado; muito baixa resseca olhos e garganta." },
  { key: "pressaoHpa", rotulo: "Pressão atmosférica", unidade: "hPa", casasDecimais: 1, min: 300, max: 1100, corVar: "--series-pres", grupo: "clima",
    explicacao: "O peso do ar sobre nós. Quando cai rápido, costuma vir chuva ou mudança de tempo." },
  { key: "eco2Ppm", rotulo: "CO₂ estimado", unidade: "ppm", casasDecimais: 0, min: 400, max: 65000, corVar: "--series-co2", grupo: "ar",
    explicacao: "Sobe quando muita gente respira num lugar fechado. Acima de 1.000 ppm é hora de abrir a janela." },
  { key: "tvocPpb", rotulo: "Compostos voláteis", unidade: "ppb", casasDecimais: 0, min: 0, max: 65000, corVar: "--series-tvoc", grupo: "ar",
    explicacao: "Gases de perfume, tinta, produto de limpeza e fumaça. Quanto menor, mais limpo o ar." },
] as const;

export const METRICS_CLIMA = METRICS.filter((m) => m.grupo === "clima");
export const METRICS_AR = METRICS.filter((m) => m.grupo === "ar");

export function getMetric(key: MetricKey): MetricDefinition {
  const m = METRICS.find((d) => d.key === key);
  if (!m) throw new Error(`Métrica desconhecida: ${key}`);
  return m;
}

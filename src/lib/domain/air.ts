import type { Measurement } from "./types";

/**
 * Leitura "para o público" das medições: nível da qualidade do ar, sensação térmica
 * e uma dica curta. Tudo derivado de medições reais; nada é inventado quando falta dado.
 */

export type NivelAr = 1 | 2 | 3 | 4 | 5;

export interface NivelArInfo {
  nivel: NivelAr;
  rotulo: string;
  emoji: string;
  /** Token CSS da cor do nível. */
  corVar: string;
  significado: string;
  dica: string;
}

/** Escala UBA usada pelo ENS160 (1 = excelente ... 5 = muito ruim). */
export const NIVEIS_AR: readonly NivelArInfo[] = [
  { nivel: 1, rotulo: "Excelente", emoji: "😄", corVar: "--aq-1", significado: "Ar limpo, bem renovado.", dica: "Respire fundo: o ar está ótimo." },
  { nivel: 2, rotulo: "Bom", emoji: "🙂", corVar: "--aq-2", significado: "Ar bom, sem motivo de preocupação.", dica: "Tudo certo por aqui." },
  { nivel: 3, rotulo: "Moderado", emoji: "😐", corVar: "--aq-3", significado: "O ar começa a ficar abafado.", dica: "Vale abrir uma janela ou ligar a ventilação." },
  { nivel: 4, rotulo: "Ruim", emoji: "😕", corVar: "--aq-4", significado: "Muita gente ou pouca ventilação.", dica: "Abra portas e janelas e faça uma pausa ao ar livre." },
  { nivel: 5, rotulo: "Muito ruim", emoji: "😷", corVar: "--aq-5", significado: "Ar muito carregado de gases.", dica: "Saia do ambiente e ventile bem o lugar." },
] as const;

/** Faixas de CO₂ equivalente do ENS160, usadas quando o índice não vem da estação. */
export function nivelPorCo2(ppm: number): NivelAr {
  if (ppm < 600) return 1;
  if (ppm < 800) return 2;
  if (ppm < 1000) return 3;
  if (ppm < 1500) return 4;
  return 5;
}

export function nivelAr(m: Pick<Measurement, "iqaUba" | "eco2Ppm"> | null): NivelArInfo | null {
  if (!m) return null;
  let n: number | null = null;
  if (m.iqaUba != null && Number.isFinite(m.iqaUba)) n = Math.round(m.iqaUba);
  else if (m.eco2Ppm != null && Number.isFinite(m.eco2Ppm)) n = nivelPorCo2(m.eco2Ppm);
  if (n === null) return null;
  return NIVEIS_AR[Math.min(5, Math.max(1, n)) - 1]!;
}

/**
 * Índice de calor (sensação térmica) da NOAA, em °C.
 * Abaixo de ~27 °C a sensação é a própria temperatura.
 */
export function sensacaoTermica(tempC: number | null | undefined, umidPct: number | null | undefined): number | null {
  if (tempC == null || !Number.isFinite(tempC)) return null;
  if (umidPct == null || !Number.isFinite(umidPct) || tempC < 27) return tempC;
  const T = (tempC * 9) / 5 + 32;
  const R = umidPct;
  let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);
  if (hi >= 80) {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R +
      0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
    if (R < 13 && T >= 80 && T <= 112) hi -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    else if (R > 85 && T >= 80 && T <= 87) hi += ((R - 85) / 10) * ((87 - T) / 5);
  }
  return Math.max(tempC, ((hi - 32) * 5) / 9);
}

export interface Conforto {
  rotulo: string;
  dica: string;
  /** 0 = confortável ... 3 = perigo */
  alerta: 0 | 1 | 2 | 3;
}

export function conforto(sensacaoC: number | null): Conforto | null {
  if (sensacaoC == null) return null;
  if (sensacaoC < 18) return { rotulo: "Fresco", dica: "Um casaco leve pode ajudar.", alerta: 0 };
  if (sensacaoC < 27) return { rotulo: "Confortável", dica: "Clima agradável.", alerta: 0 };
  if (sensacaoC < 32) return { rotulo: "Quente", dica: "Beba água com frequência.", alerta: 1 };
  if (sensacaoC < 41) return { rotulo: "Muito quente", dica: "Procure sombra e beba água.", alerta: 2 };
  return { rotulo: "Calor perigoso", dica: "Evite esforço e fique em local fresco.", alerta: 3 };
}

import type { ConnectivityStatus, DataSource, Measurement, Station } from "./types";

/** Janela mínima para considerar a comunicação "recente", independentemente do intervalo. */
export const MIN_ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Deriva o estado de conectividade a partir de evidências reais:
 * - fonte demonstrativa  -> "demonstracao" (nunca "online");
 * - sem medição          -> "sem-dados";
 * - última medição dentro de max(3 × intervalo esperado, 5 min) -> "online";
 * - caso contrário       -> "sem-comunicacao".
 */
export function deriveStatus(
  source: DataSource,
  station: Station,
  ultima: Measurement | null,
  now: Date = new Date(),
): ConnectivityStatus {
  if (source === "demo") return "demonstracao";
  if (!ultima) return "sem-dados";
  const t = Date.parse(ultima.medidoEm);
  if (Number.isNaN(t)) return "sem-dados";
  const ageMs = now.getTime() - t;
  const window = Math.max(3 * station.intervaloEsperadoS * 1000, MIN_ONLINE_WINDOW_MS);
  // Timestamps no futuro (relógio inconsistente) não contam como evidência.
  if (ageMs < -60_000) return "sem-comunicacao";
  return ageMs <= window ? "online" : "sem-comunicacao";
}

export const STATUS_LABEL: Record<ConnectivityStatus, string> = {
  demonstracao: "Demonstração — sem estação física conectada",
  online: "Online — comunicação recente",
  "sem-comunicacao": "Sem comunicação recente",
  "sem-dados": "Sem dados recebidos",
};

export const STATUS_SHORT: Record<ConnectivityStatus, string> = {
  demonstracao: "Demonstração",
  online: "Online",
  "sem-comunicacao": "Sem comunicação",
  "sem-dados": "Sem dados",
};

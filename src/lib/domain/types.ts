/** Origem dos dados exibidos. Somente "local" e "supabase" representam medições reais. */
export type DataSource = "demo" | "local" | "supabase";

export type Period = "24h" | "7d";

export type MetricKey = "temperaturaC" | "umidadePct" | "pressaoHpa" | "eco2Ppm" | "tvocPpb";

export interface Station {
  id: string;
  nome: string;
  descricao: string;
  /** null enquanto o local de instalação não estiver definido. */
  localizacao: string | null;
  /** Intervalo esperado entre envios, em segundos (base do estado de conectividade). */
  intervaloEsperadoS: number;
  sensores: string[];
}

export interface Measurement {
  stationId: string;
  /** ISO 8601 (UTC). */
  medidoEm: string;
  temperaturaC: number | null;
  umidadePct: number | null;
  pressaoHpa: number | null;
  /** CO₂ equivalente estimado pelo ENS160 (ppm). Ausente em estações sem sensor de ar. */
  eco2Ppm?: number | null;
  /** Compostos orgânicos voláteis totais, ENS160 (ppb). */
  tvocPpb?: number | null;
  /** Índice de qualidade do ar do ENS160 (escala UBA, 1 = excelente a 5 = muito ruim). */
  iqaUba?: number | null;
}

/**
 * Estado de conectividade. "online" só é atribuído com evidência de comunicação
 * recente de uma estação real; dados demonstrativos nunca são "online".
 */
export type ConnectivityStatus = "demonstracao" | "online" | "sem-comunicacao" | "sem-dados";

export interface StationSnapshot {
  station: Station;
  ultima: Measurement | null;
  status: ConnectivityStatus;
}

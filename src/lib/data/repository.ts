import type { DataSource, Measurement, Period, Station } from "../domain/types";

/** Leitura pública. Implementações nunca misturam dados demonstrativos com reais. */
export interface MeasurementReader {
  readonly source: DataSource;
  listStations(): Promise<Station[]>;
  getStation(id: string): Promise<Station | null>;
  getLatest(stationId: string): Promise<Measurement | null>;
  /** Série agregada do período, terminando em `now`. */
  getHistory(stationId: string, period: Period, now?: Date): Promise<Measurement[]>;
}

export interface NewMeasurement {
  stationId: string;
  temperaturaC: number | null;
  umidadePct: number | null;
  pressaoHpa: number | null;
  eco2Ppm?: number | null;
  tvocPpb?: number | null;
  iqaUba?: number | null;
  rssiDbm: number | null;
  firmware: string | null;
}

/** Escrita: usada exclusivamente pela rota autenticada de ingestão. */
export interface MeasurementWriter {
  insert(m: NewMeasurement, receivedAt: Date): Promise<void>;
}

export class DataUnavailableError extends Error {
  constructor(message = "Fonte de dados indisponível") {
    super(message);
    this.name = "DataUnavailableError";
  }
}

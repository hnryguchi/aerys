import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { bucketize, PERIOD_CONFIG } from "../domain/aggregate";
import { STATION_CATALOG } from "../domain/stations";
import type { Measurement, Period, Station } from "../domain/types";
import { DataUnavailableError, type MeasurementReader, type MeasurementWriter, type NewMeasurement } from "./repository";

/**
 * Medições REAIS gravadas em arquivo JSON Lines local.
 * Destinado a testes de bancada (ESP32 e computador na mesma rede).
 * Não é adequado para produção: sem concorrência entre instâncias nem retenção.
 */
export class LocalFileRepository implements MeasurementReader, MeasurementWriter {
  readonly source = "local" as const;
  private readonly file: string;

  constructor(dataDir: string) {
    this.file = path.resolve(dataDir, "medicoes.jsonl");
  }

  private async readAll(stationId: string): Promise<Measurement[]> {
    let raw: string;
    try {
      raw = await readFile(this.file, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw new DataUnavailableError();
    }
    const out: Measurement[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line) as Measurement;
        if (m.stationId === stationId) out.push(m);
      } catch {
        // linha corrompida: ignorada
      }
    }
    return out.sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  }

  async listStations(): Promise<Station[]> {
    return [...STATION_CATALOG];
  }

  async getStation(id: string): Promise<Station | null> {
    return STATION_CATALOG.find((s) => s.id === id) ?? null;
  }

  async getLatest(stationId: string): Promise<Measurement | null> {
    const all = await this.readAll(stationId);
    return all.at(-1) ?? null;
  }

  async getHistory(stationId: string, period: Period, now: Date = new Date()): Promise<Measurement[]> {
    const { durationMs, bucketMs } = PERIOD_CONFIG[period];
    const to = now.getTime();
    return bucketize(await this.readAll(stationId), to - durationMs, to, bucketMs);
  }

  async insert(m: NewMeasurement, receivedAt: Date): Promise<void> {
    const record: Measurement = {
      stationId: m.stationId,
      medidoEm: receivedAt.toISOString(),
      temperaturaC: m.temperaturaC,
      umidadePct: m.umidadePct,
      pressaoHpa: m.pressaoHpa,
      eco2Ppm: m.eco2Ppm ?? null,
      tvocPpb: m.tvocPpb ?? null,
      iqaUba: m.iqaUba ?? null,
    };
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, JSON.stringify(record) + "\n", "utf8");
  }
}

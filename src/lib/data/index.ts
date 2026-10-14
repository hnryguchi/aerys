import { readServerConfig } from "../config";
import { deriveStatus } from "../domain/status";
import type { Period, StationSnapshot } from "../domain/types";
import { DemoRepository } from "./demo-repository";
import { LocalFileRepository } from "./local-repository";
import type { MeasurementReader, MeasurementWriter } from "./repository";
import { SupabaseRepository } from "./supabase-repository";

type Repo = MeasurementReader & Partial<MeasurementWriter>;

let cached: Repo | null = null;

export function getRepository(): Repo {
  if (cached) return cached;
  const cfg = readServerConfig();
  switch (cfg.dataSource) {
    case "demo":
      cached = new DemoRepository();
      break;
    case "local":
      cached = new LocalFileRepository(cfg.localDataDir);
      break;
    case "supabase":
      cached = new SupabaseRepository(cfg.supabase!.url, cfg.supabase!.publishableKey, cfg.supabase!.secretKey);
      break;
  }
  return cached;
}

/** Somente para testes. */
export function __setRepositoryForTests(repo: Repo | null): void {
  cached = repo;
}

export async function getSnapshot(repo: MeasurementReader, stationId: string, now = new Date()): Promise<StationSnapshot | null> {
  const station = await repo.getStation(stationId);
  if (!station) return null;
  const ultima = await repo.getLatest(stationId);
  return { station, ultima, status: deriveStatus(repo.source, station, ultima, now) };
}

export async function listSnapshots(repo: MeasurementReader, now = new Date()): Promise<StationSnapshot[]> {
  const stations = await repo.listStations();
  return Promise.all(
    stations.map(async (station) => {
      const ultima = await repo.getLatest(station.id);
      return { station, ultima, status: deriveStatus(repo.source, station, ultima, now) };
    }),
  );
}

export type { Period };

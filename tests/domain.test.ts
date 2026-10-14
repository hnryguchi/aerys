import { describe, expect, it } from "vitest";
import { bucketize } from "@/lib/domain/aggregate";
import { STATION_CATALOG } from "@/lib/domain/stations";
import { deriveStatus } from "@/lib/domain/status";
import type { Measurement } from "@/lib/domain/types";

const station = STATION_CATALOG[0]!;
const now = new Date("2026-10-14T15:00:00Z");
const at = (minAgo: number): Measurement => ({
  stationId: station.id,
  medidoEm: new Date(now.getTime() - minAgo * 60_000).toISOString(),
  temperaturaC: 25,
  umidadePct: 60,
  pressaoHpa: 1013,
});

describe("deriveStatus", () => {
  it("dados demonstrativos nunca aparecem como online", () => {
    expect(deriveStatus("demo", station, at(0), now)).toBe("demonstracao");
  });
  it("sem medição -> sem-dados", () => {
    expect(deriveStatus("supabase", station, null, now)).toBe("sem-dados");
  });
  it("medição recente -> online", () => {
    expect(deriveStatus("supabase", station, at(2), now)).toBe("online");
  });
  it("medição antiga -> sem-comunicacao", () => {
    expect(deriveStatus("local", station, at(30), now)).toBe("sem-comunicacao");
  });
  it("timestamp no futuro não conta como evidência", () => {
    expect(deriveStatus("local", station, at(-10), now)).toBe("sem-comunicacao");
  });
  it("timestamp inválido -> sem-dados", () => {
    expect(deriveStatus("local", station, { ...at(0), medidoEm: "x" }, now)).toBe("sem-dados");
  });
});

describe("bucketize", () => {
  it("calcula a média por intervalo e ignora nulos", () => {
    const base = Date.parse("2026-10-14T12:00:00Z");
    const ms: Measurement[] = [
      { stationId: "aerys-001", medidoEm: new Date(base + 60_000).toISOString(), temperaturaC: 20, umidadePct: null, pressaoHpa: 1000 },
      { stationId: "aerys-001", medidoEm: new Date(base + 120_000).toISOString(), temperaturaC: 22, umidadePct: 50, pressaoHpa: null },
      { stationId: "aerys-001", medidoEm: new Date(base + 700_000).toISOString(), temperaturaC: 30, umidadePct: 40, pressaoHpa: 1010 },
    ];
    const out = bucketize(ms, base, base + 3600_000, 600_000);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ temperaturaC: 21, umidadePct: 50, pressaoHpa: 1000 });
    expect(out[1]).toMatchObject({ temperaturaC: 30 });
  });
  it("descarta medições fora da janela", () => {
    const base = Date.parse("2026-10-14T12:00:00Z");
    const m: Measurement = { stationId: "aerys-001", medidoEm: new Date(base - 1).toISOString(), temperaturaC: 1, umidadePct: 1, pressaoHpa: 1 };
    expect(bucketize([m], base, base + 1000, 600_000)).toEqual([]);
  });
});

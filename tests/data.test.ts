import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { DemoRepository } from "@/lib/data/demo-repository";
import { LocalFileRepository } from "@/lib/data/local-repository";
import { SupabaseRepository } from "@/lib/data/supabase-repository";
import { getMetric } from "@/lib/domain/metrics";

const now = new Date("2026-10-14T15:00:00Z");

describe("DemoRepository", () => {
  const repo = new DemoRepository();
  it("identifica a fonte como demonstrativa", () => {
    expect(repo.source).toBe("demo");
  });
  it("é determinístico", async () => {
    expect(await repo.getHistory("aerys-001", "24h", now)).toEqual(await repo.getHistory("aerys-001", "24h", now));
  });
  it("gera 144 pontos em 24h e 168 em 7d", async () => {
    expect(await repo.getHistory("aerys-001", "24h", now)).toHaveLength(144);
    expect(await repo.getHistory("aerys-001", "7d", now)).toHaveLength(168);
  });
  it("mantém valores dentro das faixas físicas", async () => {
    for (const m of await repo.getHistory("aerys-001", "7d", now)) {
      for (const k of ["temperaturaC", "umidadePct", "pressaoHpa"] as const) {
        const d = getMetric(k);
        expect(m[k]).not.toBeNull();
        expect(m[k]!).toBeGreaterThanOrEqual(d.min);
        expect(m[k]!).toBeLessThanOrEqual(d.max);
      }
    }
  });
  it("estação desconhecida -> null / vazio", async () => {
    expect(await repo.getStation("aerys-999")).toBeNull();
    expect(await repo.getLatest("aerys-999")).toBeNull();
    expect(await repo.getHistory("aerys-999", "24h", now)).toEqual([]);
  });
});

describe("LocalFileRepository", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "aerys-test-"));
  afterAll(() => rm(dir, { recursive: true, force: true }));
  const repo = new LocalFileRepository(dir);

  it("começa sem dados", async () => {
    expect(await repo.getLatest("aerys-001")).toBeNull();
  });
  it("grava com horário de recebimento e lê a última medição", async () => {
    await repo.insert({ stationId: "aerys-001", temperaturaC: 24.5, umidadePct: 61, pressaoHpa: 1012.3, rssiDbm: -60, firmware: "0.1.0" }, new Date(now.getTime() - 120_000));
    await repo.insert({ stationId: "aerys-001", temperaturaC: 24.7, umidadePct: null, pressaoHpa: 1012.1, rssiDbm: null, firmware: null }, now);
    const last = await repo.getLatest("aerys-001");
    expect(last).toMatchObject({ temperaturaC: 24.7, umidadePct: null, medidoEm: now.toISOString() });
    const hist = await repo.getHistory("aerys-001", "24h", now);
    expect(hist.length).toBeGreaterThanOrEqual(1);
  });
});

describe("SupabaseRepository", () => {
  it("lê com a chave publicável e grava com a chave secreta", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(init.method === "POST" && url.endsWith("/medicoes") ? null : "[]", { status: init.method === "POST" && url.endsWith("/medicoes") ? 201 : 200 });
    }) as unknown as typeof fetch;
    const repo = new SupabaseRepository("https://x.supabase.invalid", "sb_publishable_A", "sb_secret_B", fakeFetch);
    await repo.getLatest("aerys-001");
    await repo.insert({ stationId: "aerys-001", temperaturaC: 20, umidadePct: 50, pressaoHpa: 1000, rssiDbm: -50, firmware: "0.1.0" }, now);
    const readHeaders = calls[0]!.init.headers as Record<string, string>;
    const writeHeaders = calls[1]!.init.headers as Record<string, string>;
    expect(readHeaders.apikey).toBe("sb_publishable_A");
    expect(writeHeaders.apikey).toBe("sb_secret_B");
    expect(calls[0]!.url).toContain("estacao_id=eq.aerys-001");
  });
  it("sem chave secreta não grava", async () => {
    const repo = new SupabaseRepository("https://x.supabase.invalid", "sb_publishable_A", undefined, (async () => new Response("[]")) as unknown as typeof fetch);
    await expect(repo.insert({ stationId: "aerys-001", temperaturaC: 1, umidadePct: 1, pressaoHpa: 1000, rssiDbm: null, firmware: null }, now)).rejects.toThrow();
  });
  it("falha HTTP vira erro genérico", async () => {
    const repo = new SupabaseRepository("https://x.supabase.invalid", "k", undefined, (async () => new Response("boom", { status: 500 })) as unknown as typeof fetch);
    await expect(repo.listStations()).rejects.toThrow(/HTTP 500/);
  });
});

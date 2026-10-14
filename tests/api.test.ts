import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { __setRepositoryForTests } from "@/lib/data";
import { DemoRepository } from "@/lib/data/demo-repository";
import { LocalFileRepository } from "@/lib/data/local-repository";
import { hashToken } from "@/lib/security/device-auth";

const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-ab";
let ipCounter = 0;
const nextIp = () => `203.0.113.${++ipCounter % 250}`;

function ingestReq(body: unknown, opts: { token?: string | null; station?: string; ip?: string; contentType?: string } = {}): Request {
  const headers: Record<string, string> = { "content-type": opts.contentType ?? "application/json", "x-real-ip": opts.ip ?? nextIp() };
  if (opts.token !== null) headers.authorization = `Bearer ${opts.token ?? TOKEN}`;
  headers["x-aerys-station"] = opts.station ?? "aerys-001";
  return new Request("http://localhost/api/v1/ingestao", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("rotas públicas (somente leitura)", async () => {
  const estacoes = await import("@/app/api/v1/estacoes/route");
  const estacao = await import("@/app/api/v1/estacoes/[id]/route");
  const medicoes = await import("@/app/api/v1/estacoes/[id]/medicoes/route");
  const ingestao = await import("@/app/api/v1/ingestao/route");

  beforeAll(() => __setRepositoryForTests(new DemoRepository()));
  afterAll(() => __setRepositoryForTests(null));

  it("não exportam métodos de escrita (Next responde 405)", () => {
    for (const mod of [estacoes, estacao, medicoes] as Record<string, unknown>[]) {
      for (const m of ["POST", "PUT", "PATCH", "DELETE"]) expect(mod[m]).toBeUndefined();
    }
    for (const m of ["GET", "PUT", "PATCH", "DELETE"]) expect((ingestao as Record<string, unknown>)[m]).toBeUndefined();
  });

  it("lista estações sinalizando dados demonstrativos", async () => {
    const res = await estacoes.GET(new Request("http://localhost/api/v1/estacoes", { headers: { "x-real-ip": nextIp() } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.demonstrativo).toBe(true);
    expect(body.estacoes[0].status).toBe("demonstracao");
  });

  it("valida o identificador e o período", async () => {
    const r1 = await estacao.GET(new Request("http://localhost/x", { headers: { "x-real-ip": nextIp() } }), params("../../etc"));
    expect(r1.status).toBe(400);
    const r2 = await estacao.GET(new Request("http://localhost/x", { headers: { "x-real-ip": nextIp() } }), params("aerys-999"));
    expect(r2.status).toBe(404);
    const r3 = await medicoes.GET(new Request("http://localhost/x?periodo=1y", { headers: { "x-real-ip": nextIp() } }), params("aerys-001"));
    expect(r3.status).toBe(400);
    const r4 = await medicoes.GET(new Request("http://localhost/x?periodo=7d", { headers: { "x-real-ip": nextIp() } }), params("aerys-001"));
    expect(r4.status).toBe(200);
    expect((await r4.json()).medicoes).toHaveLength(168);
  });

  it("aplica limite de frequência (429 com Retry-After)", async () => {
    const ip = "198.51.100.7";
    let last: Response | null = null;
    for (let i = 0; i < 121; i++) last = await estacoes.GET(new Request("http://localhost/api/v1/estacoes", { headers: { "x-real-ip": ip } }));
    expect(last!.status).toBe(429);
    expect(last!.headers.get("retry-after")).toBeTruthy();
  });

  it("ingestão fica desativada no modo demonstrativo", async () => {
    vi.stubEnv("AERYS_DATA_SOURCE", "demo");
    const res = await ingestao.POST(ingestReq({ temperatura_c: 20, umidade_pct: 50, pressao_hpa: 1000 }));
    expect(res.status).toBe(503);
    vi.unstubAllEnvs();
  });
});

describe("ingestão autenticada (modo local)", async () => {
  const ingestao = await import("@/app/api/v1/ingestao/route");
  const dir = await mkdtemp(path.join(tmpdir(), "aerys-api-"));
  const repo = new LocalFileRepository(dir);
  const valid = { temperatura_c: 24.3, umidade_pct: 58, pressao_hpa: 1011.8, rssi_dbm: -61, firmware: "0.1.0" };

  beforeAll(() => {
    vi.stubEnv("AERYS_DATA_SOURCE", "local");
    vi.stubEnv("AERYS_DEVICE_TOKENS", `aerys-001:${hashToken(TOKEN)}`);
    __setRepositoryForTests(repo);
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    __setRepositoryForTests(null);
    await rm(dir, { recursive: true, force: true });
  });

  it("rejeita sem token, com token errado ou estação trocada (401)", async () => {
    expect((await ingestao.POST(ingestReq(valid, { token: null }))).status).toBe(401);
    expect((await ingestao.POST(ingestReq(valid, { token: TOKEN.replace("A", "B") }))).status).toBe(401);
    expect((await ingestao.POST(ingestReq(valid, { station: "aerys-002" }))).status).toBe(401);
    expect(await repo.getLatest("aerys-001")).toBeNull();
  });

  it("não registra o token nos logs", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await ingestao.POST(ingestReq(valid, { token: TOKEN.replace("A", "C") }));
    const logged = spy.mock.calls.flat().join(" ");
    expect(logged).not.toContain(TOKEN.slice(4, 20));
    spy.mockRestore();
  });

  it("rejeita content-type, JSON e dados inválidos", async () => {
    expect((await ingestao.POST(ingestReq("x", { contentType: "text/plain" }))).status).toBe(415);
    expect((await ingestao.POST(ingestReq("{nao json"))).status).toBe(400);
    const r = await ingestao.POST(ingestReq({ ...valid, umidade_pct: 150 }));
    expect(r.status).toBe(422);
    expect((await r.json()).erro.campos).toContain("umidade_pct");
    expect((await ingestao.POST(ingestReq("x".repeat(5000)))).status).toBe(413);
  });

  it("aceita medição válida, grava e aplica intervalo mínimo por estação", async () => {
    const r1 = await ingestao.POST(ingestReq(valid));
    expect(r1.status).toBe(201);
    const last = await repo.getLatest("aerys-001");
    expect(last).toMatchObject({ temperaturaC: 24.3, umidadePct: 58, pressaoHpa: 1011.8 });
    const r2 = await ingestao.POST(ingestReq(valid));
    expect(r2.status).toBe(429);
  });
});

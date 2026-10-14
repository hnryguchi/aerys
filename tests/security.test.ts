import { describe, expect, it } from "vitest";
import { hashToken, parseDeviceTokens, verifyDevice } from "@/lib/security/device-auth";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { ingestSchema, parsePeriod } from "@/lib/security/validation";
import { checkDefinitiveUrl, stationPublicUrl } from "@/lib/qr-policy";
import { readServerConfig } from "@/lib/config";

const TOKEN = "tK3v9QwErTyUiOpAsDfGhJkLzXcVbNm1_-23456";

describe("autenticação de dispositivo", () => {
  const tokens = parseDeviceTokens(`aerys-001:${hashToken(TOKEN)}`);
  it("aceita token correto para a estação correta", () => {
    expect(verifyDevice(tokens, "aerys-001", `Bearer ${TOKEN}`)).toBe(true);
  });
  it("rejeita token de outra estação", () => {
    expect(verifyDevice(tokens, "aerys-002", `Bearer ${TOKEN}`)).toBe(false);
  });
  it("rejeita token errado, ausente ou malformado", () => {
    expect(verifyDevice(tokens, "aerys-001", `Bearer ${TOKEN}x`)).toBe(false);
    expect(verifyDevice(tokens, "aerys-001", null)).toBe(false);
    expect(verifyDevice(tokens, "aerys-001", TOKEN)).toBe(false);
    expect(verifyDevice(tokens, "aerys-001", "Bearer curto")).toBe(false);
    expect(verifyDevice(tokens, null, `Bearer ${TOKEN}`)).toBe(false);
  });
  it("ignora o placeholder do .env.example e entradas malformadas", () => {
    const t = parseDeviceTokens(`aerys-001:${"0".repeat(64)},lixo,../etc:abc`);
    expect(t.size).toBe(0);
  });
});

describe("rate limit", () => {
  it("bloqueia acima do limite e libera após a janela", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("a", 0).ok).toBe(true);
    expect(check("a", 1).ok).toBe(true);
    const r = check("a", 2);
    expect(r.ok).toBe(false);
    expect(r.retryAfterS).toBeGreaterThanOrEqual(1);
    expect(check("b", 2).ok).toBe(true);
    expect(check("a", 1001).ok).toBe(true);
  });
});

describe("validação da ingestão", () => {
  const ok = { temperatura_c: 24.1, umidade_pct: 60, pressao_hpa: 1012.5 };
  it("aceita medição válida", () => {
    expect(ingestSchema.safeParse(ok).success).toBe(true);
  });
  it("aceita sensor ausente (null) desde que haja alguma variável", () => {
    expect(ingestSchema.safeParse({ ...ok, umidade_pct: null }).success).toBe(true);
    expect(ingestSchema.safeParse({ temperatura_c: null, umidade_pct: null, pressao_hpa: null }).success).toBe(false);
  });
  it("rejeita valores fora da faixa física", () => {
    expect(ingestSchema.safeParse({ ...ok, umidade_pct: 140 }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...ok, pressao_hpa: 50 }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...ok, temperatura_c: 999 }).success).toBe(false);
  });
  it("rejeita campos extras (ex.: tentativa de escolher estação ou horário)", () => {
    expect(ingestSchema.safeParse({ ...ok, estacao_id: "aerys-002" }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...ok, medido_em: "2020-01-01" }).success).toBe(false);
  });
  it("rejeita tipos errados", () => {
    expect(ingestSchema.safeParse({ ...ok, temperatura_c: "24" }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...ok, firmware: "<script>" }).success).toBe(false);
  });
  it("período inválido volta para 24h", () => {
    expect(parsePeriod("7d")).toBe("7d");
    expect(parsePeriod("1y")).toBe("24h");
    expect(parsePeriod(undefined)).toBe("24h");
  });
});

describe("política de URL do QR Code", () => {
  it("aceita HTTPS público", () => {
    expect(checkDefinitiveUrl("https://aerys.exemplo.com.br").ok).toBe(true);
  });
  it.each([
    "http://aerys.com.br",
    "https://localhost:3000",
    "https://192.168.0.10",
    "https://10.0.0.5",
    "https://abc.ngrok-free.app",
    "https://x.trycloudflare.com",
    "https://user:senha@aerys.com.br",
    "https://aerys.com.br/?token=abc",
    "https://exemplo-aerys.invalid",
    "",
  ])("recusa %s", (u) => {
    expect(checkDefinitiveUrl(u).ok).toBe(false);
  });
  it("monta URL permanente da estação", () => {
    expect(stationPublicUrl("https://aerys.com.br/", "aerys-001")).toBe("https://aerys.com.br/estacao/aerys-001");
  });
});

describe("configuração", () => {
  it("padrão é demo", () => {
    expect(readServerConfig({} as NodeJS.ProcessEnv).dataSource).toBe("demo");
  });
  it("aceita os nomes injetados pela integração Supabase da Vercel", () => {
    const cfg = readServerConfig({
      AERYS_DATA_SOURCE: "supabase",
      SUPABASE_URL: "https://abc.supabase.co/",
      SUPABASE_ANON_KEY: "anon-123",
      SUPABASE_SERVICE_ROLE_KEY: "service-456",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg.supabase).toEqual({ url: "https://abc.supabase.co", publishableKey: "anon-123", secretKey: "service-456" });
  });
  it("modo supabase exige variáveis e não expõe valores no erro", () => {
    expect(() => readServerConfig({ AERYS_DATA_SOURCE: "supabase", SUPABASE_SECRET_KEY: "segredo123" } as unknown as NodeJS.ProcessEnv)).toThrow(
      /SUPABASE_URL/,
    );
    try {
      readServerConfig({ AERYS_DATA_SOURCE: "x", SUPABASE_SECRET_KEY: "segredo123" } as unknown as NodeJS.ProcessEnv);
    } catch (e) {
      expect(String(e)).not.toContain("segredo123");
    }
  });
});

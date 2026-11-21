// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { describe, expect, it } from "vitest";
import { conforto, nivelAr, nivelPorCo2, sensacaoTermica } from "@/lib/domain/air";
import { ingestSchema } from "@/lib/security/validation";

describe("qualidade do ar", () => {
  it("usa o índice da estação quando existe", () => {
    expect(nivelAr({ iqaUba: 4, eco2Ppm: 450 })?.rotulo).toBe("Ruim");
  });
  it("sem índice, deriva do CO₂ estimado", () => {
    expect(nivelPorCo2(450)).toBe(1);
    expect(nivelPorCo2(700)).toBe(2);
    expect(nivelPorCo2(900)).toBe(3);
    expect(nivelPorCo2(1200)).toBe(4);
    expect(nivelPorCo2(2000)).toBe(5);
    expect(nivelAr({ iqaUba: null, eco2Ppm: 950 })?.nivel).toBe(3);
  });
  it("sem dado do sensor de ar não inventa nível", () => {
    expect(nivelAr({ iqaUba: null, eco2Ppm: null })).toBeNull();
    expect(nivelAr({})).toBeNull();
    expect(nivelAr(null)).toBeNull();
  });
});

describe("sensação térmica", () => {
  it("abaixo de 27 °C é a própria temperatura", () => {
    expect(sensacaoTermica(24, 80)).toBe(24);
  });
  it("calor úmido parece mais quente (NOAA: 32 °C e 70% ≈ 41 °C)", () => {
    const s = sensacaoTermica(32, 70)!;
    expect(s).toBeGreaterThan(39);
    expect(s).toBeLessThan(43);
  });
  it("sem temperatura não há sensação; faixas de conforto", () => {
    expect(sensacaoTermica(null, 50)).toBeNull();
    expect(conforto(25)?.rotulo).toBe("Confortável");
    expect(conforto(35)?.alerta).toBe(2);
  });
});

describe("ingestão com sensor de ar", () => {
  const base = { temperatura_c: 26.1, umidade_pct: 62, pressao_hpa: 1012.4 };
  it("aceita o corpo antigo (firmware sem ENS160)", () => {
    expect(ingestSchema.safeParse(base).success).toBe(true);
  });
  it("aceita CO₂, TVOC e índice", () => {
    expect(ingestSchema.safeParse({ ...base, eco2_ppm: 620, tvoc_ppb: 85, iqa_uba: 2 }).success).toBe(true);
  });
  it("rejeita valores fora da faixa do ENS160", () => {
    expect(ingestSchema.safeParse({ ...base, eco2_ppm: 100 }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...base, iqa_uba: 6 }).success).toBe(false);
    expect(ingestSchema.safeParse({ ...base, tvoc_ppb: 1.5 }).success).toBe(false);
  });
});

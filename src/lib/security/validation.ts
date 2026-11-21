// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { z } from "zod";
import { getMetric } from "../domain/metrics";
import { STATION_ID_PATTERN } from "../domain/stations";
import type { Period } from "../domain/types";

export const stationIdSchema = z.string().regex(STATION_ID_PATTERN);

export const periodSchema = z.enum(["24h", "7d"]);

export function parsePeriod(value: string | string[] | undefined | null): Period {
  const r = periodSchema.safeParse(Array.isArray(value) ? value[0] : value ?? undefined);
  return r.success ? r.data : "24h";
}

function metricField(key: "temperaturaC" | "umidadePct" | "pressaoHpa") {
  const d = getMetric(key);
  return z.number().finite().min(d.min).max(d.max).nullable();
}

/** Campos do sensor de ar (ENS160): opcionais para manter compatível o firmware sem o sensor. */
function intField(key: "eco2Ppm" | "tvocPpb") {
  const d = getMetric(key);
  return z.number().int().min(d.min).max(d.max).nullable().optional();
}

/** Corpo aceito na ingestão. Campos desconhecidos são rejeitados. */
export const ingestSchema = z
  .object({
    temperatura_c: metricField("temperaturaC"),
    umidade_pct: metricField("umidadePct"),
    pressao_hpa: metricField("pressaoHpa"),
    eco2_ppm: intField("eco2Ppm"),
    tvoc_ppb: intField("tvocPpb"),
    iqa_uba: z.number().int().min(1).max(5).nullable().optional(),
    rssi_dbm: z.number().int().min(-127).max(0).nullable().optional(),
    firmware: z
      .string()
      .max(32)
      .regex(/^[A-Za-z0-9._-]*$/)
      .nullable()
      .optional(),
  })
  .strict()
  .refine((b) => b.temperatura_c !== null || b.umidade_pct !== null || b.pressao_hpa !== null || b.eco2_ppm != null, {
    message: "Ao menos uma variável deve ter valor",
  });

export type IngestBody = z.infer<typeof ingestSchema>;

export const MAX_INGEST_BODY_BYTES = 1024;

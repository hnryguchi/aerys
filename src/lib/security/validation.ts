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

/** Corpo aceito na ingestão. Campos desconhecidos são rejeitados. */
export const ingestSchema = z
  .object({
    temperatura_c: metricField("temperaturaC"),
    umidade_pct: metricField("umidadePct"),
    pressao_hpa: metricField("pressaoHpa"),
    rssi_dbm: z.number().int().min(-127).max(0).nullable().optional(),
    firmware: z
      .string()
      .max(32)
      .regex(/^[A-Za-z0-9._-]*$/)
      .nullable()
      .optional(),
  })
  .strict()
  .refine((b) => b.temperatura_c !== null || b.umidade_pct !== null || b.pressao_hpa !== null, {
    message: "Ao menos uma variável deve ter valor",
  });

export type IngestBody = z.infer<typeof ingestSchema>;

export const MAX_INGEST_BODY_BYTES = 1024;

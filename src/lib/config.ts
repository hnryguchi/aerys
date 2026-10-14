import { z } from "zod";
import type { DataSource } from "./domain/types";

const envSchema = z.object({
  AERYS_DATA_SOURCE: z.enum(["demo", "local", "supabase"]).default("demo"),
  AERYS_LOCAL_DATA_DIR: z.string().min(1).default("data/local"),
  AERYS_DEVICE_TOKENS: z.string().optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

export interface ServerConfig {
  dataSource: DataSource;
  localDataDir: string;
  deviceTokens: string | undefined;
  supabase: { url: string; publishableKey: string; secretKey: string | undefined } | null;
}

/**
 * Lê e valida as variáveis de ambiente do servidor. Mensagens de erro citam
 * apenas NOMES de variáveis, nunca seus valores.
 */
export function readServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Configuração inválida nas variáveis: ${names}`);
  }
  const e = parsed.data;
  let supabase: ServerConfig["supabase"] = null;
  if (e.AERYS_DATA_SOURCE === "supabase") {
    if (!e.SUPABASE_URL || !e.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Modo supabase requer SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY");
    }
    supabase = { url: e.SUPABASE_URL.replace(/\/+$/, ""), publishableKey: e.SUPABASE_PUBLISHABLE_KEY, secretKey: e.SUPABASE_SECRET_KEY };
  }
  return {
    dataSource: e.AERYS_DATA_SOURCE,
    localDataDir: e.AERYS_LOCAL_DATA_DIR,
    deviceTokens: e.AERYS_DEVICE_TOKENS,
    supabase,
  };
}

/** URL pública do site (QR Codes, metadados). Pode ser indefinida em desenvolvimento. */
export function getSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return null;
  }
}

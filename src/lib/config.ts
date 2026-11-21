// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
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

function nonEmpty(v: string | undefined): string | undefined {
  return v && v.trim() ? v.trim() : undefined;
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
    // Aceita também os nomes injetados pela integração Supabase do Marketplace da Vercel.
    const url = e.SUPABASE_URL ?? nonEmpty(env.NEXT_PUBLIC_SUPABASE_URL);
    const publishableKey = e.SUPABASE_PUBLISHABLE_KEY ?? nonEmpty(env.SUPABASE_ANON_KEY) ?? nonEmpty(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const secretKey = e.SUPABASE_SECRET_KEY ?? nonEmpty(env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !publishableKey) {
      throw new Error("Modo supabase requer SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY)");
    }
    try {
      new URL(url);
    } catch {
      throw new Error("Configuração inválida nas variáveis: SUPABASE_URL");
    }
    supabase = { url: url.replace(/\/+$/, ""), publishableKey, secretKey };
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

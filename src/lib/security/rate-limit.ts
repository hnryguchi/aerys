/**
 * Limitador de frequência em memória (janela fixa por chave).
 * Limitação conhecida: é por instância do servidor. Em hospedagem serverless com
 * várias instâncias, complementar com limitação na borda (WAF da hospedagem).
 */
export interface RateLimitResult {
  ok: boolean;
  retryAfterS: number;
}

export function createRateLimiter(opts: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const maxKeys = opts.maxKeys ?? 10_000;

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    if (hits.size > maxKeys) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      if (hits.size > maxKeys) hits.clear();
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      return { ok: true, retryAfterS: 0 };
    }
    entry.count += 1;
    if (entry.count > opts.limit) {
      return { ok: false, retryAfterS: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
    }
    return { ok: true, retryAfterS: 0 };
  };
}

/** IP do cliente conforme cabeçalhos definidos pela plataforma de hospedagem. */
export function clientKey(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "desconhecido";
}

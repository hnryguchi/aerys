/** Respostas JSON padronizadas. Mensagens de erro são genéricas: sem detalhes internos. */
export function json(data: unknown, init: ResponseInit & { cache?: string } = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", init.cache ?? "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorJson(status: number, codigo: string, mensagem: string, extraHeaders?: Record<string, string>): Response {
  return json({ erro: { codigo, mensagem } }, { status, headers: extraHeaders });
}

/** Log estruturado sem dados sensíveis (nunca registrar tokens, chaves ou corpos completos). */
export function logEvent(evento: string, campos: Record<string, string | number | boolean | null> = {}): void {
  console.info(JSON.stringify({ evento, ...campos, em: new Date().toISOString() }));
}

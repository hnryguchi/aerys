// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { getRepository, listSnapshots } from "@/lib/data";
import { errorJson, json, logEvent } from "@/lib/http";
import { publicReadLimiter } from "@/lib/security/limiters";
import { clientKey } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const rl = publicReadLimiter(clientKey(req));
  if (!rl.ok) return errorJson(429, "limite", "Muitas requisições. Tente novamente em instantes.", { "Retry-After": String(rl.retryAfterS) });
  try {
    const repo = getRepository();
    const estacoes = await listSnapshots(repo);
    return json({ fonte: repo.source, demonstrativo: repo.source === "demo", estacoes }, { cache: "public, max-age=30" });
  } catch (err) {
    logEvent("leitura_falhou", { rota: "estacoes", tipo: (err as Error).name });
    return errorJson(503, "indisponivel", "Dados temporariamente indisponíveis.");
  }
}

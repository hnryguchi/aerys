import { getRepository, getSnapshot } from "@/lib/data";
import { errorJson, json, logEvent } from "@/lib/http";
import { publicReadLimiter } from "@/lib/security/limiters";
import { clientKey } from "@/lib/security/rate-limit";
import { stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const rl = publicReadLimiter(clientKey(req));
  if (!rl.ok) return errorJson(429, "limite", "Muitas requisições. Tente novamente em instantes.", { "Retry-After": String(rl.retryAfterS) });
  const { id } = await ctx.params;
  if (!stationIdSchema.safeParse(id).success) return errorJson(400, "id_invalido", "Identificador de estação inválido.");
  try {
    const repo = getRepository();
    const snap = await getSnapshot(repo, id);
    if (!snap) return errorJson(404, "nao_encontrada", "Estação não encontrada.");
    return json({ fonte: repo.source, demonstrativo: repo.source === "demo", ...snap }, { cache: "public, max-age=30" });
  } catch (err) {
    logEvent("leitura_falhou", { rota: "estacao", tipo: (err as Error).name });
    return errorJson(503, "indisponivel", "Dados temporariamente indisponíveis.");
  }
}

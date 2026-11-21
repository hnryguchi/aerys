// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { getRepository } from "@/lib/data";
import { errorJson, json, logEvent } from "@/lib/http";
import { publicReadLimiter } from "@/lib/security/limiters";
import { clientKey } from "@/lib/security/rate-limit";
import { periodSchema, stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const rl = publicReadLimiter(clientKey(req));
  if (!rl.ok) return errorJson(429, "limite", "Muitas requisições. Tente novamente em instantes.", { "Retry-After": String(rl.retryAfterS) });
  const { id } = await ctx.params;
  if (!stationIdSchema.safeParse(id).success) return errorJson(400, "id_invalido", "Identificador de estação inválido.");
  const periodoParam = new URL(req.url).searchParams.get("periodo") ?? "24h";
  const periodo = periodSchema.safeParse(periodoParam);
  if (!periodo.success) return errorJson(400, "periodo_invalido", "Período inválido. Use 24h ou 7d.");
  try {
    const repo = getRepository();
    if (!(await repo.getStation(id))) return errorJson(404, "nao_encontrada", "Estação não encontrada.");
    const medicoes = await repo.getHistory(id, periodo.data);
    return json(
      { fonte: repo.source, demonstrativo: repo.source === "demo", estacao: id, periodo: periodo.data, medicoes },
      { cache: "public, max-age=30" },
    );
  } catch (err) {
    logEvent("leitura_falhou", { rota: "medicoes", tipo: (err as Error).name });
    return errorJson(503, "indisponivel", "Dados temporariamente indisponíveis.");
  }
}

import { readServerConfig } from "@/lib/config";
import { getRepository } from "@/lib/data";
import { errorJson, json, logEvent } from "@/lib/http";
import { parseDeviceTokens, verifyDevice } from "@/lib/security/device-auth";
import { ingestIpLimiter, ingestStationLimiter } from "@/lib/security/limiters";
import { clientKey } from "@/lib/security/rate-limit";
import { ingestSchema, MAX_INGEST_BODY_BYTES, stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ingestao: única rota de escrita.
 * Cabeçalhos: Authorization: Bearer <token do dispositivo>, X-Aerys-Station: aerys-NNN
 * O horário da medição é o horário de RECEBIMENTO no servidor.
 */
export async function POST(req: Request): Promise<Response> {
  const ip = clientKey(req);
  const rl = ingestIpLimiter(ip);
  if (!rl.ok) return errorJson(429, "limite", "Muitas requisições.", { "Retry-After": String(rl.retryAfterS) });

  const cfg = readServerConfig();
  const repo = getRepository();
  if (cfg.dataSource === "demo" || typeof repo.insert !== "function") {
    return errorJson(503, "ingestao_desativada", "Ingestão desativada no modo demonstrativo.");
  }

  const stationHeader = req.headers.get("x-aerys-station");
  const stationId = stationIdSchema.safeParse(stationHeader).success ? stationHeader : null;
  if (!verifyDevice(parseDeviceTokens(cfg.deviceTokens), stationId, req.headers.get("authorization"))) {
    logEvent("ingestao_nao_autorizada", { estacao: stationId });
    return errorJson(401, "nao_autorizado", "Credenciais do dispositivo inválidas.", { "WWW-Authenticate": "Bearer" });
  }

  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return errorJson(415, "tipo_invalido", "Envie application/json.");
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_INGEST_BODY_BYTES) return errorJson(413, "muito_grande", "Corpo excede o limite.");
  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > MAX_INGEST_BODY_BYTES) return errorJson(413, "muito_grande", "Corpo excede o limite.");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorJson(400, "json_invalido", "JSON inválido.");
  }
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    const campos = [...new Set(parsed.error.issues.map((i) => i.path.join(".") || "corpo"))];
    return json({ erro: { codigo: "validacao", mensagem: "Dados fora do formato ou da faixa aceita.", campos } }, { status: 422 });
  }

  const st = ingestStationLimiter(stationId!);
  if (!st.ok) return errorJson(429, "intervalo_minimo", "Intervalo mínimo entre envios: 10 s.", { "Retry-After": String(st.retryAfterS) });

  const recebidoEm = new Date();
  try {
    await repo.insert(
      {
        stationId: stationId!,
        temperaturaC: parsed.data.temperatura_c,
        umidadePct: parsed.data.umidade_pct,
        pressaoHpa: parsed.data.pressao_hpa,
        eco2Ppm: parsed.data.eco2_ppm ?? null,
        tvocPpb: parsed.data.tvoc_ppb ?? null,
        iqaUba: parsed.data.iqa_uba ?? null,
        rssiDbm: parsed.data.rssi_dbm ?? null,
        firmware: parsed.data.firmware ?? null,
      },
      recebidoEm,
    );
  } catch (err) {
    logEvent("ingestao_falhou", { estacao: stationId, tipo: (err as Error).name });
    return errorJson(503, "indisponivel", "Não foi possível gravar a medição.");
  }
  logEvent("ingestao_ok", { estacao: stationId });
  return json({ ok: true, recebidoEm: recebidoEm.toISOString() }, { status: 201 });
}

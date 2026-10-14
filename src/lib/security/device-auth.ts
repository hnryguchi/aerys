import { createHash, timingSafeEqual } from "node:crypto";
import { STATION_ID_PATTERN } from "../domain/stations";

/**
 * Autenticação por dispositivo: cada estação tem um token aleatório próprio.
 * O servidor guarda apenas o SHA-256 do token (variável AERYS_DEVICE_TOKENS).
 * O token não concede acesso ao banco: só permite enviar medições da própria estação.
 */

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Interpreta "aerys-001:<sha256hex>,aerys-002:<sha256hex>". Entradas malformadas são ignoradas. */
export function parseDeviceTokens(raw: string | undefined): Map<string, Buffer> {
  const map = new Map<string, Buffer>();
  if (!raw) return map;
  for (const part of raw.split(",")) {
    const [id, hash] = part.trim().split(":");
    if (!id || !hash) continue;
    if (!STATION_ID_PATTERN.test(id) || !/^[0-9a-f]{64}$/i.test(hash)) continue;
    if (/^0+$/.test(hash)) continue; // placeholder do .env.example nunca é aceito
    map.set(id, Buffer.from(hash.toLowerCase(), "hex"));
  }
  return map;
}

/** Tokens com no mínimo 32 caracteres do alfabeto base64url. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export function verifyDevice(tokens: Map<string, Buffer>, stationId: string | null, authorization: string | null): boolean {
  if (!stationId || !authorization) return false;
  const m = /^Bearer\s+(\S+)$/.exec(authorization);
  const token = m?.[1];
  if (!token || !TOKEN_PATTERN.test(token)) return false;
  const expected = tokens.get(stationId);
  // Compara mesmo quando a estação não existe, para não revelar quais IDs são válidos pelo tempo de resposta.
  const actual = Buffer.from(hashToken(token), "hex");
  const reference = expected ?? Buffer.alloc(32);
  const equal = timingSafeEqual(actual, reference);
  return equal && expected !== undefined;
}

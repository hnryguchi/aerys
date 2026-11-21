// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { createRateLimiter } from "./rate-limit";

/** Leitura pública: 120 requisições/min por IP. */
export const publicReadLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

/** Ingestão, antes da autenticação: 30 tentativas/min por IP (freia força bruta). */
export const ingestIpLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

/** Ingestão por estação autenticada: no máximo 1 medição a cada 10 s. */
export const ingestStationLimiter = createRateLimiter({ limit: 1, windowMs: 10_000 });

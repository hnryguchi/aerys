/**
 * Política de URLs para QR Codes: somente HTTPS em domínio público.
 * Bloqueia localhost, IPs privados e serviços de túnel temporário.
 * O QR contém apenas a URL pública da estação — nunca tokens, senhas ou Wi-Fi.
 */
const TEMPORARY_HOST_PATTERNS = [
  /(^|\.)localhost$/i,
  /\.local$/i,
  /\.invalid$/i,
  /\.example$/i,
  /\.test$/i,
  /ngrok/i,
  /trycloudflare\.com$/i,
  /loca\.lt$/i,
  /localtunnel/i,
  /serveo\.net$/i,
];

function isPrivateIp(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return host.startsWith("[") || host === "::1";
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

export interface QrUrlCheck {
  ok: boolean;
  motivo?: string;
}

export function checkDefinitiveUrl(raw: string | null | undefined): QrUrlCheck {
  if (!raw) return { ok: false, motivo: "URL pública do site não configurada (NEXT_PUBLIC_SITE_URL)." };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, motivo: "URL inválida." };
  }
  if (u.protocol !== "https:") return { ok: false, motivo: "A URL definitiva precisa usar HTTPS." };
  if (u.username || u.password) return { ok: false, motivo: "A URL não pode conter credenciais." };
  if (u.search || u.hash) return { ok: false, motivo: "A URL base não deve ter parâmetros." };
  if (isPrivateIp(u.hostname)) return { ok: false, motivo: "Endereço local/privado não é URL definitiva." };
  if (TEMPORARY_HOST_PATTERNS.some((p) => p.test(u.hostname))) {
    return { ok: false, motivo: "Endereço temporário ou de teste não é URL definitiva." };
  }
  return { ok: true };
}

export function stationPublicUrl(siteOrigin: string, stationId: string): string {
  return `${siteOrigin.replace(/\/+$/, "")}/estacao/${encodeURIComponent(stationId)}`;
}

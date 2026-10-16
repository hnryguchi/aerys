export const TIME_ZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";

export function formatNumber(v: number | null | undefined, decimals: number, grouping = true): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "sem dado";
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping }).format(v);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "sem dado";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "sem dado";
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "short" }).format(d);
}

export function formatTime(ms: number): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(ms);
}

export function formatDay(ms: number): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit" }).format(ms);
}

export function formatAge(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const s = Math.round((now.getTime() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(s)) return "";
  if (s < 60) return "há menos de 1 min";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `há ${h} h`;
  return `há ${Math.round(h / 24)} dias`;
}

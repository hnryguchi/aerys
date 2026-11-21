"use client";

import { useEffect, useState } from "react";

function texto(iso: string, now: number): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (!Number.isFinite(s)) return "";
  if (s < 60) return `há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `há ${h} h` : `há ${Math.round(h / 24)} dias`;
}

/** "há 12 s" que avança sozinho a cada segundo. */
export function LiveAge({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  // Antes da hidratação não há relógio do navegador: evita divergência servidor/cliente.
  return <span suppressHydrationWarning>{now === null ? "agora há pouco" : texto(iso, now)}</span>;
}

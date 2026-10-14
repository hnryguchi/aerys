"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Atualiza os dados do servidor periodicamente enquanto a aba estiver visível. */
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);
  return null;
}

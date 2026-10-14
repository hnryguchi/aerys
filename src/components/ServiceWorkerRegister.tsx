"use client";

import { useEffect } from "react";

/** Registra o service worker (PWA) apenas em produção. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // falha no registro não impede o uso do site
    });
  }, []);
  return null;
}

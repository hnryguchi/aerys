// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl() ?? "http://localhost:3000"),
  title: { default: "AERYS | Monitoramento ambiental urbano", template: "%s · AERYS" },
  description: "Plataforma aberta à consulta de dados ambientais urbanos: temperatura, umidade e pressão atmosférica por estação.",
  applicationName: "AERYS",
  appleWebApp: { capable: true, title: "AERYS", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b2b33" },
    { media: "(prefers-color-scheme: dark)", color: "#071a1f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <footer className="site-footer">
          <div className="container">
            <span>AERYS · monitoramento ambiental urbano · projeto em desenvolvimento</span>
            <span>
              <Link href="/sobre">Sobre o projeto</Link>
            </span>
          </div>
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { LogoMark } from "@/components/Logo";
import { getSiteUrl } from "@/lib/config";
import { getRepository } from "@/lib/data";
import { checkDefinitiveUrl, stationPublicUrl } from "@/lib/qr-policy";
import { stationIdSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `QR Code ${id.toUpperCase()}`, robots: { index: false } };
}

export default async function QrPage({ params }: Params) {
  const { id } = await params;
  if (!stationIdSchema.safeParse(id).success) notFound();
  const station = await getRepository().getStation(id);
  if (!station) notFound();

  const site = getSiteUrl();
  const check = checkDefinitiveUrl(site);
  let base = site;
  if (!check.ok) {
    // Pré-visualização com o endereço atual, claramente marcada como TESTE.
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    base = `${proto}://${host}`;
  }
  const url = stationPublicUrl(base!, id);
  // O QR contém somente a URL pública da estação.
  const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#0c1a22", light: "#ffffff" } });

  return (
    <div className="container page">
      <div className="qr-sheet">
        {!check.ok && (
          <div className="demo-banner no-print" role="alert" style={{ textAlign: "left" }}>
            <span>
              <strong>QR Code de TESTE — não imprimir como definitivo.</strong> {check.motivo} Este código aponta para o
              endereço atual ({base}), que pode ser temporário.
            </span>
          </div>
        )}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 12 }}>
          <LogoMark size={32} /> AERYS
        </div>
        <h1 style={{ fontSize: "1.6rem" }}>{station.nome}</h1>
        <p className="muted">Aponte a câmera do celular para ver as medições desta estação.</p>
        <div className="qr" aria-label={`QR Code para ${url}`} role="img" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="qr-url" style={{ marginTop: 12 }}>
          {url}
        </p>
        {!check.ok && (
          <p style={{ fontWeight: 700, color: "var(--serious-ink)" }}>
            TESTE — endereço não definitivo
          </p>
        )}
        <div className="btn-row no-print" style={{ justifyContent: "center", marginTop: 16 }}>
          <Link href={`/estacao/${id}`} className="btn btn-ghost">
            Voltar à estação
          </Link>
        </div>
      </div>
    </div>
  );
}

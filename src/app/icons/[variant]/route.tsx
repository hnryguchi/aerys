// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { renderAppIcon } from "@/lib/icon-image";

export const dynamic = "force-static";
export const dynamicParams = false;

const VARIANTS: Record<string, { size: number; padding: number }> = {
  "192": { size: 192, padding: 0 },
  "512": { size: 512, padding: 0 },
  "maskable-512": { size: 512, padding: 64 },
};

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ variant: string }> }) {
  const v = VARIANTS[(await ctx.params).variant];
  if (!v) return new Response("Não encontrado", { status: 404 });
  return renderAppIcon(v.size, v.padding);
}

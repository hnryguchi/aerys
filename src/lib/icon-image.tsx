import { ImageResponse } from "next/og";

/** Ícone do app (PNG) desenhado a partir da marca AERYS. `padding` > 0 para ícones "maskable". */
export function renderAppIcon(size: number, padding = 0): ImageResponse {
  const inner = size - padding * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#0b2b33" }}>
        <svg width={inner * 0.78} height={inner * 0.78} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#eaf6f6" strokeWidth="2" />
          <path d="M8 13c3-2.4 5.5 2.4 8.5 0s5.5 2.4 8.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 18c3-2.4 5.5 2.4 8.5 0s5.5 2.4 8.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          <path d="M11 22.6c2-1.4 3.7 1.4 5.5 0s3.5 1.4 5.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}

// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
/** Marca AERYS: anel com três linhas de fluxo de ar. */
export function LogoMark({ size = 28, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.2" opacity="0.9" />
      <path d="M8 13c3-2.4 5.5 2.4 8.5 0s5.5 2.4 8.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 18c3-2.4 5.5 2.4 8.5 0s5.5 2.4 8.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      <path d="M11 22.6c2-1.4 3.7 1.4 5.5 0s3.5 1.4 5.5 0" fill="none" stroke="#3cc2c2" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

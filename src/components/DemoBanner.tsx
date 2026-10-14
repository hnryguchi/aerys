/** Aviso obrigatório sempre que a fonte de dados for demonstrativa. */
export const DEMO_NOTICE = "Dados demonstrativos — não são medições reais";

export function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 10v5M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>
        <strong>{DEMO_NOTICE}.</strong> A interface está exibindo uma série simulada enquanto a estação física não
        está integrada à plataforma.
      </span>
    </div>
  );
}

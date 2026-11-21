// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
export default function Loading() {
  return (
    <div className="container page" aria-busy="true" aria-live="polite">
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Carregando dados da estação…</span>
      <div className="skeleton" style={{ height: 36, width: 220, marginBottom: 16 }} />
      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 104 }} />
        ))}
      </div>
      <div className="grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 240 }} />
        ))}
      </div>
    </div>
  );
}

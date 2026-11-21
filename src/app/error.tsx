// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Detalhes técnicos não são exibidos ao visitante.
  return (
    <div className="container page">
      <div className="card state">
        <h2>Não foi possível carregar os dados</h2>
        <p className="muted">A fonte de dados pode estar temporariamente indisponível. Tente novamente em instantes.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

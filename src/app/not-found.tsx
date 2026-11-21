// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page">
      <div className="card state">
        <h2>Página não encontrada</h2>
        <p className="muted">A estação ou página procurada não existe ou não está disponível publicamente.</p>
        <Link href="/painel" className="btn btn-primary">
          Ir para o painel
        </Link>
      </div>
    </div>
  );
}

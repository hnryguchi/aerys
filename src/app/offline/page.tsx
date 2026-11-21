// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão" };

export default function OfflinePage() {
  return (
    <div className="container page">
      <div className="card state">
        <h2>Você está sem conexão</h2>
        <p className="muted">As medições exigem internet para serem atualizadas. Reconecte-se e tente novamente.</p>
      </div>
    </div>
  );
}

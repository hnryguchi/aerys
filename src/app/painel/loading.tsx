// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
export default function Loading() {
  return (
    <div className="container page" aria-busy="true">
      <div className="skeleton" style={{ height: 36, width: 260, marginBottom: 20 }} />
      <div className="grid grid-2">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton" style={{ height: 180 }} />
        ))}
      </div>
    </div>
  );
}

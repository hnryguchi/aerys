// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import { STATUS_LABEL, STATUS_SHORT } from "@/lib/domain/status";
import type { ConnectivityStatus } from "@/lib/domain/types";

/** Estado nunca comunicado só pela cor: ponto + rótulo + descrição acessível. */
export function StatusBadge({ status }: { status: ConnectivityStatus }) {
  return (
    <span className={`status status--${status}`} title={STATUS_LABEL[status]}>
      <span className="status-dot" aria-hidden="true" />
      <span>{STATUS_SHORT[status]}</span>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {" "}
        ({STATUS_LABEL[status]})
      </span>
    </span>
  );
}

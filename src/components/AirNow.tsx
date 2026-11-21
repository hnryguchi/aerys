import { conforto, nivelAr, sensacaoTermica } from "@/lib/domain/air";
import type { ConnectivityStatus, Measurement } from "@/lib/domain/types";
import { formatNumber } from "@/lib/format";
import { AqScale } from "./AqScale";
import { LiveAge } from "./LiveAge";

/** Resumo para o público: qualidade do ar, sensação térmica e uma dica. */
export function AirNow({ ultima, status, demo }: { ultima: Measurement | null; status: ConnectivityStatus; demo: boolean }) {
  const ar = nivelAr(ultima);
  const sens = sensacaoTermica(ultima?.temperaturaC, ultima?.umidadePct);
  const conf = conforto(sens);
  const aoVivo = status === "online";

  return (
    <section className="airnow card" aria-labelledby="h-agora" style={ar ? ({ "--nivel": `var(${ar.corVar})` } as React.CSSProperties) : undefined}>
      <div className="airnow-top">
        <h2 id="h-agora" className="airnow-title">Como está o ar aqui agora?</h2>
        <span className={`live ${aoVivo ? "live--on" : ""}`}>
          <span className="live-dot" aria-hidden="true" />
          {aoVivo ? "Ao vivo" : demo ? "Demonstração" : "Última leitura"}
          {ultima && !demo && (
            <>
              {" · "}
              <LiveAge iso={ultima.medidoEm} />
            </>
          )}
        </span>
      </div>

      {ar ? (
        <div className="airnow-main">
          <span className="airnow-emoji" aria-hidden="true">{ar.emoji}</span>
          <div>
            <p className="airnow-level">Ar {ar.rotulo.toLowerCase()}</p>
            <p className="airnow-meaning">{ar.significado}</p>
          </div>
        </div>
      ) : (
        <div className="airnow-main">
          <span className="airnow-emoji" aria-hidden="true">🌡️</span>
          <div>
            <p className="airnow-level">{conf ? conf.rotulo : "Aguardando leitura"}</p>
            <p className="airnow-meaning">
              {ultima ? "O sensor de qualidade do ar ainda não enviou dados." : "Assim que a estação enviar dados, eles aparecem aqui."}
            </p>
          </div>
        </div>
      )}

      {ar && <AqScale atual={ar.nivel} />}

      <div className="airnow-facts">
        <div className="fact">
          <span className="fact-label">Sensação térmica</span>
          <span className="fact-value">
            {formatNumber(sens, 0)}
            {sens !== null && <small>°C</small>}
          </span>
          {conf && <span className={`fact-tag alerta-${conf.alerta}`}>{conf.rotulo}</span>}
        </div>
        <div className="fact fact-tip">
          <span className="fact-label">Dica</span>
          <span className="fact-text">{ar && ar.nivel >= 3 ? ar.dica : conf ? conf.dica : ar ? ar.dica : "Volte em instantes."}</span>
        </div>
      </div>
    </section>
  );
}

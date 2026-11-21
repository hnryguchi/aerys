// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
"use client";

import { useState } from "react";
import { NIVEIS_AR, type NivelAr } from "@/lib/domain/air";

/** Escala de 1 a 5: o nível atual fica destacado; tocar num nível mostra o que ele significa. */
export function AqScale({ atual }: { atual: NivelAr }) {
  const [sel, setSel] = useState<NivelAr>(atual);
  const info = NIVEIS_AR[sel - 1]!;
  return (
    <div className="aqscale">
      <div className="aqscale-bar" role="radiogroup" aria-label="Escala de qualidade do ar. Toque para ver o que cada nível significa.">
        {NIVEIS_AR.map((n) => (
          <button
            key={n.nivel}
            type="button"
            role="radio"
            aria-checked={sel === n.nivel}
            className={`aqscale-seg${n.nivel === atual ? " is-atual" : ""}${sel === n.nivel ? " is-sel" : ""}`}
            style={{ background: `var(${n.corVar})` }}
            onClick={() => setSel(n.nivel)}
          >
            <span className="aqscale-emoji" aria-hidden="true">{n.emoji}</span>
            <span className="aqscale-name">{n.rotulo}</span>
            {n.nivel === atual && <span className="aqscale-here">agora</span>}
          </button>
        ))}
      </div>
      <p className="aqscale-info" aria-live="polite">
        <strong>{info.rotulo}:</strong> {info.significado} {info.dica}
      </p>
    </div>
  );
}

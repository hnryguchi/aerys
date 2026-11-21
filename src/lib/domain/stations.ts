// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import type { Station } from "./types";

/** Local da Mostra JCC 2026 (mesmo texto gravado no banco pela migração de 20/11). */
export const LOCAL_MOSTRA = "Museu de Arte do Rio (MAR) · Praça Mauá, 5, Centro, Rio de Janeiro";

/**
 * Catálogo de estações usado nos modos "demo" e "local".
 * No modo "supabase" o catálogo vem da tabela public.estacoes.
 * A localização é o local real de instalação (ou null enquanto não houver).
 */
export const STATION_CATALOG: readonly Station[] = [
  {
    id: "aerys-001",
    nome: "AERYS-001",
    descricao: "Primeira estação do projeto: ESP32 com sensores de clima (temperatura, umidade e pressão), de qualidade do ar e display OLED.",
    localizacao: LOCAL_MOSTRA,
    intervaloEsperadoS: 60,
    sensores: ["Temperatura, umidade e pressão (AHT20 + BMP280)", "Qualidade do ar: CO₂ estimado e compostos voláteis (ENS160 + AHT21)"],
  },
];

/** Formato permanente dos identificadores: aerys-NNN. */
export const STATION_ID_PATTERN = /^aerys-\d{3}$/;

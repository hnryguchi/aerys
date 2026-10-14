import type { Station } from "./types";

/**
 * Catálogo de estações usado nos modos "demo" e "local".
 * No modo "supabase" o catálogo vem da tabela public.estacoes.
 * Não declarar localização enquanto não houver instalação definida.
 */
export const STATION_CATALOG: readonly Station[] = [
  {
    id: "aerys-001",
    nome: "AERYS-001",
    descricao: "Primeira estação do projeto: protótipo com ESP32, sensor de temperatura, umidade e pressão e display OLED.",
    localizacao: null,
    intervaloEsperadoS: 60,
    sensores: ["Temperatura, umidade e pressão (AHT20 + BMP280 ou BME280)"],
  },
];

/** Formato permanente dos identificadores: aerys-NNN. */
export const STATION_ID_PATTERN = /^aerys-\d{3}$/;

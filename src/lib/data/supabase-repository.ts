import { PERIOD_CONFIG } from "../domain/aggregate";
import type { Measurement, Period, Station } from "../domain/types";
import { DataUnavailableError, type MeasurementReader, type MeasurementWriter, type NewMeasurement } from "./repository";

/**
 * Acesso ao Supabase via PostgREST (fetch), sem SDK.
 * - Leitura: chave PUBLICÁVEL, sujeita às políticas RLS (somente estações públicas).
 * - Escrita: chave SECRETA, usada apenas pela rota de ingestão no servidor.
 */

interface EstacaoRow {
  id: string;
  nome: string;
  descricao: string;
  localizacao: string | null;
  intervalo_esperado_s: number;
  sensores: string[] | null;
}

interface MedicaoRow {
  estacao_id: string;
  medido_em: string;
  temperatura_c: number | null;
  umidade_pct: number | null;
  pressao_hpa: number | null;
  eco2_ppm?: number | null;
  tvoc_ppb?: number | null;
  iqa_uba?: number | null;
}

const COLS_BASE = "estacao_id,medido_em,temperatura_c,umidade_pct,pressao_hpa";
const COLS_AR = `${COLS_BASE},eco2_ppm,tvoc_ppb,iqa_uba`;

function headersFor(key: string): Record<string, string> {
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  // Chaves legadas (JWT) também exigem Authorization; as novas (sb_*) usam apenas apikey.
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

function toStation(r: EstacaoRow): Station {
  return {
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    localizacao: r.localizacao,
    intervaloEsperadoS: r.intervalo_esperado_s,
    sensores: r.sensores ?? [],
  };
}

function toMeasurement(r: MedicaoRow): Measurement {
  return {
    stationId: r.estacao_id,
    medidoEm: new Date(r.medido_em).toISOString(),
    temperaturaC: r.temperatura_c,
    umidadePct: r.umidade_pct,
    pressaoHpa: r.pressao_hpa,
    eco2Ppm: r.eco2_ppm ?? null,
    tvocPpb: r.tvoc_ppb ?? null,
    iqaUba: r.iqa_uba ?? null,
  };
}

export class SupabaseRepository implements MeasurementReader, MeasurementWriter {
  readonly source = "supabase" as const;

  constructor(
    private readonly url: string,
    private readonly publishableKey: string,
    private readonly secretKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async get<T>(pathAndQuery: string): Promise<T> {
    const res = await this.fetchImpl(`${this.url}/rest/v1/${pathAndQuery}`, {
      headers: headersFor(this.publishableKey),
      cache: "no-store",
    });
    if (!res.ok) throw new DataUnavailableError(`Leitura falhou (HTTP ${res.status})`);
    return (await res.json()) as T;
  }

  async listStations(): Promise<Station[]> {
    const rows = await this.get<EstacaoRow[]>(
      "estacoes?select=id,nome,descricao,localizacao,intervalo_esperado_s,sensores&order=id.asc",
    );
    return rows.map(toStation);
  }

  async getStation(id: string): Promise<Station | null> {
    const rows = await this.get<EstacaoRow[]>(
      `estacoes?select=id,nome,descricao,localizacao,intervalo_esperado_s,sensores&id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    return rows[0] ? toStation(rows[0]) : null;
  }

  async getLatest(stationId: string): Promise<Measurement | null> {
    const q = `&estacao_id=eq.${encodeURIComponent(stationId)}&order=medido_em.desc&limit=1`;
    let rows: MedicaoRow[];
    try {
      rows = await this.get<MedicaoRow[]>(`medicoes?select=${COLS_AR}${q}`);
    } catch (err) {
      // Banco ainda sem as colunas do sensor de ar (migração pendente): lê só o clima.
      if (!(err instanceof DataUnavailableError) || !/HTTP 400/.test(err.message)) throw err;
      rows = await this.get<MedicaoRow[]>(`medicoes?select=${COLS_BASE}${q}`);
    }
    return rows[0] ? toMeasurement(rows[0]) : null;
  }

  async getHistory(stationId: string, period: Period, now: Date = new Date()): Promise<Measurement[]> {
    const { durationMs, bucketMs } = PERIOD_CONFIG[period];
    const res = await this.fetchImpl(`${this.url}/rest/v1/rpc/medicoes_agregadas`, {
      method: "POST",
      headers: headersFor(this.publishableKey),
      cache: "no-store",
      body: JSON.stringify({
        p_estacao: stationId,
        p_desde: new Date(now.getTime() - durationMs).toISOString(),
        p_bucket_minutos: bucketMs / 60_000,
      }),
    });
    if (!res.ok) throw new DataUnavailableError(`Histórico falhou (HTTP ${res.status})`);
    const rows = (await res.json()) as (Omit<MedicaoRow, "estacao_id" | "medido_em"> & { bucket: string })[];
    return rows.map((r) => toMeasurement({ ...r, estacao_id: stationId, medido_em: r.bucket }));
  }

  async insert(m: NewMeasurement, receivedAt: Date): Promise<void> {
    if (!this.secretKey) throw new DataUnavailableError("Escrita não configurada");
    const res = await this.fetchImpl(`${this.url}/rest/v1/medicoes`, {
      method: "POST",
      headers: { ...headersFor(this.secretKey), Prefer: "return=minimal" },
      cache: "no-store",
      body: JSON.stringify({
        estacao_id: m.stationId,
        medido_em: receivedAt.toISOString(),
        temperatura_c: m.temperaturaC,
        umidade_pct: m.umidadePct,
        pressao_hpa: m.pressaoHpa,
        // Colunas do sensor de ar só vão quando há valor (compatível com banco sem a migração).
        ...(m.eco2Ppm != null ? { eco2_ppm: m.eco2Ppm } : {}),
        ...(m.tvocPpb != null ? { tvoc_ppb: m.tvocPpb } : {}),
        ...(m.iqaUba != null ? { iqa_uba: m.iqaUba } : {}),
        rssi_dbm: m.rssiDbm,
        firmware: m.firmware,
      }),
    });
    if (!res.ok) throw new DataUnavailableError(`Gravação falhou (HTTP ${res.status})`);
  }
}

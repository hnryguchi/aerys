import type { Metadata } from "next";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DemoBanner } from "@/components/DemoBanner";
import { StationCard } from "@/components/StationCard";
import { getRepository, listSnapshots } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel ambiental" };

export default async function PainelPage() {
  const repo = getRepository();
  const snaps = await listSnapshots(repo);
  return (
    <div className="container page">
      <AutoRefresh />
      <p className="eyebrow">Painel</p>
      <h1>Painel ambiental</h1>
      <p className="muted" style={{ maxWidth: "60ch" }}>
        Situação atual de cada estação. Selecione uma estação para ver o histórico das últimas 24 horas ou 7 dias.
      </p>
      {repo.source === "demo" && <DemoBanner />}
      {snaps.length === 0 ? (
        <div className="card state">
          <h2>Nenhuma estação pública</h2>
          <p className="muted">Ainda não há estações disponíveis para consulta.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {snaps.map((s) => (
            <StationCard key={s.station.id} snap={s} />
          ))}
        </div>
      )}
    </div>
  );
}

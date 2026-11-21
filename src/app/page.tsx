// © 2026 Henry Noguchi (github.com/hnryguchi). Todos os direitos reservados / All rights reserved. Ver/see LICENSE.
import Link from "next/link";
import { DemoBanner } from "@/components/DemoBanner";
import { StationCard } from "@/components/StationCard";
import { getRepository, listSnapshots } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const repo = getRepository();
  const snaps = await listSnapshots(repo).catch(() => null);
  const isDemo = repo.source === "demo";

  return (
    <>
      <section className="hero">
        <svg className="hero-flow" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-20 140C200 80 380 200 600 140S1000 80 1220 150" />
          <path d="M-20 220C220 160 400 280 620 220S1020 160 1220 230" />
          <path d="M-20 300C240 250 420 350 640 300S1040 250 1220 310" />
        </svg>
        <div className="container">
          <p className="eyebrow">Monitoramento ambiental urbano</p>
          <h1>O ar da cidade, em dados que qualquer pessoa entende.</h1>
          <p className="lead">
            O AERYS reúne medições de estações ambientais de baixo custo e as apresenta de forma aberta e acessível,
            no celular ou no computador.
          </p>
          <div className="btn-row">
            <Link href="/painel" className="btn btn-primary">
              Ver painel
            </Link>
            <Link href="/sobre" className="btn btn-ghost">
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>O que a estação mede</h2>
          <div className="grid grid-3" style={{ marginTop: 16 }}>
            <div className="card">
              <h3>Temperatura</h3>
              <p className="muted small">Em graus Celsius (°C), para acompanhar o calor ao longo do dia.</p>
            </div>
            <div className="card">
              <h3>Umidade relativa</h3>
              <p className="muted small">Em porcentagem (%), indicador de conforto e de tempo seco.</p>
            </div>
            <div className="card">
              <h3>Pressão atmosférica</h3>
              <p className="muted small">Em hectopascal (hPa), útil para observar mudanças de tempo.</p>
            </div>
            <div className="card">
              <h3>Qualidade do ar</h3>
              <p className="muted small">CO₂ estimado e compostos voláteis, num índice de 1 (excelente) a 5 (muito ruim).</p>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Sensor de material particulado (PM2.5) e versão com GPS para postes e praças estão previstos para as próximas versões.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Como os dados chegam até você</h2>
          <ol className="steps" style={{ marginTop: 16 }}>
            <li>
              <strong>Estação</strong>
              <span className="small muted">ESP32 com sensores lê o ambiente.</span>
            </li>
            <li>
              <strong>Envio seguro</strong>
              <span className="small muted">Medições vão pela internet com credencial própria do dispositivo.</span>
            </li>
            <li>
              <strong>Banco de dados</strong>
              <span className="small muted">Registros com data e hora de recebimento.</span>
            </li>
            <li>
              <strong>Painel público</strong>
              <span className="small muted">Qualquer pessoa consulta, inclusive por QR Code.</span>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Estações</h2>
          {isDemo && <DemoBanner />}
          {snaps === null ? (
            <p className="muted">Não foi possível carregar as estações agora.</p>
          ) : (
            <div className="grid grid-2">
              {snaps.map((s) => (
                <StationCard key={s.station.id} snap={s} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

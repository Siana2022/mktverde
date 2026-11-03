import React from "react";
import type { SourceStatus } from "@/lib/types";
import { COUNTRY_META } from "@/lib/types";

export function Kpi({ lab, val, sub, amz, subHtml }: { lab: string; val: React.ReactNode; sub?: string; subHtml?: string; amz?: boolean }) {
  return (
    <div className={"kpi" + (amz ? " amz" : "")}>
      <div className="lab">{lab}</div>
      <div className="val num">{val}</div>
      {subHtml ? (
        <div className="sub" dangerouslySetInnerHTML={{ __html: subHtml }} />
      ) : sub ? (
        <div className="sub">{sub}</div>
      ) : null}
    </div>
  );
}

export function Legend({ items }: { items: [string, string, string][] }) {
  return (
    <div className="legend">
      {items.map(([k, v, lab]) => (
        <span className="lg" key={k}>
          <span className="sw" style={{ background: `var(${v})` }} />
          {lab}
        </span>
      ))}
    </div>
  );
}

export function SourceBanner({ live, sources, generatedAt, fx }: { live: boolean; sources: SourceStatus; generatedAt: string; fx?: Record<string, number> }) {
  const when = new Date(generatedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  const paises = (sources.shopifyCountries || []).map((c) => COUNTRY_META[c].label).join(", ");
  const on = [
    sources.shopify && `Shopify (${paises || "—"})`,
    sources.googleAds && "Google Ads",
    sources.meta && "Meta Ads",
    sources.amazon && "Amazon (manual)",
    sources.terceros && "Terceros (manual)",
  ].filter(Boolean).join(" · ");
  const fxNote = fx && fx.USD ? ` · 1 USD = ${fx.USD.toLocaleString("es-ES", { maximumFractionDigits: 2 })} €` : "";
  if (live) {
    return (
      <div className="banner">
        <span>🟢</span>
        <span><b>Datos en vivo</b> — {on}. Actualizado {when}{fxNote}.</span>
      </div>
    );
  }
  return (
    <div className="banner warn">
      <span>📌</span>
      <span>
        <b>Datos reales (instantánea)</b> — capturados el {when}. Añade las credenciales en Vercel para que se actualice solo.
      </span>
    </div>
  );
}

export function PendingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="empty">
        <span className="big">Pendiente de conectar</span>
        {children}
      </div>
    </div>
  );
}

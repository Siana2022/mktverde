import React from "react";

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

export function SourceBanner({ live, sources, generatedAt }: { live: boolean; sources: { shopify: boolean; googleAds: boolean }; generatedAt: string }) {
  const when = new Date(generatedAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  if (live) {
    const on = [sources.shopify && "Shopify", sources.googleAds && "Google Ads"].filter(Boolean).join(" + ");
    return (
      <div className="banner">
        <span>🟢</span>
        <span>
          <b>Datos en vivo</b> — {on}. Actualizado {when}. Meta Ads y Amazon: pendientes de conectar (fase 2).
        </span>
      </div>
    );
  }
  return (
    <div className="banner warn">
      <span>📌</span>
      <span>
        <b>Datos reales (instantánea)</b> — capturados de Shopify y Google Ads el {when}. Añade las credenciales en Vercel
        para que se actualice solo. Meta Ads y Amazon: pendientes de conectar (fase 2).
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

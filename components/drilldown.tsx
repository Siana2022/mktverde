"use client";

import React from "react";
import type { MonthPoint } from "@/lib/types";
import { CHANNEL_META, type Channel } from "@/lib/attribution";
import { eur, roas as fmtRoas, delta, num } from "@/lib/format";
import { showTT, hideTT } from "./tooltip";

const PAID: Channel[] = ["google", "meta"];

function channelSeries(months: MonthPoint[], ch: Channel) {
  return months.map((m) => {
    const sales = m.webByChannel ? m.webByChannel[ch] || 0 : 0;
    const spend = ch === "google" ? m.googleSpend : ch === "meta" ? (m.metaSpend ?? 0) : 0;
    const hasSpend = ch === "google" ? true : ch === "meta" ? m.metaSpend !== undefined : false;
    return { key: m.key, label: m.label, partial: Boolean(m.partial), sales, spend, hasSpend, roas: spend ? sales / spend : 0 };
  });
}

// Gráfico combinado: barras = ventas atribuidas, línea = inversión (misma escala €).
function SalesVsSpend({ data, paid }: { data: ReturnType<typeof channelSeries>; paid: boolean }) {
  const W = 620, H = 250, padL = 46, padB = 28, padT = 12, padR = 10;
  const yMax = Math.max(...data.map((d) => d.sales), 1);
  const nice = Math.max(1000, Math.ceil(yMax / 1000) * 1000);
  const bw = (W - padL - padR) / Math.max(data.length, 1);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / nice);
  const linePts = data.map((d, i) => `${padL + bw * i + bw / 2},${y(d.spend)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas atribuidas vs inversión por mes">
      {[0, nice / 2, nice].map((t, i) => (
        <g key={i}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 6} y={y(t) + 3} textAnchor="end">{Math.round(t / 1000)}k</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + bw * i + bw * 0.22, w = bw * 0.56;
        const h = (H - padT - padB) * d.sales / nice;
        return (
          <g key={d.key}>
            <rect className="seg" x={x} y={y(d.sales)} width={w} height={h} rx="2" fill="var(--accent)" opacity={d.partial ? 0.55 : 0.9}
              onMouseMove={(e) => showTT(e, `${d.label} · ventas <span class="num">${eur(d.sales)}</span>${paid ? ` · ROAS <span class="num">${fmtRoas(d.roas)}</span>` : ""}`)} onMouseLeave={hideTT} />
            <text className="axis" x={x + w / 2} y={H - padB + 14} textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
      {paid && (
        <>
          <polyline points={linePts} fill="none" stroke="var(--c-google)" strokeWidth={2} strokeLinejoin="round" />
          {data.map((d, i) => (
            <circle key={d.key} cx={padL + bw * i + bw / 2} cy={y(d.spend)} r={3} fill="var(--c-google)"
              onMouseMove={(e) => showTT(e, `${d.label} · inversión <span class="num">${eur(d.spend)}</span>`)} onMouseLeave={hideTT} />
          ))}
        </>
      )}
    </svg>
  );
}

export function ChannelDetail({ months, channel, onClose }: { months: MonthPoint[]; channel: Channel; onClose: () => void }) {
  const meta = CHANNEL_META[channel];
  const paid = PAID.includes(channel);
  const series = channelSeries(months, channel);
  const withData = series.length;
  const last = series[withData - 1];
  const prev = withData >= 2 ? series[withData - 2] : null;

  const totalSales = series.reduce((a, d) => a + d.sales, 0);
  const totalSpend = series.reduce((a, d) => a + d.spend, 0);
  const totalRoas = totalSpend ? totalSales / totalSpend : 0;

  // Crecimiento mes vs mes anterior.
  const dSales = prev ? delta(last.sales, prev.sales) : { text: "—", cls: "flat" as const };
  const dSpend = prev ? delta(last.spend, prev.spend) : { text: "—", cls: "flat" as const };
  const dRoas = prev && prev.roas ? delta(last.roas, prev.roas) : { text: "—", cls: "flat" as const };

  return (
    <section>
      <div className="card detail">
        <div className="detail-head">
          <h3><span className="sw" style={{ background: `var(${meta.varName})` }} /> {meta.label} · detalle</h3>
          <button className="xbtn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="cap">
          Inversión vs ventas atribuidas y crecimiento · {series.length} {series.length === 1 ? "mes" : "meses"} del rango
          {paid ? "" : " · canal sin inversión directa (venta ganada)"}
        </div>

        <section className="kpis" style={{ marginTop: 6 }}>
          <div className="kpi">
            <div className="lab">Ventas ({last.label})</div>
            <div className="val num">{eur(last.sales)}</div>
            <div className={"sub " + dSales.cls}>{dSales.text} vs mes anterior</div>
          </div>
          {paid ? (
            <>
              <div className="kpi">
                <div className="lab">Inversión ({last.label})</div>
                <div className="val num">{last.hasSpend ? eur(last.spend) : "—"}</div>
                <div className={"sub " + dSpend.cls}>{dSpend.text} vs mes anterior</div>
              </div>
              <div className="kpi">
                <div className="lab">ROAS ({last.label})</div>
                <div className="val num">{last.spend ? fmtRoas(last.roas) : "—"}</div>
                <div className={"sub " + dRoas.cls}>{dRoas.text} vs mes anterior</div>
              </div>
              <div className="kpi">
                <div className="lab">ROAS del rango</div>
                <div className="val num">{totalSpend ? fmtRoas(totalRoas) : "—"}</div>
                <div className="sub">{eur(totalSales)} ÷ {eur(totalSpend)}</div>
              </div>
            </>
          ) : (
            <>
              <div className="kpi">
                <div className="lab">Ventas del rango</div>
                <div className="val num">{eur(totalSales)}</div>
                <div className="sub">suma del canal</div>
              </div>
              <div className="kpi">
                <div className="lab">Media por mes</div>
                <div className="val num">{eur(totalSales / Math.max(series.length, 1))}</div>
                <div className="sub">{num(series.length)} meses</div>
              </div>
              <div className="kpi">
                <div className="lab">Tendencia</div>
                <div className="val num">{dSales.text}</div>
                <div className="sub">último mes vs anterior</div>
              </div>
            </>
          )}
        </section>

        <div style={{ marginTop: 14 }}>
          <SalesVsSpend data={series} paid={paid} />
        </div>
        {paid && (
          <div className="legend" style={{ marginTop: 6 }}>
            <span className="lg"><span className="sw" style={{ background: "var(--accent)" }} />Ventas atribuidas</span>
            <span className="lg"><span className="sw" style={{ background: "var(--c-google)" }} />Inversión</span>
          </div>
        )}
        <div className="note" style={{ marginTop: 10 }}>
          <span>ℹ︎</span>
          <span>
            Ventas atribuidas por nuestra atribución propia (UTMs/clic de pago del pedido).
            {paid ? " El ROAS aquí = ventas atribuidas ÷ inversión de la plataforma (más conservador que el ROAS que declara la propia plataforma)." : " Este canal no tiene inversión directa asociada."}
          </span>
        </div>
      </div>
    </section>
  );
}

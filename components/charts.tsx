"use client";

import React from "react";
import type { MonthPoint, DayPoint, HourPoint } from "@/lib/types";
import { eur, roas as fmtRoas, dayNum } from "@/lib/format";
import { showTT, hideTT } from "./tooltip";

const niceMax = (v: number, step: number) => Math.max(step, Math.ceil(v / step) * step);

// ── Barras mensuales de ventas web ──
export function MonthlyWeb({ months }: { months: MonthPoint[] }) {
  const W = 560, H = 240, padL = 44, padB = 26, padT = 10, padR = 8;
  const yMax = niceMax(Math.max(...months.map((m) => m.webTotal), 1), 10000);
  const bw = (W - padL - padR) / months.length, y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas web mensuales">
      {[0, yMax / 2, yMax].map((t, i) => (
        <g key={i}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 6} y={y(t) + 3} textAnchor="end">{Math.round(t / 1000)}k</text>
        </g>
      ))}
      {months.map((m, i) => {
        const x = padL + bw * i + bw * 0.2, w = bw * 0.6, h = (H - padT - padB) * m.webTotal / yMax;
        return (
          <g key={m.key}>
            <rect className="seg" x={x} y={y(m.webTotal)} width={w} height={h} rx="3" fill="var(--accent)" opacity={m.partial ? 0.72 : 1}
              onMouseMove={(e) => showTT(e, `${m.label}${m.partial ? " (en curso)" : ""} · <span class="num">${eur(m.webTotal)}</span> · ${m.webOrders} ped.`)}
              onMouseLeave={hideTT} />
            <text className="axis" x={x + w / 2} y={H - padB + 14} textAnchor="middle">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Ventas web (barras) vs valor atribuido por Google (línea), mismo eje € ──
export function WebVsGoogle({ months }: { months: MonthPoint[] }) {
  const W = 560, H = 230, padL = 44, padB = 26, padT = 12, padR = 10;
  const yMax = niceMax(Math.max(...months.map((m) => m.webTotal), 1), 10000);
  const bw = (W - padL - padR) / months.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  const xc = (i: number) => padL + bw * i + bw * 0.5;
  const line = months.map((m, i) => `${i ? "L" : "M"}${xc(i)} ${y(m.googleConvValue)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas web vs valor atribuido Google">
      {[0, yMax / 2, yMax].map((t, i) => (
        <g key={i}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 6} y={y(t) + 3} textAnchor="end">{Math.round(t / 1000)}k</text>
        </g>
      ))}
      {months.map((m, i) => {
        const x = padL + bw * i + bw * 0.22, w = bw * 0.56, h = (H - padT - padB) * m.webTotal / yMax;
        return (
          <g key={m.key}>
            <rect className="seg" x={x} y={y(m.webTotal)} width={w} height={h} rx="3" fill="var(--accent)" opacity={m.partial ? 0.72 : 1}
              onMouseMove={(e) => showTT(e, `${m.label} · web <span class="num">${eur(m.webTotal)}</span>`)} onMouseLeave={hideTT} />
            <text className="axis" x={x + w / 2} y={H - padB + 14} textAnchor="middle">{m.label}</text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke="var(--c-google)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {months.map((m, i) => (
        <circle key={m.key} cx={xc(i)} cy={y(m.googleConvValue)} r="4" fill="var(--c-google)" stroke="var(--surface)" strokeWidth="1.5"
          onMouseMove={(e) => showTT(e, `${m.label} · atribuido Google <span class="num">${eur(m.googleConvValue)}</span>`)} onMouseLeave={hideTT} />
      ))}
    </svg>
  );
}

// ── Barras diarias de ventas web (mes en curso) ──
export function DailyWeb({ days }: { days: DayPoint[] }) {
  const W = 560, H = 210, padL = 40, padB = 22, padT = 10, padR = 6;
  const yMax = niceMax(Math.max(...days.map((d) => d.webTotal), 1), 1000);
  const bw = (W - padL - padR) / Math.max(days.length, 1), y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas web diarias">
      {[0, yMax / 2, yMax].map((t, i) => (
        <g key={i}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 5} y={y(t) + 3} textAnchor="end">{Math.round(t / 1000)}k</text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = padL + bw * i + bw * 0.14, w = bw * 0.72, h = (H - padT - padB) * d.webTotal / yMax;
        const dd = dayNum(d.day);
        return (
          <g key={d.day} onMouseMove={(e) => showTT(e, `${dd} · <span class="num">${eur(d.webTotal)}</span> · ${d.webOrders} ped.`)} onMouseLeave={hideTT}>
            <rect className="seg" x={x} y={y(d.webTotal)} width={w} height={Math.max(h, 0.6)} fill="var(--accent)" rx="1.5" />
            {Number(dd) % 5 === 0 && <text className="axis" x={x + w / 2} y={H - padB + 13} textAnchor="middle">{dd}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Línea de ROAS Google por mes ──
export function RoasLine({ months }: { months: MonthPoint[] }) {
  const W = 560, H = 200, padL = 34, padB = 24, padT = 14, padR = 10;
  const rs = months.map((m) => (m.googleSpend ? m.googleConvValue / m.googleSpend : 0));
  const yMax = niceMax(Math.max(...rs, 1), 2);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  const x = (i: number) => padL + (W - padL - padR) * (i / Math.max(months.length - 1, 1));
  const ticks = Array.from({ length: yMax + 1 }, (_, t) => t);
  const d = months.map((m, i) => `${i ? "L" : "M"}${x(i)} ${y(rs[i])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="ROAS Google por mes">
      {ticks.map((t) => (
        <g key={t}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 6} y={y(t) + 3} textAnchor="end">{t}x</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--c-google)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {months.map((m, i) => (
        <circle key={m.key} cx={x(i)} cy={y(rs[i])} r="4" fill="var(--c-google)" stroke="var(--surface)" strokeWidth="1.5"
          onMouseMove={(e) => showTT(e, `${m.label} · ROAS <span class="num">${fmtRoas(rs[i])}</span>`)} onMouseLeave={hideTT} />
      ))}
      {months.map((m, i) => <text key={m.key} className="axis" x={x(i)} y={H - padB + 14} textAnchor="middle">{m.label}</text>)}
    </svg>
  );
}

// ── Barras por hora (hoy) con marcador "ahora" ──
export function HourlyWeb({ hours, nowHour }: { hours: HourPoint[]; nowHour: number }) {
  const W = 560, H = 220, padL = 40, padB = 22, padT = 10, padR = 6;
  const shown = hours.map((h) => (h.hour <= nowHour ? h.webTotal : 0));
  const yMax = niceMax(Math.max(...shown, 1), 50);
  const bw = (W - padL - padR) / 24, y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  const xC = (h: number) => padL + bw * h + bw * 0.15, w = bw * 0.7, nowX = padL + bw * (nowHour + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ventas web por hora, hoy">
      {[0, yMax / 2, yMax].map((t, i) => (
        <g key={i}>
          <line className="gl" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          <text className="axis" x={padL - 5} y={y(t) + 3} textAnchor="end">{Math.round(t)}</text>
        </g>
      ))}
      {hours.map((h) => {
        if (h.hour > nowHour) return h.hour % 3 === 0 ? <text key={h.hour} className="axis" x={xC(h.hour) + w / 2} y={H - padB + 13} textAnchor="middle" opacity={0.5}>{h.hour}</text> : null;
        const hh = (H - padT - padB) * h.webTotal / yMax;
        return (
          <g key={h.hour} onMouseMove={(e) => showTT(e, `${h.hour}:00 · <span class="num">${eur(h.webTotal)}</span> · ${h.webOrders} ped.`)} onMouseLeave={hideTT}>
            <rect className="seg" x={xC(h.hour)} y={y(h.webTotal)} width={w} height={Math.max(hh, 0.6)} rx="1.5" fill="var(--accent)" />
            {h.hour % 3 === 0 && <text className="axis" x={xC(h.hour) + w / 2} y={H - padB + 13} textAnchor="middle">{h.hour}</text>}
          </g>
        );
      })}
      <line x1={nowX} x2={nowX} y1={padT} y2={H - padB} stroke="var(--accent)" strokeWidth="1.3" strokeDasharray="3 3" />
      <text x={nowX + 3} y={padT + 9} fontSize="9.5" fill="var(--accent)" fontWeight="600">ahora</text>
    </svg>
  );
}

// ── Donut Web vs Amazon ──
export function Donut({ web, amazon, label }: { web: number; amazon: number | null; label: string }) {
  const segs: [string, number, string][] = [["Web (Shopify)", web, "var(--accent)"]];
  if (amazon && amazon > 0) segs.push(["Amazon", amazon, "var(--amz)"]);
  const tot = segs.reduce((a, s) => a + s[1], 0) || 1, R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 130 130" width="130" height="130" style={{ flex: "none" }}>
        <circle cx="65" cy="65" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="18" />
        {segs.map((s, i) => {
          const len = C * (s[1] / tot), el = (
            <circle key={i} cx="65" cy="65" r={R} fill="none" stroke={s[2]} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 65 65)" />
          );
          off += len;
          return el;
        })}
        <text x="65" y="61" textAnchor="middle" className="num" fontFamily="var(--f-disp)" fontSize="18" fill="var(--ink)">{eur(tot)}</text>
        <text x="65" y="78" textAnchor="middle" fontSize="10" fill="var(--faint)">{label}</text>
      </svg>
      <div className="donut-legend">
        {segs.map((s, i) => (
          <div className="dl" key={i}>
            <span className="sw" style={{ width: 12, height: 12, borderRadius: 3, background: s[2] }} />
            <div><b>{s[0]}</b> · <span className="num">{eur(s[1])}</span> <span>({Math.round((s[1] / tot) * 100)}%)</span></div>
          </div>
        ))}
        {!(amazon && amazon > 0) && (
          <div className="dl">
            <span className="sw" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--amz)", opacity: 0.4 }} />
            <div><b>Amazon</b> · <span>pendiente (fase 2)</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Barras horizontales de reparto (atribución) ──
export function ChannelBars({ rows }: { rows: { label: string; value: number; color: string; note?: string }[] }) {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      {rows.map((r) => (
        <div className="chrow" key={r.label}>
          <div className="chname"><span className="sw" style={{ background: r.color }} />{r.label}</div>
          <div className="chbarwrap"><div className="chbar" style={{ width: (r.value / max) * 100 + "%", background: r.color }} /></div>
          <div className="chval num"><b>{eur(r.value)}</b><span>{Math.round((r.value / total) * 100)}%</span></div>
        </div>
      ))}
    </div>
  );
}

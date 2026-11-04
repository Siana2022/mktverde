"use client";

import React, { useState } from "react";
import type { PanelData, MonthPoint } from "@/lib/types";
import { emptySplit, addSplit, type Channel } from "@/lib/attribution";
import { eur, eur1, num, roas, delta } from "@/lib/format";
import { Kpi, Legend, PendingCard } from "./ui";
import { MonthlyWeb, RoasLine, ChannelMix, DailyStack, HourlyStack, ChannelBars, channelLegend } from "./charts";
import { ChannelDetail } from "./drilldown";

const monthName: Record<string, string> = {
  ene: "enero", feb: "febrero", mar: "marzo", abr: "abril", may: "mayo", jun: "junio",
  jul: "julio", ago: "agosto", sep: "septiembre", oct: "octubre", nov: "noviembre", dic: "diciembre",
};
const mLong = (m: MonthPoint) => (monthName[m.label] ?? m.label) + (m.partial ? " (en curso)" : "");
const MONTHS3 = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Agrega todos los meses del rango seleccionado en un único "periodo" (sumas).
function periodAgg(d: PanelData): MonthPoint {
  const acc: MonthPoint = {
    key: "range", label: "", webTotal: 0, webGross: 0, webNet: 0, webOrders: 0, aov: 0,
    googleSpend: 0, googleConvValue: 0, googleConversions: 0, googleClicks: 0, googleImpressions: 0,
    webByChannel: emptySplit(),
  };
  let meta = false, amazon = false, terceros = false, prev = false;
  for (const m of d.months) {
    acc.webTotal += m.webTotal; acc.webGross += m.webGross; acc.webNet += m.webNet; acc.webOrders += m.webOrders;
    acc.googleSpend += m.googleSpend; acc.googleConvValue += m.googleConvValue; acc.googleConversions += m.googleConversions;
    acc.googleClicks += m.googleClicks; acc.googleImpressions += m.googleImpressions;
    if (m.metaSpend !== undefined) { meta = true; acc.metaSpend = (acc.metaSpend || 0) + m.metaSpend; acc.metaConvValue = (acc.metaConvValue || 0) + (m.metaConvValue || 0); }
    if (m.amazonTotal !== undefined) { amazon = true; acc.amazonTotal = (acc.amazonTotal || 0) + m.amazonTotal; acc.amazonOrders = (acc.amazonOrders || 0) + (m.amazonOrders || 0); acc.amazonSpend = (acc.amazonSpend || 0) + (m.amazonSpend || 0); acc.amazonConvValue = (acc.amazonConvValue || 0) + (m.amazonConvValue || 0); }
    if (m.tercerosTotal !== undefined) { terceros = true; acc.tercerosTotal = (acc.tercerosTotal || 0) + m.tercerosTotal; acc.tercerosOrders = (acc.tercerosOrders || 0) + (m.tercerosOrders || 0); }
    if (m.prevYearWebTotal !== undefined) { prev = true; acc.prevYearWebTotal = (acc.prevYearWebTotal || 0) + m.prevYearWebTotal; acc.prevYearWebOrders = (acc.prevYearWebOrders || 0) + (m.prevYearWebOrders || 0); }
    if (m.webByChannel) acc.webByChannel = addSplit(acc.webByChannel as NonNullable<MonthPoint["webByChannel"]>, m.webByChannel);
  }
  acc.aov = acc.webOrders ? acc.webTotal / acc.webOrders : 0;
  acc.partial = d.months.some((m) => m.partial);
  if (!meta) acc.metaSpend = undefined;
  if (!amazon) acc.amazonTotal = undefined;
  if (!terceros) acc.tercerosTotal = undefined;
  if (!prev) acc.prevYearWebTotal = undefined;
  return acc;
}

// Etiqueta del periodo seleccionado (p. ej. "may–nov" o "noviembre").
function periodLabel(d: PanelData): string {
  if (!d.months.length) return "";
  const first = d.months[0], last = d.months[d.months.length - 1];
  return d.months.length === 1 ? mLong(first) : `${first.label}–${last.label}`;
}

// Etiqueta del tramo diario mostrado (un mes, o un rango de días).
function dailyLabel(d: PanelData): string {
  const days = d.currentMonthDaily;
  if (!days.length) return periodLabel(d);
  const f = days[0].day, l = days[days.length - 1].day;
  if (f.slice(0, 7) === l.slice(0, 7)) return monthName[MONTHS3[parseInt(f.slice(5, 7), 10) - 1]] ?? f.slice(0, 7);
  return `${parseInt(f.slice(8, 10), 10)} ${MONTHS3[parseInt(f.slice(5, 7), 10) - 1]} – ${parseInt(l.slice(8, 10), 10)} ${MONTHS3[parseInt(l.slice(5, 7), 10) - 1]}`;
}

function countryLabel(d: PanelData): string {
  if (d.country === "all") return "Todos los países";
  const c = d.countriesAvailable.find((x) => x.code === d.country);
  return c ? `${c.flag} ${c.label}` : d.country;
}
const totalMonth = (m: MonthPoint) => m.webTotal + (m.amazonTotal || 0) + (m.tercerosTotal || 0);

// ── GLOBAL ──
export function GlobalView({ data }: { data: PanelData }) {
  const m = periodAgg(data);
  const tot = totalMonth(m);
  const hasPrev = data.months.some((x) => x.prevYearWebTotal !== undefined);
  const yoy = m.prevYearWebTotal !== undefined ? delta(m.webTotal, m.prevYearWebTotal) : null;
  const webSubHtml = yoy
    ? `${num(m.webOrders)} pedidos · <span class="${yoy.cls}">${yoy.text} vs año pasado</span>`
    : undefined;
  const sourceRows = [
    { label: "Web (Shopify)", value: m.webTotal, color: "var(--c-google)" },
    { label: "Amazon", value: m.amazonTotal || 0, color: "var(--c-meta)", note: m.amazonTotal === undefined ? "sin dato" : undefined },
    { label: "Terceros", value: m.tercerosTotal || 0, color: "var(--c-email)", note: m.tercerosTotal === undefined ? "sin dato" : undefined },
  ];
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturación total" val={eur(tot)} sub={`${periodLabel(data)} · ${countryLabel(data)}`} />
        <Kpi lab="Web (Shopify)" val={eur(m.webTotal)} sub={webSubHtml ? undefined : `${num(m.webOrders)} pedidos · ticket ${eur1(m.aov)}`} subHtml={webSubHtml} />
        <Kpi lab="Amazon" val={m.amazonTotal === undefined ? "—" : eur(m.amazonTotal)} sub={m.amazonTotal === undefined ? "carga manual pendiente" : `${num(m.amazonOrders || 0)} pedidos`} amz />
        <Kpi lab="Terceros" val={m.tercerosTotal === undefined ? "—" : eur(m.tercerosTotal)} sub={m.tercerosTotal === undefined ? "carga manual pendiente" : `${num(m.tercerosOrders || 0)} pedidos`} />
      </section>
      <section className="grid">
        <div className="card">
          <h3>Facturación web mensual</h3>
          <div className="cap">Ventas en Shopify · {countryLabel(data)} · rango seleccionado</div>
          <MonthlyWeb months={data.months} />
          {hasPrev && (
            <div className="legend" style={{ marginTop: 6 }}>
              <span className="lg"><span className="sw" style={{ background: "var(--accent)" }} />Este año</span>
              <span className="lg"><span className="sw" style={{ background: "var(--faint)" }} />Año pasado (histórico)</span>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Reparto por plataforma</h3>
          <div className="cap">Web vs Amazon vs Terceros · {periodLabel(data)}</div>
          <ChannelBars rows={sourceRows} />
          <div className="note" style={{ marginTop: 12 }}>
            <span>ℹ︎</span>
            <span>Amazon y Terceros se cargan de momento a mano. Al conectar sus APIs se actualizarán solos.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── WEB ──
export function WebView({ data }: { data: PanelData }) {
  const m = periodAgg(data);
  const roasG = m.googleSpend ? m.googleConvValue / m.googleSpend : 0;
  const split = m.webByChannel ?? emptySplit();
  const [channel, setChannel] = useState<Channel | null>(null);
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturado web" val={eur(m.webTotal)} sub={`${periodLabel(data)} · ${num(m.webOrders)} pedidos · ${countryLabel(data)}`} />
        <Kpi lab="Inversión Google Ads" val={eur(m.googleSpend)} sub={`${num(Math.round(m.googleClicks))} clics`} />
        <Kpi lab="ROAS Google" val={roas(roasG)} sub="según atribución de Google" />
        <Kpi lab="Google (1st-party)" val={eur(split.google)} sub={`${Math.round((split.google / (m.webTotal || 1)) * 100)}% del facturado · atribución propia`} />
      </section>

      <section className="grid">
        <div className="card">
          <h3>Ventas diarias por canal · {dailyLabel(data)}</h3>
          <div className="cap">Cada barra es un día, apilada por canal</div>
          <Legend items={channelLegend()} />
          <DailyStack days={data.currentMonthDaily} />
        </div>
        <div className="card">
          <h3>Mezcla de canales · {periodLabel(data)}</h3>
          <div className="cap">Pincha un canal para ver inversión vs ventas y crecimiento</div>
          <ChannelMix split={split} onPick={(c) => setChannel((p) => (p === c ? null : c))} active={channel} />
          <div className="note" style={{ marginTop: 12 }}>
            <span>✓</span>
            <span>Reparto real a partir de los parámetros de campaña (gclid/fbclid, utm_*) capturados en cada pedido.</span>
          </div>
        </div>
      </section>

      {channel && <ChannelDetail months={data.months} channel={channel} onClose={() => setChannel(null)} />}

      <section>
        <div className="card">
          <h3>Rendimiento por plataforma de pago</h3>
          <div className="cap">Inversión y retorno · {periodLabel(data)}</div>
          <table className="ptable">
            <tbody>
              <tr>
                <td style={{ color: "var(--muted)", fontWeight: 500 }}>Plataforma</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Inversión</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>ROAS (plataforma)</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Ventas atribuidas*</td>
              </tr>
              <tr>
                <td><span className="sw" style={{ background: "var(--c-google)", display: "inline-block", marginRight: 7 }} />Google Ads</td>
                <td className="num" style={{ textAlign: "right" }}>{eur(m.googleSpend)}</td>
                <td className="num" style={{ textAlign: "right" }}>{roas(m.googleSpend ? m.googleConvValue / m.googleSpend : 0)}</td>
                <td className="num" style={{ textAlign: "right" }}>{eur(split.google)}</td>
              </tr>
              <tr>
                <td><span className="sw" style={{ background: "var(--c-meta)", display: "inline-block", marginRight: 7 }} />Meta Ads</td>
                {m.metaSpend === undefined ? (
                  <>
                    <td colSpan={2} style={{ color: "var(--faint)" }}>pendiente de conectar</td>
                    <td className="num" style={{ textAlign: "right" }}>{eur(split.meta)}</td>
                  </>
                ) : (
                  <>
                    <td className="num" style={{ textAlign: "right" }}>{eur(m.metaSpend)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{roas(m.metaSpend ? (m.metaConvValue || 0) / m.metaSpend : 0)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{eur(split.meta)}</td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
          <div className="note" style={{ marginTop: 10 }}>
            <span>*</span>
            <span>Ventas atribuidas por nuestra atribución propia (UTMs del pedido). El «ROAS (plataforma)» usa el valor que cada plataforma se adjudica, que suele ser más optimista.</span>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Facturación web · histórico</h3>
          <div className="cap">Ventas totales · rango seleccionado</div>
          <MonthlyWeb months={data.months} />
        </div>
        <div className="card">
          <h3>ROAS Google Ads</h3>
          <div className="cap">Valor atribuido ÷ inversión · por mes</div>
          <RoasLine months={data.months} />
        </div>
      </section>
    </main>
  );
}

// ── INTRADÍA ──
export function IntradiaView({ data }: { data: PanelData }) {
  const upto = data.todayHourly.filter((h) => h.hour <= data.nowHour);
  const hoyTot = upto.reduce((a, h) => a + h.webTotal, 0);
  const hoyPed = upto.reduce((a, h) => a + h.webOrders, 0);
  const best = upto.reduce((b, h) => (h.webTotal > b.webTotal ? h : b), { hour: 0, webTotal: 0, webOrders: 0 });
  const ticket = hoyPed ? hoyTot / hoyPed : 0;
  const prevDay = data.todayPrevYearTotal; // mismo día del año pasado (día completo)
  const paceHtml = prevDay
    ? `corte ${String(data.nowHour).padStart(2, "0")}:00 · <span class="${hoyTot >= prevDay ? "up" : ""}">${Math.round((hoyTot / (prevDay || 1)) * 100)}% del año pasado</span>`
    : undefined;
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturado hoy" val={eur(hoyTot)} sub={paceHtml ? undefined : `corte ${String(data.nowHour).padStart(2, "0")}:00 · web · ${countryLabel(data)}`} subHtml={paceHtml} />
        <Kpi lab="Pedidos hoy" val={num(hoyPed)} sub={hoyPed ? `ticket medio ${eur1(ticket)}` : "sin pedidos aún"} />
        <Kpi lab="Hora pico" val={best.webTotal > 0 ? `${best.hour}:00` : "—"} sub={best.webTotal > 0 ? eur(best.webTotal) + " en esa franja" : "día aún por arrancar"} />
        {prevDay !== undefined ? (
          <Kpi lab="Mismo día año pasado" val={eur(prevDay)} sub={`${num(data.todayPrevYearOrders || 0)} pedidos · día completo`} />
        ) : (
          <Kpi lab="Franja fuerte" val="18–21 h" sub="histórico de la tienda" />
        )}
      </section>
      <section className="grid">
        <div className="card">
          <h3>Ventas web por hora · hoy</h3>
          <div className="cap">Cada barra es una hora, apilada por canal · línea = ahora ({String(data.nowHour).padStart(2, "0")}:00)</div>
          <Legend items={channelLegend()} />
          <HourlyStack hours={data.todayHourly} nowHour={data.nowHour} />
        </div>
        <div className="card">
          <h3>Resumen del día</h3>
          <div className="cap">Acumulado hasta ahora</div>
          <div className="mini" style={{ gap: 12 }}>
            <div><div className="lab">Facturado hoy</div><div className="v num">{eur(hoyTot)}</div></div>
            <div><div className="lab">Pedidos</div><div className="v num">{num(hoyPed)}</div></div>
            <div className="note">
              <span>ℹ︎</span>
              <span>
                Datos en tiempo real de Shopify. A primera hora la gráfica puede verse vacía: las franjas fuertes de tarde (18–21 h) aún no han entrado.
                {prevDay !== undefined
                  ? ` El mismo día del año pasado se facturaron ${eur(prevDay)} en total (día completo).`
                  : " La comparativa con el año pasado se activará al cargar el histórico diario."}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── AMAZON (carga manual de momento) ──
export function AmazonView({ data }: { data: PanelData }) {
  const withData = data.months.filter((m) => m.amazonTotal !== undefined && m.amazonTotal > 0);
  if (!withData.length) {
    return (
      <main>
        <section className="grid">
          <PendingCard title="Amazon · carga manual">
            <span>Aún no hay cifras de Amazon cargadas para esta selección. Puedes cargarlas a mano en <b>data/manual.json</b> (ventas, pedidos e inversión de Amazon Ads por país y mes) y aparecerán aquí.</span>
            <span>Cuando conectemos <b>Amazon SP-API + Amazon Ads API</b> se rellenará solo, con ventas, ACOS/TACOS/ROAS y top productos.</span>
          </PendingCard>
          <div className="card">
            <h3>Qué se verá</h3>
            <div className="cap">En cuanto haya datos</div>
            <div className="empty">
              <span>• Ventas, pedidos y ticket medio de Amazon.</span>
              <span>• Inversión Amazon Ads con ACOS / ROAS.</span>
              <span>• Peso de Amazon dentro del total (pestaña Global).</span>
            </div>
          </div>
        </section>
      </main>
    );
  }
  const m = withData[withData.length - 1];
  const spend = m.amazonSpend || 0;
  const roasA = spend ? (m.amazonConvValue || m.amazonTotal || 0) / spend : 0;
  const acos = (m.amazonTotal && spend) ? (spend / m.amazonTotal) * 100 : 0;
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Ventas Amazon" val={eur(m.amazonTotal || 0)} sub={`${mLong(m)} · ${countryLabel(data)}`} amz />
        <Kpi lab="Pedidos" val={num(m.amazonOrders || 0)} sub={m.amazonOrders ? `ticket ${eur1((m.amazonTotal || 0) / m.amazonOrders)}` : "—"} />
        <Kpi lab="Inversión Amazon Ads" val={spend ? eur(spend) : "—"} sub={spend ? mLong(m) : "sin dato"} />
        <Kpi lab="ROAS / ACOS" val={spend ? roas(roasA) : "—"} sub={spend ? `ACOS ${acos.toLocaleString("es-ES", { maximumFractionDigits: 1 })}%` : "sin inversión cargada"} />
      </section>
      <section>
        <div className="card">
          <h3>Amazon · histórico mensual</h3>
          <div className="cap">Carga manual · {countryLabel(data)}</div>
          <table className="ptable">
            <tbody>
              <tr>
                <td style={{ color: "var(--muted)", fontWeight: 500 }}>Mes</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Ventas</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Pedidos</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Inversión</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>ROAS</td>
              </tr>
              {withData.map((x) => {
                const sp = x.amazonSpend || 0;
                return (
                  <tr key={x.key}>
                    <td>{mLong(x)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{eur(x.amazonTotal || 0)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{num(x.amazonOrders || 0)}</td>
                    <td className="num" style={{ textAlign: "right" }}>{sp ? eur(sp) : "—"}</td>
                    <td className="num" style={{ textAlign: "right" }}>{sp ? roas((x.amazonConvValue || x.amazonTotal || 0) / sp) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// ── TERCEROS (carga manual de momento) ──
export function TercerosView({ data }: { data: PanelData }) {
  const withData = data.months.filter((m) => m.tercerosTotal !== undefined && m.tercerosTotal > 0);
  if (!withData.length) {
    return (
      <main>
        <section className="grid">
          <PendingCard title="Terceros · carga manual">
            <span>Ventas de distribuidores, mayorista, tiendas físicas u otros marketplaces. Aún no hay cifras cargadas para esta selección.</span>
            <span>Cárgalas a mano en <b>data/manual.json</b> (por país y mes) y aparecerán aquí. Más adelante se automatizará por API/exportación.</span>
          </PendingCard>
          <div className="card">
            <h3>Qué se verá</h3>
            <div className="cap">En cuanto haya datos</div>
            <div className="empty">
              <span>• Ventas y pedidos de Terceros por mes.</span>
              <span>• Peso de Terceros dentro del total (pestaña Global).</span>
            </div>
          </div>
        </section>
      </main>
    );
  }
  const m = withData[withData.length - 1];
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Ventas Terceros" val={eur(m.tercerosTotal || 0)} sub={`${mLong(m)} · ${countryLabel(data)}`} />
        <Kpi lab="Pedidos" val={num(m.tercerosOrders || 0)} sub={m.tercerosOrders ? `ticket ${eur1((m.tercerosTotal || 0) / m.tercerosOrders)}` : "—"} />
        <Kpi lab="Meses con datos" val={num(withData.length)} sub="en el rango seleccionado" />
        <Kpi lab="Total rango" val={eur(withData.reduce((a, x) => a + (x.tercerosTotal || 0), 0))} sub="suma de Terceros" />
      </section>
      <section>
        <div className="card">
          <h3>Terceros · histórico mensual</h3>
          <div className="cap">Carga manual · {countryLabel(data)}</div>
          <table className="ptable">
            <tbody>
              <tr>
                <td style={{ color: "var(--muted)", fontWeight: 500 }}>Mes</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Ventas</td>
                <td style={{ color: "var(--muted)", fontWeight: 500, textAlign: "right" }}>Pedidos</td>
              </tr>
              {withData.map((x) => (
                <tr key={x.key}>
                  <td>{mLong(x)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{eur(x.tercerosTotal || 0)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{num(x.tercerosOrders || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

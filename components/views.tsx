import React from "react";
import type { PanelData, MonthPoint } from "@/lib/types";
import { eur, eur1, num, roas } from "@/lib/format";
import { Kpi, Legend, PendingCard } from "./ui";
import { MonthlyWeb, WebVsGoogle, DailyWeb, RoasLine, HourlyWeb, Donut, ChannelBars } from "./charts";

const curr = (d: PanelData): MonthPoint => d.months[d.months.length - 1];
const monthName: Record<string, string> = {
  ene: "enero", feb: "febrero", mar: "marzo", abr: "abril", may: "mayo", jun: "junio",
  jul: "julio", ago: "agosto", sep: "septiembre", oct: "octubre", nov: "noviembre", dic: "diciembre",
};
const mLong = (m: MonthPoint) => (monthName[m.label] ?? m.label) + (m.partial ? " (en curso)" : "");

// ── GLOBAL ──
export function GlobalView({ data }: { data: PanelData }) {
  const m = curr(data);
  const roasG = m.googleSpend ? m.googleConvValue / m.googleSpend : 0;
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturación web" val={eur(m.webTotal)} sub={`${mLong(m)} · Shopify`} />
        <Kpi lab="Pedidos" val={num(m.webOrders)} sub={`ticket medio ${eur1(m.aov)}`} />
        <Kpi lab="Inversión Google Ads" val={eur(m.googleSpend)} sub={mLong(m)} />
        <Kpi lab="ROAS Google" val={roas(roasG)} sub="valor atribuido ÷ inversión" />
      </section>
      <section className="grid">
        <div className="card">
          <h3>Facturación web mensual</h3>
          <div className="cap">Ventas totales en Shopify · últimos 6 meses</div>
          <MonthlyWeb months={data.months} />
        </div>
        <div className="card">
          <h3>Reparto Web vs Amazon</h3>
          <div className="cap">Peso de cada plataforma · {mLong(m)}</div>
          <Donut web={m.webTotal} amazon={null} label={m.label} />
          <div className="note" style={{ marginTop: 14 }}>
            <span>ℹ︎</span>
            <span>Amazon aún no está conectado (fase 2). Al añadir SP-API aparecerá aquí su peso real.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── WEB ──
export function WebView({ data }: { data: PanelData }) {
  const m = curr(data);
  const roasG = m.googleSpend ? m.googleConvValue / m.googleSpend : 0;
  const noAtribuido = Math.max(m.webTotal - m.googleConvValue, 0);
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturado web" val={eur(m.webTotal)} sub={`${mLong(m)} · ${num(m.webOrders)} pedidos`} />
        <Kpi lab="Inversión Google Ads" val={eur(m.googleSpend)} sub={`${num(Math.round(m.googleClicks))} clics`} />
        <Kpi lab="ROAS Google" val={roas(roasG)} sub="según atribución de Google" />
        <Kpi lab="Valor atribuido Google" val={eur(m.googleConvValue)} sub={`${Math.round((m.googleConvValue / (m.webTotal || 1)) * 100)}% del facturado web`} />
      </section>

      <section className="grid">
        <div className="card">
          <h3>Ventas web vs atribuido a Google</h3>
          <div className="cap">Barras = total web · línea = valor que Google se atribuye · 6 meses</div>
          <Legend items={[["web", "--accent", "Ventas web (Shopify)"], ["goo", "--c-google", "Atribuido Google Ads"]]} />
          <WebVsGoogle months={data.months} />
        </div>
        <div className="card">
          <h3>Atribución del mes</h3>
          <div className="cap">Qué parte del facturado web es medible hoy</div>
          <ChannelBars rows={[
            { label: "Google Ads", value: m.googleConvValue, color: "var(--c-google)" },
            { label: "Resto / no atribuido", value: noAtribuido, color: "var(--c-directo)" },
          ]} />
          <div className="note" style={{ marginTop: 12 }}>
            <span>⚠︎</span>
            <span>
              Shopify no trae origen en el ~94% de los pedidos. El desglose fino por canal (SEO, Orgánico, Meta,
              Email, Directo) requiere captura de UTMs + atribución propia — la capa «ledger» de la fase siguiente.
            </span>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Ventas web diarias · {mLong(m)}</h3>
          <div className="cap">Cada barra es un día</div>
          <DailyWeb days={data.currentMonthDaily} />
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
  return (
    <main>
      <section className="kpis">
        <Kpi lab="Facturado hoy" val={eur(hoyTot)} sub={`corte ${String(data.nowHour).padStart(2, "0")}:00 · web`} />
        <Kpi lab="Pedidos hoy" val={num(hoyPed)} sub={hoyPed ? `ticket medio ${eur1(ticket)}` : "sin pedidos aún"} />
        <Kpi lab="Hora pico" val={best.webTotal > 0 ? `${best.hour}:00` : "—"} sub={best.webTotal > 0 ? eur(best.webTotal) + " en esa franja" : "día aún por arrancar"} />
        <Kpi lab="Franja fuerte" val="18–21 h" sub="histórico de la tienda" />
      </section>
      <section className="grid">
        <div className="card">
          <h3>Ventas web por hora · hoy</h3>
          <div className="cap">Cada barra es una hora · línea = ahora ({String(data.nowHour).padStart(2, "0")}:00)</div>
          <HourlyWeb hours={data.todayHourly} nowHour={data.nowHour} />
        </div>
        <div className="card">
          <h3>Resumen del día</h3>
          <div className="cap">Acumulado hasta ahora</div>
          <div className="mini" style={{ gap: 12 }}>
            <div><div className="lab">Facturado hoy</div><div className="v num">{eur(hoyTot)}</div></div>
            <div><div className="lab">Pedidos</div><div className="v num">{num(hoyPed)}</div></div>
            <div className="note">
              <span>ℹ︎</span>
              <span>Datos en tiempo real de Shopify. A primera hora la gráfica puede verse vacía: las franjas fuertes de tarde (18–21 h) aún no han entrado.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── AMAZON (fase 2) ──
export function AmazonView() {
  return (
    <main>
      <section className="grid">
        <PendingCard title="Amazon · marketplace ES">
          <span>Fase 2. Al conectar Amazon SP-API + Amazon Ads API aquí aparecerán, con datos reales:</span>
          <span>• Ventas, pedidos, unidades y ticket medio.</span>
          <span>• Inversión Amazon Ads con ACOS / TACOS / ROAS.</span>
          <span>• Reparto FBA / FBM, Buy Box y tasa de devoluciones.</span>
          <span>• Histórico mensual y top productos del marketplace.</span>
        </PendingCard>
        <div className="card">
          <h3>Cómo se conecta</h3>
          <div className="cap">Requisitos de la fase 2</div>
          <div className="empty">
            <span>Credenciales de <b>Amazon SP-API</b> (ventas/pedidos) y <b>Amazon Ads API</b> (inversión/ACOS), como variables de entorno en Vercel.</span>
            <span className="note"><span>ℹ︎</span><span>El fulfillment MCF (Amazon logística de pedidos web) contará en Web, no en Amazon, para no duplicar.</span></span>
          </div>
        </div>
      </section>
    </main>
  );
}

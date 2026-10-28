// Definición compartida de las herramientas MCP (puras: dan forma a PanelData).
// La usan tanto el servidor stdio empaquetado (.mcpb) como la ruta HTTP de Vercel.

import type { PanelData, MonthPoint } from "./types";
import { CHANNELS, CHANNEL_META, type ChannelSplit } from "./attribution";

const round = (n: number) => Math.round(n * 100) / 100;
const roasOf = (m: { googleSpend: number; googleConvValue: number }) =>
  m.googleSpend ? round(m.googleConvValue / m.googleSpend) : 0;

function splitRows(split: ChannelSplit | undefined) {
  if (!split) return null;
  const total = CHANNELS.reduce((a, c) => a + (split[c] || 0), 0) || 1;
  return CHANNELS.map((c) => ({
    canal: c,
    etiqueta: CHANNEL_META[c].label,
    ventas_eur: round(split[c] || 0),
    porcentaje: round(((split[c] || 0) / total) * 100),
  })).sort((a, b) => b.ventas_eur - a.ventas_eur);
}

function monthSummary(m: MonthPoint) {
  return {
    mes: m.label,
    en_curso: Boolean(m.partial),
    ventas_web_eur: round(m.webTotal),
    pedidos: m.webOrders,
    ticket_medio_eur: round(m.aov),
    google_ads: {
      inversion_eur: round(m.googleSpend),
      valor_atribuido_google_eur: round(m.googleConvValue),
      roas: roasOf(m),
      clics: m.googleClicks,
    },
    ventas_por_canal: splitRows(m.webByChannel),
  };
}

function resumen(d: PanelData) {
  const m = d.months[d.months.length - 1];
  const upto = d.todayHourly.filter((h) => h.hour <= d.nowHour);
  const hoyTot = upto.reduce((a, h) => a + h.webTotal, 0);
  const hoyPed = upto.reduce((a, h) => a + h.webOrders, 0);
  const best = upto.reduce((b, h) => (h.webTotal > b.webTotal ? h : b), { hour: 0, webTotal: 0 });
  return {
    tienda: d.shopName,
    moneda: d.currency,
    actualizado: d.generatedAt,
    en_vivo: d.live,
    fuentes: d.sources,
    nota: d.live ? "Datos en vivo." : "Instantánea de datos reales (sin credenciales en vivo).",
    mes_actual: monthSummary(m),
    hoy: {
      corte_hora: d.nowHour,
      facturado_eur: round(hoyTot),
      pedidos: hoyPed,
      hora_pico: best.webTotal > 0 ? `${best.hour}:00` : null,
    },
    top_productos: d.topProductsCurrentMonth.map((p, i) => ({ puesto: i + 1, producto: p.title, ventas_eur: round(p.sales), pedidos: p.orders })),
  };
}

function mensuales(d: PanelData) {
  return { tienda: d.shopName, moneda: d.currency, meses: d.months.map(monthSummary) };
}

function diarias(d: PanelData) {
  return {
    tienda: d.shopName,
    mes: d.months[d.months.length - 1].label,
    dias: d.currentMonthDaily.map((x) => ({
      dia: x.day,
      ventas_web_eur: round(x.webTotal),
      pedidos: x.webOrders,
      google_inversion_eur: round(x.googleSpend),
      ventas_por_canal: splitRows(x.webByChannel),
    })),
  };
}

function intradia(d: PanelData) {
  const upto = d.todayHourly.filter((h) => h.hour <= d.nowHour);
  return {
    tienda: d.shopName,
    fecha: d.today,
    corte_hora: d.nowHour,
    facturado_hoy_eur: round(upto.reduce((a, h) => a + h.webTotal, 0)),
    pedidos_hoy: upto.reduce((a, h) => a + h.webOrders, 0),
    por_hora: d.todayHourly.map((h) => ({ hora: h.hour, ventas_web_eur: round(h.webTotal), pedidos: h.webOrders, ventas_por_canal: splitRows(h.webByChannel) })),
  };
}

function top(d: PanelData) {
  return { tienda: d.shopName, mes: d.months[d.months.length - 1].label, top_productos: d.topProductsCurrentMonth.map((p, i) => ({ puesto: i + 1, producto: p.title, ventas_eur: round(p.sales), pedidos: p.orders })) };
}

export interface PanelTool {
  name: string;
  description: string;
  run: (d: PanelData) => unknown;
}

export const PANEL_TOOLS: PanelTool[] = [
  { name: "resumen_ventas", description: "Resumen de decisión: ventas web del mes, mezcla por canal (atribución propia), KPIs de Google Ads (inversión/ROAS), el día de hoy y top productos. Empieza por aquí.", run: resumen },
  { name: "ventas_mensuales", description: "Histórico de los últimos 6 meses: ventas web, pedidos, ticket medio, reparto por canal e inversión/ROAS de Google Ads por mes. Útil para tendencias.", run: mensuales },
  { name: "ventas_diarias", description: "Ventas del mes en curso, día a día, con reparto por canal e inversión de Google por día.", run: diarias },
  { name: "intradia_hoy", description: "Ventas de hoy hora a hora, con reparto por canal y acumulado hasta ahora.", run: intradia },
  { name: "top_productos", description: "Productos más vendidos del mes en curso por facturación.", run: top },
];

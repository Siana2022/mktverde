// Calcula la VISTA (PanelData) que consumen las pantallas, a partir del RawDataset
// y de la SELECCIÓN activa (país + rango de fechas). Es una función PURA: se ejecuta
// en el cliente para que cambiar de país o de fechas sea instantáneo, sin recargar.

import type {
  RawDataset, PanelData, CountryBlock, MonthPoint, DayPoint, HourPoint, Product, CountrySel,
} from "./types";
import { COUNTRY_META } from "./types";
import { emptySplit, addSplit, type ChannelSplit } from "./attribution";

export interface Selection {
  country: CountrySel;
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
}

const monthOf = (d: string) => d.slice(0, 7);

function selectedBlocks(raw: RawDataset, country: CountrySel): CountryBlock[] {
  if (country === "all") return raw.countries;
  return raw.countries.filter((b) => b.country === country);
}

// Suma un MonthPoint a un acumulador (importes ya en EUR).
function addMonth(acc: MonthPoint, m: MonthPoint) {
  acc.webTotal += m.webTotal; acc.webGross += m.webGross; acc.webNet += m.webNet; acc.webOrders += m.webOrders;
  acc.googleSpend += m.googleSpend; acc.googleConvValue += m.googleConvValue; acc.googleConversions += m.googleConversions;
  acc.googleClicks += m.googleClicks; acc.googleImpressions += m.googleImpressions;
  if (m.metaSpend !== undefined) acc.metaSpend = (acc.metaSpend || 0) + m.metaSpend;
  if (m.metaConvValue !== undefined) acc.metaConvValue = (acc.metaConvValue || 0) + m.metaConvValue;
  if (m.amazonTotal !== undefined) acc.amazonTotal = (acc.amazonTotal || 0) + m.amazonTotal;
  if (m.amazonOrders !== undefined) acc.amazonOrders = (acc.amazonOrders || 0) + m.amazonOrders;
  if (m.amazonSpend !== undefined) acc.amazonSpend = (acc.amazonSpend || 0) + m.amazonSpend;
  if (m.amazonConvValue !== undefined) acc.amazonConvValue = (acc.amazonConvValue || 0) + m.amazonConvValue;
  if (m.tercerosTotal !== undefined) acc.tercerosTotal = (acc.tercerosTotal || 0) + m.tercerosTotal;
  if (m.tercerosOrders !== undefined) acc.tercerosOrders = (acc.tercerosOrders || 0) + m.tercerosOrders;
  if (m.webByChannel) acc.webByChannel = addSplit(acc.webByChannel || emptySplit(), m.webByChannel);
}

function blankMonth(key: string, label: string, partial: boolean): MonthPoint {
  return {
    key, label, webTotal: 0, webGross: 0, webNet: 0, webOrders: 0, aov: 0,
    googleSpend: 0, googleConvValue: 0, googleConversions: 0, googleClicks: 0, googleImpressions: 0,
    webByChannel: emptySplit(), partial,
  };
}

export function buildView(raw: RawDataset, sel: Selection): PanelData {
  const blocks = selectedBlocks(raw, sel.country);
  const fromM = monthOf(sel.from);
  const toM = monthOf(sel.to);
  const inMonthRange = (key: string) => key >= fromM && key <= toM;
  const inDayRange = (day: string) => day >= sel.from && day <= sel.to;

  // ── Meses consolidados ──
  const mMap = new Map<string, MonthPoint>();
  for (const b of blocks) {
    for (const m of b.months) {
      if (!inMonthRange(m.key)) continue;
      const acc = mMap.get(m.key) || blankMonth(m.key, m.label, m.key === raw.currentMonthKey);
      addMonth(acc, m);
      mMap.set(m.key, acc);
    }
  }
  const months = [...mMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const m of months) m.aov = m.webOrders ? m.webTotal / m.webOrders : 0;

  // ── Diario (mes actual) ──
  const dMap = new Map<string, DayPoint>();
  for (const b of blocks) {
    for (const d of b.currentMonthDaily) {
      if (!inDayRange(d.day)) continue;
      const acc = dMap.get(d.day) || { day: d.day, webTotal: 0, webOrders: 0, googleSpend: 0, googleConvValue: 0, webByChannel: emptySplit() };
      acc.webTotal += d.webTotal; acc.webOrders += d.webOrders; acc.googleSpend += d.googleSpend; acc.googleConvValue += d.googleConvValue;
      if (d.webByChannel) acc.webByChannel = addSplit(acc.webByChannel as ChannelSplit, d.webByChannel);
      dMap.set(d.day, acc);
    }
  }
  const currentMonthDaily = [...dMap.values()].sort((a, b) => a.day.localeCompare(b.day));

  // ── Horario (hoy) ──
  const todayHourly: HourPoint[] = Array.from({ length: 24 }, (_, hour) => ({ hour, webTotal: 0, webOrders: 0, webByChannel: emptySplit() }));
  for (const b of blocks) {
    for (const h of b.todayHourly) {
      const acc = todayHourly[h.hour];
      acc.webTotal += h.webTotal; acc.webOrders += h.webOrders;
      if (h.webByChannel) acc.webByChannel = addSplit(acc.webByChannel as ChannelSplit, h.webByChannel);
    }
  }

  // ── Top productos (mes actual) ──
  const pMap = new Map<string, Product>();
  for (const b of blocks) {
    for (const p of b.topProductsCurrentMonth) {
      const acc = pMap.get(p.title) || { title: p.title, sales: 0, orders: 0 };
      acc.sales += p.sales; acc.orders += p.orders; pMap.set(p.title, acc);
    }
  }
  const topProductsCurrentMonth = [...pMap.values()].sort((a, b) => b.sales - a.sales).slice(0, 6);

  return {
    generatedAt: raw.generatedAt,
    live: raw.live,
    attribution: raw.attribution,
    sources: raw.sources,
    shopName: raw.shopName,
    currency: raw.currency,
    timezone: raw.timezone,
    today: raw.today,
    nowHour: raw.nowHour,
    currentMonthKey: raw.currentMonthKey,
    months: months.length ? months : [blankMonth(raw.currentMonthKey, "", true)],
    currentMonthDaily,
    todayHourly,
    topProductsCurrentMonth,
    country: sel.country,
    countriesAvailable: raw.countries.map((b) => ({ code: b.country, label: b.label, flag: COUNTRY_META[b.country].flag, live: b.webLive })),
    fx: raw.fx,
  };
}

// Selección por defecto: todos los países, últimos 6 meses.
export function defaultSelection(raw: RawDataset): Selection {
  const keys = raw.monthKeys;
  const firstKey = keys.length > 6 ? keys[keys.length - 6] : keys[0];
  return { country: "all", from: `${firstKey}-01`, to: raw.today };
}

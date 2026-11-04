// Agregador central: construye el RawDataset (datos por país, consolidables en EUR)
// a partir de las fuentes en vivo (Shopify multi-tienda + Google Ads + Meta + manual)
// o, si no hay credenciales, del snapshot de datos reales.

import snapshot from "@/data/snapshot.json";
import type { RawDataset, CountryBlock, MonthPoint, DayPoint, HourPoint, Product, Country, SourceStatus, PanelData } from "./types";
import { buildView, defaultSelection } from "./view";
import { getShopifyAggregates } from "./shopify";
import { STORES, storeConfigured, anyStoreConfigured, type StoreConfig } from "./stores";
import { getGoogleAds, type GoogleMetrics } from "./googleAds";
import { getMeta } from "./meta";
import { getManual, getHistorico, type AmazonAgg, type TercerosAgg } from "./manual";
import { getBaseline, type Baseline } from "./baseline";
import { fxRatesUsed } from "./fx";
import { nowInTz, lastNMonthKeys, monthKeyToLabel } from "./time";

const WINDOW_MONTHS = 12;
const EMPTY_G: GoogleMetrics = { spend: 0, convValue: 0, conversions: 0, clicks: 0, impressions: 0 };

function hourInTz(iso: string, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "2-digit", hour12: false })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return parseInt(p.hour as string, 10) % 24;
}

// Snapshot → RawDataset (un solo bloque España). Se usa cuando no hay credenciales.
function fromSnapshot(): RawDataset {
  const s = snapshot;
  const block: CountryBlock = {
    country: "es",
    label: "España",
    currency: "EUR",
    fxToEur: 1,
    webLive: false,
    months: s.months as MonthPoint[],
    days: s.currentMonthDaily as DayPoint[],
    todayHourly: s.todayHourly as HourPoint[],
    topProductsCurrentMonth: s.topProductsCurrentMonth as Product[],
  };
  // Bloques vacíos para Italia y EEUU, para que el selector de país muestre las 3
  // tiendas (como pendientes) también cuando se cae al snapshot.
  const monthKeys = (s.months as MonthPoint[]).map((m) => m.key);
  const otherBlocks = STORES.filter((st) => st.country !== "es").map((st) => emptyBlock(st, monthKeys));
  const allBlocks = [block, ...otherBlocks];
  const baseline = getBaseline();
  for (const b of allBlocks) applyBaseline(b, baseline, monthKeys, s.today);
  applyManual(allBlocks);
  return {
    generatedAt: s.generatedAt,
    live: false,
    attribution: true,
    sources: { shopify: false, shopifyCountries: [], googleAds: false, amazon: false, meta: false, terceros: false },
    shopName: s.shopName,
    currency: "EUR",
    timezone: s.timezone,
    today: s.today,
    nowHour: hourInTz(s.generatedAt, s.timezone),
    currentMonthKey: s.currentMonthKey,
    monthKeys,
    fx: fxRatesUsed(),
    countries: allBlocks,
    historico: getHistorico().months,
    historicoDays: getHistorico().days,
  };
}

// Aplica Amazon/Terceros manuales a los meses de cada bloque de país.
function applyManual(blocks: CountryBlock[]): { hasAmazon: boolean; hasTerceros: boolean } {
  const man = getManual();
  for (const b of blocks) {
    for (const m of b.months) {
      const a: AmazonAgg | undefined = man.amazon.get(`${b.country}:${m.key}`);
      const t: TercerosAgg | undefined = man.terceros.get(`${b.country}:${m.key}`);
      if (a) { m.amazonTotal = a.total; m.amazonOrders = a.orders; m.amazonSpend = a.spend; m.amazonConvValue = a.convValue; }
      if (t) { m.tercerosTotal = t.total; m.tercerosOrders = t.orders; }
    }
  }
  return { hasAmazon: man.hasAmazon, hasTerceros: man.hasTerceros };
}

// Bloque vacío (tienda sin credenciales): meses a cero, para mostrarla como pendiente.
function emptyBlock(s: StoreConfig, monthKeys: string[]): CountryBlock {
  const months: MonthPoint[] = monthKeys.map((key) => ({
    key, label: monthKeyToLabel(key), webTotal: 0, webGross: 0, webNet: 0, webOrders: 0, aov: 0,
    googleSpend: 0, googleConvValue: 0, googleConversions: 0, googleClicks: 0, googleImpressions: 0,
  }));
  return {
    country: s.country, label: s.label, currency: s.currency, fxToEur: s.fxToEur, webLive: false,
    months, days: [], todayHourly: Array.from({ length: 24 }, (_, hour) => ({ hour, webTotal: 0, webOrders: 0 })),
    topProductsCurrentMonth: [],
  };
}

// Rellena un bloque con el histórico del año en curso (baseline): meses vacíos y
// días que la API de pedidos no alcanza. Los datos en vivo tienen prioridad.
function applyBaseline(block: CountryBlock, baseline: Baseline, monthKeys: string[], today: string): void {
  for (const m of block.months) {
    if ((m.webTotal || 0) === 0) {
      const b = baseline.months.get(`${block.country}:${m.key}`);
      if (b) {
        m.webTotal = b.webTotal; m.webGross = b.webTotal; m.webNet = b.webTotal;
        m.webOrders = b.webOrders; m.aov = b.webOrders ? b.webTotal / b.webOrders : 0;
      }
    }
  }
  const from = `${monthKeys[0]}-01`;
  const liveByDay = new Map(block.days.map((d) => [d.day, d]));
  const keys = new Set<string>(block.days.map((d) => d.day));
  for (const k of baseline.days.keys()) {
    const [c, day] = k.split(":");
    if (c === block.country && day >= from && day <= today) keys.add(day);
  }
  block.days = [...keys].sort().map((day) => {
    const live = liveByDay.get(day);
    if (live) return live;
    const b = baseline.days.get(`${block.country}:${day}`) as { webTotal: number; webOrders: number };
    return { day, webTotal: b.webTotal, webOrders: b.webOrders, googleSpend: 0, googleConvValue: 0 };
  });
}

export async function getRawDataset(): Promise<RawDataset> {
  if (!anyStoreConfigured) return fromSnapshot();

  const tz = process.env.PANEL_TIMEZONE || snapshot.timezone || "Europe/Madrid";
  const { today, hour, monthKey } = nowInTz(tz);
  const monthKeys = lastNMonthKeys(monthKey, WINDOW_MONTHS);
  const sinceDay = `${monthKeys[0]}-01`;

  // Shopify por tienda (en paralelo) + Google Ads + Meta (de momento, cuenta de España).
  const shopResults = await Promise.all(
    STORES.map((s) => (storeConfigured(s) ? getShopifyAggregates(s, monthKeys, monthKey, today, tz) : Promise.resolve(null))),
  );
  const [google, meta] = await Promise.all([getGoogleAds(sinceDay, today), getMeta(sinceDay, today)]);

  const g = (key: string): GoogleMetrics => google?.byMonth.get(key) ?? EMPTY_G;
  const gd = (day: string): GoogleMetrics => google?.byDay.get(day) ?? EMPTY_G;

  const liveCountries: Country[] = [];
  const blocks: CountryBlock[] = STORES.map((s, i) => {
    const agg = shopResults[i];
    if (!agg) return emptyBlock(s, monthKeys);
    liveCountries.push(s.country);
    const isEs = s.country === "es"; // Google/Meta solo están conectados para España de momento

    const months: MonthPoint[] = agg.months.map((m) => {
      const gm = isEs ? g(m.key) : EMPTY_G;
      const mm = isEs ? meta?.byMonth.get(m.key) : undefined;
      return {
        key: m.key, label: monthKeyToLabel(m.key),
        webTotal: m.webTotal, webGross: m.webTotal, webNet: m.webTotal, webOrders: m.webOrders, aov: m.aov,
        googleSpend: gm.spend, googleConvValue: gm.convValue, googleConversions: gm.conversions,
        googleClicks: gm.clicks, googleImpressions: gm.impressions,
        metaSpend: mm ? mm.spend : undefined, metaConvValue: mm ? mm.convValue : undefined,
        webByChannel: m.webByChannel, partial: m.key === monthKey,
      };
    });
    const days: DayPoint[] = agg.currentMonthDaily.map((d) => {
      const gm = isEs ? gd(d.day) : EMPTY_G;
      return { day: d.day, webTotal: d.webTotal, webOrders: d.webOrders, googleSpend: gm.spend, googleConvValue: gm.convValue, webByChannel: d.webByChannel };
    });
    return {
      country: s.country, label: s.label, currency: s.currency, fxToEur: s.fxToEur, webLive: true,
      months, days, todayHourly: agg.todayHourly, topProductsCurrentMonth: agg.topProducts,
    };
  });

  const baseline = getBaseline();
  for (const b of blocks) applyBaseline(b, baseline, monthKeys, today);
  const { hasAmazon, hasTerceros } = applyManual(blocks);

  const sources: SourceStatus = {
    shopify: liveCountries.length > 0,
    shopifyCountries: liveCountries,
    googleAds: Boolean(google),
    meta: Boolean(meta),
    amazon: hasAmazon,
    terceros: hasTerceros,
  };

  return {
    generatedAt: new Date().toISOString(),
    live: liveCountries.length > 0,
    attribution: true,
    sources,
    shopName: snapshot.shopName,
    currency: "EUR",
    timezone: tz,
    today,
    nowHour: hour,
    currentMonthKey: monthKey,
    monthKeys,
    fx: fxRatesUsed(),
    countries: blocks,
    historico: getHistorico().months,
    historicoDays: getHistorico().days,
  };
}

// Compatibilidad: vista consolidada (todos los países, últimos 6 meses). La usan
// el MCP remoto y el bundle .mcpb, que trabajan con un PanelData ya montado.
export async function getPanelData(): Promise<PanelData> {
  const raw = await getRawDataset();
  return buildView(raw, defaultSelection(raw));
}

// Agregador central: construye PanelData a partir de las fuentes en vivo
// (Shopify + Google Ads) o, si no hay credenciales, del snapshot de datos reales.

import snapshot from "@/data/snapshot.json";
import type { PanelData, MonthPoint, DayPoint, HourPoint, Product } from "./types";
import { getShopifyAggregates, shopifyConfigured } from "./shopify";
import { getGoogleAds, googleAdsConfigured, type GoogleMetrics } from "./googleAds";
import { nowInTz, lastNMonthKeys, monthKeyToLabel } from "./time";

const EMPTY_G: GoogleMetrics = { spend: 0, convValue: 0, conversions: 0, clicks: 0, impressions: 0 };

function fromSnapshot(): PanelData {
  const s = snapshot;
  return {
    generatedAt: s.generatedAt,
    live: false,
    sources: { shopify: false, googleAds: false, amazon: false, meta: false },
    shopName: s.shopName,
    currency: s.currency,
    timezone: s.timezone,
    today: s.today,
    nowHour: hourInTz(s.generatedAt, s.timezone),
    currentMonthKey: s.currentMonthKey,
    months: s.months as MonthPoint[],
    currentMonthDaily: s.currentMonthDaily as DayPoint[],
    todayHourly: s.todayHourly as HourPoint[],
    topProductsCurrentMonth: s.topProductsCurrentMonth as Product[],
  };
}

function hourInTz(iso: string, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "2-digit", hour12: false })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return parseInt(p.hour as string, 10) % 24;
}

export async function getPanelData(): Promise<PanelData> {
  // Sin ninguna credencial → snapshot íntegro (datos reales fechados).
  if (!shopifyConfigured && !googleAdsConfigured) return fromSnapshot();

  const tz = process.env.PANEL_TIMEZONE || snapshot.timezone || "Europe/Madrid";
  const { today, hour, monthKey } = nowInTz(tz);
  const monthKeys = lastNMonthKeys(monthKey, 6);
  const sinceDay = `${monthKeys[0]}-01`;

  const [shop, google] = await Promise.all([
    getShopifyAggregates(monthKeys, monthKey, today, tz),
    getGoogleAds(sinceDay, today),
  ]);

  // Shopify es la columna vertebral. Si no hay datos en vivo de Shopify,
  // devolvemos el snapshot para no mezclar rangos de fechas incoherentes.
  if (!shop) return fromSnapshot();

  const g = (key: string): GoogleMetrics => google?.byMonth.get(key) ?? EMPTY_G;
  const gd = (day: string): GoogleMetrics => google?.byDay.get(day) ?? EMPTY_G;

  const months: MonthPoint[] = shop.months.map((m) => {
    const gm = g(m.key);
    return {
      key: m.key,
      label: monthKeyToLabel(m.key),
      webTotal: m.webTotal,
      webGross: m.webTotal,
      webNet: m.webTotal,
      webOrders: m.webOrders,
      aov: m.aov,
      googleSpend: gm.spend,
      googleConvValue: gm.convValue,
      googleConversions: gm.conversions,
      googleClicks: gm.clicks,
      googleImpressions: gm.impressions,
      partial: m.key === monthKey,
    };
  });

  const currentMonthDaily: DayPoint[] = shop.currentMonthDaily.map((d) => {
    const gm = gd(d.day);
    return { day: d.day, webTotal: d.webTotal, webOrders: d.webOrders, googleSpend: gm.spend, googleConvValue: gm.convValue };
  });

  return {
    generatedAt: new Date().toISOString(),
    live: true,
    sources: { shopify: true, googleAds: Boolean(google), amazon: false, meta: false },
    shopName: snapshot.shopName,
    currency: snapshot.currency,
    timezone: tz,
    today,
    nowHour: hour,
    currentMonthKey: monthKey,
    months,
    currentMonthDaily,
    todayHourly: shop.todayHourly,
    topProductsCurrentMonth: shop.topProducts,
  };
}

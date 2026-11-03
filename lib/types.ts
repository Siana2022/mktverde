// Modelo de datos del panel. Todos los importes CONSOLIDADOS en EUR.

import type { ChannelSplit } from "./attribution";
export type { Channel, ChannelSplit } from "./attribution";

// ── Países (cada uno es una tienda Shopify independiente) ──
export type Country = "es" | "it" | "us";
export const COUNTRIES: Country[] = ["es", "it", "us"];
export const COUNTRY_META: Record<Country, { label: string; flag: string }> = {
  es: { label: "España", flag: "🇪🇸" },
  it: { label: "Italia", flag: "🇮🇹" },
  us: { label: "EEUU", flag: "🇺🇸" },
};

// Selección activa en la UI: un país concreto o "all" (consolidado).
export type CountrySel = Country | "all";

export interface MonthPoint {
  key: string; // '2026-10'
  label: string; // 'oct'
  webTotal: number; // ventas web (Shopify) en EUR
  webGross: number;
  webNet: number;
  webOrders: number;
  aov: number; // ticket medio
  googleSpend: number; // inversión Google Ads
  googleConvValue: number; // valor de conversión atribuido por Google
  googleConversions: number;
  googleClicks: number;
  googleImpressions: number;
  // Meta Ads. undefined = no conectado; número = dato real (puede ser 0).
  metaSpend?: number;
  metaConvValue?: number;
  // Amazon y Terceros (carga manual de momento). undefined = sin dato.
  amazonTotal?: number;
  amazonOrders?: number;
  amazonSpend?: number;
  amazonConvValue?: number;
  tercerosTotal?: number;
  tercerosOrders?: number;
  webByChannel?: ChannelSplit; // ventas web repartidas por canal (atribución propia)
  partial?: boolean; // mes en curso, incompleto
  // Comparativa interanual (mismo mes del año pasado). undefined = sin histórico.
  prevYearWebTotal?: number;
  prevYearWebOrders?: number;
}

export interface DayPoint {
  day: string; // '2026-10-20'
  webTotal: number;
  webOrders: number;
  googleSpend: number;
  googleConvValue: number;
  amazonTotal?: number;
  tercerosTotal?: number;
  webByChannel?: ChannelSplit;
  // Comparativa interanual diaria (mismo día del año pasado).
  prevYearWebTotal?: number;
  prevYearWebOrders?: number;
}

export interface HourPoint {
  hour: number; // 0..23 (hora local del negocio)
  webTotal: number;
  webOrders: number;
  webByChannel?: ChannelSplit;
}

export interface Product {
  title: string;
  sales: number;
  orders: number;
}

export interface SourceStatus {
  shopify: boolean; // true si al menos una tienda está en vivo
  shopifyCountries: Country[]; // países con datos en vivo
  googleAds: boolean;
  amazon: boolean;
  meta: boolean;
  terceros: boolean;
}

// ── Bloque por país (datos ya en EUR) ──
export interface CountryBlock {
  country: Country;
  label: string;
  currency: string; // moneda nativa (EUR, USD…)
  fxToEur: number;
  webLive: boolean; // la tienda Shopify de ese país da datos en vivo
  months: MonthPoint[];
  currentMonthDaily: DayPoint[];
  todayHourly: HourPoint[];
  topProductsCurrentMonth: Product[];
}

// ── Dataset crudo que el servidor manda al cliente ──
// El cliente calcula la VISTA (PanelData) según país + rango de fechas elegidos.
export interface RawDataset {
  generatedAt: string;
  live: boolean;
  attribution: boolean;
  sources: SourceStatus;
  shopName: string;
  currency: "EUR";
  timezone: string;
  today: string; // 'YYYY-MM-DD'
  nowHour: number;
  currentMonthKey: string;
  monthKeys: string[]; // ventana de meses disponible
  fx: Record<string, number>; // tipos de cambio usados (p. ej. { USD: 0.92 })
  countries: CountryBlock[];
  // Comparativa interanual (se rellena con datos del histórico cuando estén).
  historico?: Record<string, HistoMonth[]>; // clave: país · meses 'YYYY-MM'
  historicoDays?: Record<string, HistoMonth[]>; // clave: país · días 'YYYY-MM-DD'
}

// Mes del histórico del año pasado (comparativa interanual).
export interface HistoMonth {
  key: string; // 'YYYY-MM' del año pasado
  webTotal: number;
  webOrders: number;
}

// ── Vista que consumen las pantallas (consolidada para la selección activa) ──
export interface PanelData {
  generatedAt: string;
  live: boolean;
  attribution: boolean;
  sources: SourceStatus;
  shopName: string;
  currency: string;
  timezone: string;
  today: string;
  nowHour: number;
  currentMonthKey: string;
  months: MonthPoint[];
  currentMonthDaily: DayPoint[];
  todayHourly: HourPoint[];
  topProductsCurrentMonth: Product[];
  // Contexto de la selección activa.
  country: CountrySel;
  countriesAvailable: { code: Country; label: string; flag: string; live: boolean }[];
  fx: Record<string, number>;
  // Mismo día del año pasado (día completo), para la Intradía. undefined = sin histórico.
  todayPrevYearTotal?: number;
  todayPrevYearOrders?: number;
}

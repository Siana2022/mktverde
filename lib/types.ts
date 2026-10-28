// Modelo de datos del panel. Todos los importes en EUR.

export interface MonthPoint {
  key: string; // '2026-10'
  label: string; // 'oct'
  webTotal: number; // ventas totales web (Shopify)
  webGross: number;
  webNet: number;
  webOrders: number;
  aov: number; // ticket medio
  googleSpend: number; // inversión Google Ads
  googleConvValue: number; // valor de conversión atribuido por Google
  googleConversions: number;
  googleClicks: number;
  googleImpressions: number;
  partial?: boolean; // mes en curso, incompleto
}

export interface DayPoint {
  day: string; // '2026-10-20'
  webTotal: number;
  webOrders: number;
  googleSpend: number;
  googleConvValue: number;
}

export interface HourPoint {
  hour: number; // 0..23 (hora local del negocio)
  webTotal: number;
  webOrders: number;
}

export interface Product {
  title: string;
  sales: number;
  orders: number;
}

export interface SourceStatus {
  shopify: boolean; // true si los datos vienen en vivo
  googleAds: boolean;
  amazon: boolean;
  meta: boolean;
}

export interface PanelData {
  generatedAt: string; // ISO
  live: boolean; // true si al menos una fuente es en vivo
  sources: SourceStatus;
  shopName: string;
  currency: string;
  timezone: string;
  today: string; // 'YYYY-MM-DD' en zona del negocio
  nowHour: number; // hora local actual (0..23)
  currentMonthKey: string;
  months: MonthPoint[];
  currentMonthDaily: DayPoint[];
  todayHourly: HourPoint[];
  topProductsCurrentMonth: Product[];
}

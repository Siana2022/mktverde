// Histórico del AÑO EN CURSO (2026) por país, para rellenar lo que la API de pedidos
// de Shopify no alcanza (solo da ~60 días). Así el filtro de fechas tiene datos en
// todo el rango. Son totales (sin reparto por canal); los meses/días recientes en vivo
// tienen prioridad. De momento solo España (data/baseline.json).

import baselineRaw from "@/data/baseline.json";

export interface BaselineRow { key: string; webTotal: number; webOrders: number }

export interface Baseline {
  months: Map<string, BaselineRow>; // clave country:YYYY-MM
  days: Map<string, BaselineRow>; // clave country:YYYY-MM-DD
}

export function getBaseline(): Baseline {
  const months = new Map<string, BaselineRow>();
  const days = new Map<string, BaselineRow>();
  const raw = baselineRaw as Record<string, { months?: BaselineRow[]; days?: BaselineRow[] }>;
  for (const country of Object.keys(raw)) {
    if (country.startsWith("_")) continue;
    for (const m of raw[country].months || []) months.set(`${country}:${m.key}`, m);
    for (const d of raw[country].days || []) days.set(`${country}:${d.key}`, d);
  }
  return { months, days };
}

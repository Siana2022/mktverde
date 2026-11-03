// Carga de fuentes MANUALES (Amazon y Terceros) y del HISTÓRICO del año pasado.
// De momento se editan a mano en data/manual.json y data/historico.json; la
// interfaz está pensada para que, cuando haya API (Amazon SP-API, etc.), solo
// haya que cambiar este módulo sin tocar la UI.

import manualRaw from "@/data/manual.json";
import historicoRaw from "@/data/historico.json";
import { fxToEur } from "./fx";
import type { Country } from "./types";

interface AmazonRow { country?: Country; key: string; total?: number; orders?: number; spend?: number; convValue?: number; }
interface TercerosRow { country?: Country; key: string; total?: number; orders?: number; }
interface HistRow { country?: Country; key: string; webTotal?: number; webOrders?: number; }

export interface AmazonAgg { total: number; orders: number; spend: number; convValue: number; }
export interface TercerosAgg { total: number; orders: number; }

const k = (country: Country, key: string) => `${country}:${key}`;

// Tipo de cambio aplicable a los importes manuales (según _moneda del fichero).
function manualFx(): number {
  const cur = (manualRaw as { _moneda?: string })._moneda || "EUR";
  return fxToEur(cur);
}

export interface ManualData {
  amazon: Map<string, AmazonAgg>; // clave country:key
  terceros: Map<string, TercerosAgg>;
  hasAmazon: boolean;
  hasTerceros: boolean;
}

export function getManual(): ManualData {
  const fx = manualFx();
  const amazon = new Map<string, AmazonAgg>();
  const terceros = new Map<string, TercerosAgg>();

  for (const r of ((manualRaw as { amazon?: AmazonRow[] }).amazon || [])) {
    const c = (r.country || "es") as Country;
    const cur = amazon.get(k(c, r.key)) || { total: 0, orders: 0, spend: 0, convValue: 0 };
    cur.total += (r.total || 0) * fx;
    cur.orders += r.orders || 0;
    cur.spend += (r.spend || 0) * fx;
    cur.convValue += (r.convValue || 0) * fx;
    amazon.set(k(c, r.key), cur);
  }
  for (const r of ((manualRaw as { terceros?: TercerosRow[] }).terceros || [])) {
    const c = (r.country || "es") as Country;
    const cur = terceros.get(k(c, r.key)) || { total: 0, orders: 0 };
    cur.total += (r.total || 0) * fx;
    cur.orders += r.orders || 0;
    terceros.set(k(c, r.key), cur);
  }

  return { amazon, terceros, hasAmazon: amazon.size > 0, hasTerceros: terceros.size > 0 };
}

type HistoList = Record<string, { key: string; webTotal: number; webOrders: number }[]>;

function groupHist(rows: HistRow[]): HistoList {
  const out: HistoList = {};
  for (const r of rows || []) {
    const c = (r.country || "es") as Country;
    (out[c] ||= []).push({ key: r.key, webTotal: r.webTotal || 0, webOrders: r.webOrders || 0 });
  }
  for (const c of Object.keys(out)) out[c].sort((a, b) => a.key.localeCompare(b.key));
  return out;
}

// Histórico del año pasado: por mes (comparativa mensual) y por día (diaria/intradía).
export function getHistorico(): { months: HistoList; days: HistoList } {
  const raw = historicoRaw as { months?: HistRow[]; days?: HistRow[] };
  return { months: groupHist(raw.months || []), days: groupHist(raw.days || []) };
}

export const amazonKey = k;

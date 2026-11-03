// Importador de un solo uso del WooCommerce antiguo (WordPress), para traer el
// histórico de pedidos del año pasado y poder comparar contra este año.
//
// Los datos del año pasado NO cambian, así que esto se ejecuta UNA vez (desde la
// ruta /api/import-woo, que corre en Vercel y sí llega al dominio del WordPress) y
// su salida se guarda en data/historico.json. Luego el WordPress viejo puede apagarse.
//
// Autenticación: claves REST de solo lectura de WooCommerce (Ajustes → Avanzado →
// REST API), vía Basic Auth sobre HTTPS.

export interface HistoRow { country: "es"; key: string; webTotal: number; webOrders: number }

export interface WooImportResult {
  months: HistoRow[]; // key 'YYYY-MM'
  days: HistoRow[]; // key 'YYYY-MM-DD'
  meta: { pedidos: number; desde: string; hasta: string; estados: string; monedas: Record<string, number>; nota: string };
}

interface WooOrder {
  date_created?: string; // hora local del sitio (ISO sin zona)
  date_created_gmt?: string;
  total?: string;
  currency?: string;
  status?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface WooOpts {
  url: string; // https://dominio
  key: string;
  secret: string;
  from: string; // 'YYYY-MM-DD'
  to: string; // 'YYYY-MM-DD'
  statuses: string; // p.ej. 'completed,processing'
}

export async function importWoo(o: WooOpts): Promise<WooImportResult> {
  const base = o.url.replace(/\/+$/, "");
  const auth = "Basic " + Buffer.from(`${o.key}:${o.secret}`).toString("base64");
  const dAgg = new Map<string, { t: number; n: number }>();
  const mAgg = new Map<string, { t: number; n: number }>();
  const monedas: Record<string, number> = {};
  let pedidos = 0;

  const perPage = 100;
  let page = 1;
  // Tope de seguridad: 300 páginas = 30.000 pedidos.
  for (; page <= 300; page++) {
    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      after: `${o.from}T00:00:00`,
      before: `${o.to}T23:59:59`,
      status: o.statuses,
      orderby: "date",
      order: "asc",
      _fields: "date_created,date_created_gmt,total,currency,status",
    });
    const res = await fetch(`${base}/wp-json/wc/v3/orders?${params.toString()}`, {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Woo ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const orders = (await res.json()) as WooOrder[];
    if (!Array.isArray(orders) || orders.length === 0) break;

    for (const ord of orders) {
      const iso = ord.date_created || ord.date_created_gmt || "";
      if (iso.length < 10) continue;
      const day = iso.slice(0, 10);
      const month = iso.slice(0, 7);
      const amount = parseFloat(ord.total || "0") || 0;
      const cur = (ord.currency || "EUR").toUpperCase();
      monedas[cur] = (monedas[cur] || 0) + 1;
      const d = dAgg.get(day) || { t: 0, n: 0 }; d.t += amount; d.n += 1; dAgg.set(day, d);
      const m = mAgg.get(month) || { t: 0, n: 0 }; m.t += amount; m.n += 1; mAgg.set(month, m);
      pedidos += 1;
    }
    if (orders.length < perPage) break;
  }

  const days: HistoRow[] = [...dAgg.entries()].sort().map(([key, v]) => ({ country: "es", key, webTotal: round2(v.t), webOrders: v.n }));
  const months: HistoRow[] = [...mAgg.entries()].sort().map(([key, v]) => ({ country: "es", key, webTotal: round2(v.t), webOrders: v.n }));

  return {
    months,
    days,
    meta: {
      pedidos,
      desde: o.from,
      hasta: o.to,
      estados: o.statuses,
      monedas,
      nota: "Importes tal cual en WooCommerce (se asume EUR). Fecha = hora local del sitio. Pega 'months' y 'days' en data/historico.json.",
    },
  };
}

// Proveedor Shopify EN VIVO (Admin GraphQL API).
// Agrega pedidos por mes/día/hora y top productos. Importes en EUR (shopMoney).
// Si faltan credenciales o la API falla, devuelve null y la app cae al snapshot.

import type { MonthPoint, DayPoint, HourPoint, Product } from "./types";
import { monthKeyToLabel } from "./time";
import { classifyOrder, emptySplit, type ChannelSplit } from "./attribution";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

export const shopifyConfigured = Boolean(DOMAIN && TOKEN);

interface OrderNode {
  createdAt: string;
  currentTotalPriceSet: { shopMoney: { amount: string } };
  customAttributes: { key: string; value: string }[];
  lineItems: { nodes: { title: string; quantity: number; originalTotalSet: { shopMoney: { amount: string } } }[] };
}

const ORDERS_QUERY = /* GraphQL */ `
  query Orders($cursor: String, $q: String!) {
    orders(first: 250, after: $cursor, query: $q, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes {
        createdAt
        currentTotalPriceSet { shopMoney { amount } }
        customAttributes { key value }
        lineItems(first: 50) {
          nodes { title quantity originalTotalSet { shopMoney { amount } } }
        }
      }
    }
  }
`;

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
    // Revalidar como máximo cada 5 minutos.
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

async function fetchOrders(sinceDay: string, untilDay: string): Promise<OrderNode[]> {
  const q = `created_at:>=${sinceDay} created_at:<=${untilDay}`;
  const out: OrderNode[] = [];
  let cursor: string | null = null;
  // Tope de seguridad de páginas para no colgar en cuentas enormes.
  for (let i = 0; i < 60; i++) {
    const data: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: OrderNode[] } } =
      await graphql(ORDERS_QUERY, { cursor, q });
    out.push(...data.orders.nodes);
    if (!data.orders.pageInfo.hasNextPage) break;
    cursor = data.orders.pageInfo.endCursor;
  }
  return out;
}

export interface ShopifyAggregates {
  months: Pick<MonthPoint, "key" | "label" | "webTotal" | "webOrders" | "aov" | "webByChannel">[];
  currentMonthDaily: Pick<DayPoint, "day" | "webTotal" | "webOrders" | "webByChannel">[];
  todayHourly: HourPoint[];
  topProducts: Product[];
}

function partsInTz(iso: string, tz: string): { ymd: string; month: string; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { ymd: `${p.year}-${p.month}-${p.day}`, month: `${p.year}-${p.month}`, hour: parseInt(p.hour, 10) % 24 };
}

export async function getShopifyAggregates(
  monthKeys: string[],
  currentMonthKey: string,
  today: string,
  tz: string,
): Promise<ShopifyAggregates | null> {
  if (!shopifyConfigured) return null;
  try {
    const sinceDay = `${monthKeys[0]}-01`;
    const orders = await fetchOrders(sinceDay, today);

    type Bucket = { total: number; orders: number; ch: ChannelSplit };
    const bucket = (): Bucket => ({ total: 0, orders: 0, ch: emptySplit() });
    const mAgg = new Map<string, Bucket>();
    const dAgg = new Map<string, Bucket>();
    const hAgg = new Map<number, Bucket>();
    const pAgg = new Map<string, { sales: number; orders: number }>();

    for (const o of orders) {
      const amount = parseFloat(o.currentTotalPriceSet.shopMoney.amount) || 0;
      const channel = classifyOrder(o.customAttributes || []);
      const { ymd, month, hour } = partsInTz(o.createdAt, tz);
      const m = mAgg.get(month) || bucket();
      m.total += amount; m.orders += 1; m.ch[channel] += amount; mAgg.set(month, m);
      if (month === currentMonthKey) {
        const d = dAgg.get(ymd) || bucket();
        d.total += amount; d.orders += 1; d.ch[channel] += amount; dAgg.set(ymd, d);
        for (const li of o.lineItems.nodes) {
          const pv = pAgg.get(li.title) || { sales: 0, orders: 0 };
          pv.sales += parseFloat(li.originalTotalSet.shopMoney.amount) || 0;
          pv.orders += 1; pAgg.set(li.title, pv);
        }
      }
      if (ymd === today) {
        const h = hAgg.get(hour) || bucket();
        h.total += amount; h.orders += 1; h.ch[channel] += amount; hAgg.set(hour, h);
      }
    }

    const months = monthKeys.map((key) => {
      const a = mAgg.get(key) || bucket();
      return { key, label: monthKeyToLabel(key), webTotal: a.total, webOrders: a.orders, aov: a.orders ? a.total / a.orders : 0, webByChannel: a.ch };
    });
    const currentMonthDaily = [...dAgg.entries()].sort().map(([day, a]) => ({ day, webTotal: a.total, webOrders: a.orders, webByChannel: a.ch }));
    const todayHourly: HourPoint[] = Array.from({ length: 24 }, (_, hour) => {
      const a = hAgg.get(hour) || bucket();
      return { hour, webTotal: a.total, webOrders: a.orders, webByChannel: a.ch };
    });
    const topProducts = [...pAgg.entries()]
      .map(([title, a]) => ({ title, sales: a.sales, orders: a.orders }))
      .sort((x, y) => y.sales - x.sales).slice(0, 6);

    return { months, currentMonthDaily, todayHourly, topProducts };
  } catch (err) {
    console.error("[shopify] fallo, uso snapshot:", err);
    return null;
  }
}

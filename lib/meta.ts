// Proveedor Meta Ads EN VIVO (Marketing API / Graph API, directo — sin Windsor.ai).
// Inversión y valor de conversión por mes y por día. Importes en la moneda de la
// cuenta publicitaria (se asume EUR). Si faltan credenciales o la API falla,
// devuelve null y el panel marca Meta como "pendiente".
//
// Credenciales (variables de entorno): un token de System User de Meta Business con
// permiso `ads_read` y el id de la cuenta publicitaria (act_XXXX).

const TOKEN = process.env.META_ACCESS_TOKEN;
const ACCOUNT = (process.env.META_AD_ACCOUNT_ID || "").replace(/^act_/, "");
const VERSION = process.env.META_API_VERSION || "v23.0";
const GRAPH = "https://graph.facebook.com";

export const metaConfigured = Boolean(TOKEN && ACCOUNT);

export interface MetaMetrics {
  spend: number;
  convValue: number;
  impressions: number;
  clicks: number;
}

export interface MetaData {
  byMonth: Map<string, MetaMetrics>; // '2026-10'
  byDay: Map<string, MetaMetrics>; // '2026-10-20'
}

interface InsightRow {
  date_start?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  action_values?: { action_type: string; value: string }[];
}

// Valor de compra atribuido: prioriza omni_purchase, luego purchase.
function purchaseValue(row: InsightRow): number {
  const av = row.action_values || [];
  const pick = (t: string) => av.find((a) => a.action_type === t);
  const entry = pick("omni_purchase") || pick("purchase") || pick("offsite_conversion.fb_pixel_purchase");
  return entry ? parseFloat(entry.value) || 0 : 0;
}

function toMetrics(row: InsightRow): MetaMetrics {
  return {
    spend: parseFloat(row.spend || "0") || 0,
    convValue: purchaseValue(row),
    impressions: parseInt(row.impressions || "0", 10) || 0,
    clicks: parseInt(row.clicks || "0", 10) || 0,
  };
}

async function insights(timeIncrement: "monthly" | "1", since: string, until: string): Promise<InsightRow[]> {
  const params = new URLSearchParams({
    level: "account",
    fields: "spend,impressions,clicks,action_values",
    time_range: JSON.stringify({ since, until }),
    time_increment: timeIncrement,
    limit: "500",
    access_token: TOKEN as string,
  });
  let url: string | null = `${GRAPH}/${VERSION}/act_${ACCOUNT}/insights?${params.toString()}`;
  const rows: InsightRow[] = [];
  for (let i = 0; i < 40 && url; i++) {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Meta ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data?: InsightRow[]; paging?: { next?: string } };
    rows.push(...(json.data || []));
    url = json.paging?.next ?? null;
  }
  return rows;
}

export async function getMeta(sinceDay: string, untilDay: string): Promise<MetaData | null> {
  if (!metaConfigured) return null;
  try {
    const [monthRows, dayRows] = await Promise.all([
      insights("monthly", sinceDay, untilDay),
      insights("1", sinceDay, untilDay),
    ]);
    const byMonth = new Map<string, MetaMetrics>();
    for (const r of monthRows) {
      const key = (r.date_start || "").slice(0, 7);
      if (key) byMonth.set(key, toMetrics(r));
    }
    const byDay = new Map<string, MetaMetrics>();
    for (const r of dayRows) {
      const key = r.date_start || "";
      if (key) byDay.set(key, toMetrics(r));
    }
    return { byMonth, byDay };
  } catch (err) {
    console.error("[meta] fallo, se omite:", err);
    return null;
  }
}

// Proveedor Google Ads EN VIVO (REST API v17).
// Inversión y valor de conversión por mes y por día. Importes en EUR.
// Si faltan credenciales o la API falla, devuelve null y la app cae al snapshot.

const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const LOGIN_CID = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
const CUSTOMER_ID = (process.env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
const API = "https://googleads.googleapis.com/v17";

export const googleAdsConfigured = Boolean(
  DEV_TOKEN && CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && CUSTOMER_ID,
);

export interface GoogleMetrics {
  spend: number;
  convValue: number;
  conversions: number;
  clicks: number;
  impressions: number;
}

export interface GoogleAdsData {
  byMonth: Map<string, GoogleMetrics>; // '2026-10'
  byDay: Map<string, GoogleMetrics>; // '2026-10-20'
}

async function accessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID as string,
      client_secret: CLIENT_SECRET as string,
      refresh_token: REFRESH_TOKEN as string,
      grant_type: "refresh_token",
    }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

interface GaRow {
  metrics?: { costMicros?: string; conversionsValue?: number; conversions?: number; clicks?: string; impressions?: string };
  segments?: { month?: string; date?: string };
}

function toMetrics(m: GaRow["metrics"]): GoogleMetrics {
  return {
    spend: (parseInt(m?.costMicros || "0", 10) || 0) / 1e6,
    convValue: m?.conversionsValue || 0,
    conversions: m?.conversions || 0,
    clicks: parseInt(m?.clicks || "0", 10) || 0,
    impressions: parseInt(m?.impressions || "0", 10) || 0,
  };
}

async function search(token: string, query: string): Promise<GaRow[]> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": DEV_TOKEN as string,
    "Content-Type": "application/json",
  };
  if (LOGIN_CID) headers["login-customer-id"] = LOGIN_CID;
  const rows: GaRow[] = [];
  let pageToken: string | undefined;
  do {
    const res = await fetch(`${API}/customers/${CUSTOMER_ID}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify(pageToken ? { query, pageToken } : { query }),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Google Ads ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { results?: GaRow[]; nextPageToken?: string };
    rows.push(...(json.results || []));
    pageToken = json.nextPageToken;
  } while (pageToken);
  return rows;
}

export async function getGoogleAds(sinceDay: string, untilDay: string): Promise<GoogleAdsData | null> {
  if (!googleAdsConfigured) return null;
  try {
    const token = await accessToken();
    const base = `FROM customer WHERE segments.date BETWEEN '${sinceDay}' AND '${untilDay}'`;
    const metricFields = "metrics.cost_micros, metrics.conversions_value, metrics.conversions, metrics.clicks, metrics.impressions";
    const [monthRows, dayRows] = await Promise.all([
      search(token, `SELECT segments.month, ${metricFields} ${base}`),
      search(token, `SELECT segments.date, ${metricFields} ${base}`),
    ]);
    const byMonth = new Map<string, GoogleMetrics>();
    for (const r of monthRows) {
      const key = (r.segments?.month || "").slice(0, 7); // '2026-10-01' -> '2026-10'
      if (key) byMonth.set(key, toMetrics(r.metrics));
    }
    const byDay = new Map<string, GoogleMetrics>();
    for (const r of dayRows) {
      const key = r.segments?.date || "";
      if (key) byDay.set(key, toMetrics(r.metrics));
    }
    return { byMonth, byDay };
  } catch (err) {
    console.error("[googleAds] fallo, uso snapshot:", err);
    return null;
  }
}

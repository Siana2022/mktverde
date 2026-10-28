// Motor de atribución por canal a partir de los atributos `_siana_*` que el
// tracking de la tienda escribe en cada pedido (cart attributes → order
// customAttributes). Convierte las señales de cada pedido en uno de los 6 canales.
//
// Prioridad (last-touch): identificadores de clic de pago > medium de pago >
// email > buscador orgánico > social orgánico > referral > directo.

export type Channel = "seo" | "organico" | "google" | "meta" | "email" | "directo";

export const CHANNELS: Channel[] = ["seo", "organico", "google", "meta", "email", "directo"];

export const CHANNEL_META: Record<Channel, { label: string; varName: string }> = {
  seo: { label: "SEO", varName: "--c-seo" },
  organico: { label: "Orgánico", varName: "--c-org" },
  google: { label: "Google Ads", varName: "--c-google" },
  meta: { label: "Meta Ads", varName: "--c-meta" },
  email: { label: "Email", varName: "--c-email" },
  directo: { label: "Directo", varName: "--c-directo" },
};

export type ChannelSplit = Record<Channel, number>;

export const emptySplit = (): ChannelSplit => ({ seo: 0, organico: 0, google: 0, meta: 0, email: 0, directo: 0 });

export const addSplit = (a: ChannelSplit, b: ChannelSplit): ChannelSplit =>
  ({ seo: a.seo + b.seo, organico: a.organico + b.organico, google: a.google + b.google, meta: a.meta + b.meta, email: a.email + b.email, directo: a.directo + b.directo });

const SEARCH_ENGINES = ["google.", "bing.", "yahoo.", "duckduckgo", "brave.", "ecosia", "yandex", "baidu", "qwant", "startpage"];
const SOCIAL = ["instagram", "facebook", "fb.", "fb.com", "tiktok", "youtube", "pinterest", "twitter", "x.com", "linkedin", "threads", "t.co", "reddit"];
const PAID_MEDIUMS = ["cpc", "ppc", "paid", "paidmedia", "paid_social", "paid-social", "paidsocial", "cpm", "display"];
const EMAIL_SOURCES = ["connectif", "newsletter", "klaviyo", "mailchimp", "sendgrid", "email", "mail"];
const OWN_HOST = "verdesmeraldaolive.com";

const has = (s: string | undefined, list: string[]) => !!s && list.some((x) => s.includes(x));
const lc = (s: string | undefined) => (s || "").toLowerCase();

// attrs: mapa de atributos del pedido ya SIN el prefijo `_siana_` (p.ej. "utm_source").
export function classify(attrs: Record<string, string>): Channel {
  const gclid = attrs.gclid || attrs.gbraid || attrs.wbraid;
  const fbclid = attrs.fbclid || attrs.fbc;
  const source = lc(attrs.utm_source);
  const medium = lc(attrs.utm_medium);
  const referrer = lc(attrs.referrer);
  const landing = lc(attrs.landing_page);

  // 1) Identificadores de clic de pago (señal más fuerte).
  if (gclid) return "google";
  if (fbclid) return "meta";

  // 2) Medium de pago explícito.
  if (has(medium, PAID_MEDIUMS)) {
    if (has(source, ["facebook", "instagram", "meta", " fb", "ig", "messenger"])) return "meta";
    if (has(source, ["google", "youtube", "gdn", "discovery", "demandgen"])) return "google";
    if (has(source, SOCIAL)) return "meta";
    return "google";
  }

  // 3) Email / newsletter.
  if (medium.startsWith("email") || has(source, EMAIL_SOURCES) || attrs.cn_tracker || attrs.__cn_tracker) return "email";

  // 4) Buscador orgánico (incluye free listings de Google: product_sync / srsltid).
  const organicGoogle = source === "google" && (medium === "product_sync" || medium === "organic" || medium === "free" || medium === "");
  if (organicGoogle || landing.includes("srsltid=") || has(referrer, SEARCH_ENGINES)) return "seo";
  if (medium === "organic") return "seo";

  // 5) Social orgánico (sin marcadores de pago).
  if (has(source, SOCIAL) || (has(referrer, SOCIAL) && !referrer.includes(OWN_HOST))) return "organico";

  // 6) Referral externo → ganado/orgánico.
  if (referrer && !referrer.includes(OWN_HOST) && referrer.startsWith("http")) return "organico";

  // 7) Hay campaña rastreada pero sin encajar arriba → orgánico/campaña.
  if (source || medium) return "organico";

  // 8) Sin señales (o self-referrer, Shop Pay, directo).
  return "directo";
}

// Convierte el array de customAttributes del pedido en un mapa limpio {name: value}.
export function attrsFromOrder(customAttributes: { key: string; value: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of customAttributes || []) {
    if (!a || !a.key) continue;
    const k = a.key.startsWith("_siana_") ? a.key.slice(7) : a.key;
    out[k] = a.value;
  }
  return out;
}

export function classifyOrder(customAttributes: { key: string; value: string }[]): Channel {
  return classify(attrsFromOrder(customAttributes));
}

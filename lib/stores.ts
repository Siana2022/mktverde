// Registro de tiendas Shopify por país. Verde Esmeralda tiene una tienda Shopify
// INDEPENDIENTE por país (España, Italia, EEUU), cada una con su dominio, sus
// credenciales y su moneda. Este módulo centraliza su configuración desde variables
// de entorno para que el resto del código trabaje con una lista de tiendas.
//
// Variables por tienda (ejemplo España; IT y US igual con prefijo _IT_ / _US_):
//   SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_ADMIN_TOKEN
//   SHOPIFY_IT_STORE_DOMAIN, SHOPIFY_IT_CLIENT_ID, ...
//   SHOPIFY_US_STORE_DOMAIN, SHOPIFY_US_CLIENT_ID, ...

import type { Country } from "./types";
import { fxToEur } from "./fx";

export interface StoreConfig {
  country: Country;
  label: string;
  domain?: string;
  token?: string; // Admin API token fijo (shpat_…), opción A
  clientId?: string; // client credentials, opción B
  clientSecret?: string;
  apiVersion: string;
  currency: string; // moneda nativa de la tienda
  fxToEur: number; // tipo de cambio a EUR (1 si ya es EUR)
  ownHost?: string; // dominio público (para atribución de referrers propios)
}

const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

// Lee la config de una tienda a partir del prefijo de sus variables.
function readStore(
  country: Country,
  label: string,
  prefix: string,
  currency: string,
  ownHost: string | undefined,
): StoreConfig {
  const env = (k: string) => process.env[`${prefix}${k}`];
  return {
    country,
    label,
    domain: env("STORE_DOMAIN"),
    token: env("ADMIN_TOKEN"),
    clientId: env("CLIENT_ID"),
    clientSecret: env("CLIENT_SECRET"),
    apiVersion: API_VERSION,
    currency,
    fxToEur: fxToEur(currency),
    ownHost,
  };
}

// España usa las variables SIN prefijo (compatibilidad con lo ya desplegado).
// Italia y EEUU usan SHOPIFY_IT_* y SHOPIFY_US_*.
export const STORES: StoreConfig[] = [
  readStore("es", "España", "SHOPIFY_", "EUR", "verdesmeraldaolive.com"),
  readStore("it", "Italia", "SHOPIFY_IT_", "EUR", undefined),
  readStore("us", "EEUU", "SHOPIFY_US_", "USD", undefined),
];

export function storeConfigured(s: StoreConfig): boolean {
  return Boolean(s.domain && (s.token || (s.clientId && s.clientSecret)));
}

// ¿Hay al menos una tienda con credenciales?
export const anyStoreConfigured = STORES.some(storeConfigured);

export function configuredStores(): StoreConfig[] {
  return STORES.filter(storeConfigured);
}

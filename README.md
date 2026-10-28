# Panel de ventas Verde Esmeralda

Panel multicanal de ventas de **Verde Esmeralda Olive** (verdesmeraldaolive.com):
web (Shopify) + Google Ads, con histórico mensual, ventas diarias, intradía y ROAS.

Aplicación **Next.js (App Router) + TypeScript**, lista para desplegar en **Vercel**.
Lee datos **en vivo** de Shopify y Google Ads cuando hay credenciales; si no, muestra
un **snapshot de datos reales** (ver más abajo). **Nunca** hay que subir un CSV.

## Cómo funciona (vivo vs instantánea)

- **Con credenciales** (en `.env.local` o en Vercel) → la app consulta Shopify (Admin
  GraphQL) y Google Ads (API REST) en servidor, con revalidación cada 5 min (ISR).
- **Sin credenciales** → usa `data/snapshot.json`, una instantánea de **datos reales**
  capturados de Shopify + Google Ads (fechada en el banner). Así la web se ve y se
  despliega aunque aún no hayas configurado los secretos.

La cabecera indica el modo: **«En vivo»** (verde) o **«Instantánea real»** (ámbar).

## Las 4 vistas

1. **Global** — facturación web del mes, pedidos, ticket medio, inversión y ROAS de
   Google; histórico mensual de ventas web (6 meses) y reparto Web vs Amazon.
2. **Intradía** — ventas de hoy por hora (tiempo real de Shopify) con marcador «ahora»,
   facturado y pedidos acumulados, hora pico.
3. **Web** — facturado web, inversión/ROAS/valor atribuido de Google; ventas web vs
   atribuido a Google (6 meses), atribución del mes, ventas diarias y ROAS por mes.
4. **Amazon** — *fase 2*. Pantalla de «pendiente de conectar» con lo que aparecerá al
   enchufar Amazon SP-API + Amazon Ads API.

## Puesta en marcha (local)

```bash
npm install
cp .env.example .env.local   # opcional: rellena credenciales para datos en vivo
npm run dev
```

Abre <http://localhost:3000>. Sin `.env.local`, verás el snapshot de datos reales.

## Despliegue en Vercel

1. Importa el repo en Vercel (framework detectado: Next.js, sin configuración extra).
2. En **Settings → Environment Variables**, añade las variables de `.env.example`
   (ver abajo). Sin ellas, el deploy funciona igual mostrando el snapshot.
3. Deploy. Con las variables puestas, la app pasa sola a datos en vivo.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN` | Shopify Admin API (app privada, scopes de lectura `read_orders`, `read_products`). |
| `SHOPIFY_API_VERSION` | Versión de la API (por defecto `2024-10`). |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer token del MCC. |
| `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN` | OAuth de Google Ads. |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | MCC (`2333383997`). |
| `GOOGLE_ADS_CUSTOMER_ID` | Cuenta España (`7701012791`). |
| `PANEL_TIMEZONE` | Zona del negocio (`Europe/Madrid`). |
| `MCP_SECRET` | Secreto del conector MCP remoto (`/api/mcp/<secreto>`). Sin él, cerrado (404). |

## Atribución por canal (propia)

Shopify no trae origen fiable (`order_referrer_source` llega vacío en ~94% de los
pedidos, y el *customer journey* viene casi siempre vacío por Shop Pay + RGPD). Pero la
tienda **ya captura** los parámetros de campaña en cada pedido: su tracking escribe
atributos `_siana_*` (gclid, gbraid, fbclid/fbc, utm_source/medium/campaign, referrer,
landing_page…) como *cart attributes*, que quedan en `order.customAttributes`.

El motor `lib/attribution.ts` lee esos atributos y clasifica cada pedido en uno de los
**6 canales** por last-touch, con esta prioridad:

1. `gclid` / `gbraid` → **Google Ads**
2. `fbclid` / `fbc` → **Meta Ads**
3. `utm_medium` de pago (`cpc`, `paid`, `paidmedia`…) → Google o Meta según `utm_source`
4. `utm_medium=email` o fuente tipo newsletter/Connectif → **Email**
5. `utm_source=google` orgánico (`product_sync`/`srsltid`) o referrer de buscador → **SEO**
6. referrer/fuente social sin marcador de pago → **Orgánico**
7. resto con campaña → **Orgánico**; sin señales → **Directo**

El proveedor `lib/shopify.ts` agrega las ventas web por canal (mes/día/hora). Las reglas
están centralizadas en `lib/attribution.ts`: ajustar una (p. ej. si `product_sync` debe
contar como orgánico aun con gclid) es cambiar una línea.

> Octubre 2026 (379 pedidos reales clasificados): Google Ads 37% · Email 34% ·
> Meta Ads 12% · SEO 11% · Directo 5% · Orgánico 1%.

## Estructura

```
app/            layout, página (server), estilos, fuentes, y api/mcp (MCP remoto)
components/      Panel (tabs), vistas, gráficos SVG, UI, tooltip
lib/            tipos, formato, tiempo, atribución, proveedores, agregador, mcpTools
data/           snapshot.json  (datos reales de respaldo)
mcp/            servidor MCP + bundle .mcpb (Claude Desktop); comparte lib/
prototype/      maqueta HTML original (referencia visual)
```

## Claude (MCP)

Las ventas se consultan desde Claude mediante un servidor MCP que comparte la capa de
datos del panel (`lib/mcpTools.ts`):

- **Claude Desktop:** instala `mcp/dist/verde-esmeralda-ventas.mcpb` (ver `mcp/README.md`).
- **claude.ai (web/móvil):** añade un *custom connector* con la URL
  `https://TU-APP.vercel.app/api/mcp/<MCP_SECRET>` (pon `MCP_SECRET` en Vercel primero).

## Pendiente (fase 2)

- **Meta Ads** — adaptador listo; falta conectar la cuenta y añadir credenciales
  (inversión/ROAS de Meta, para cruzar con las ventas ya atribuidas a Meta).
- **Amazon** — SP-API (ventas) + Amazon Ads API (ACOS/TACOS).
- **Supabase (opcional)** — almacén/caché del histórico por canal, para no recalcular
  6 meses de pedidos en cada carga. El panel no lo necesita para funcionar.

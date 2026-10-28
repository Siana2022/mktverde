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

## Sobre la atribución por canal

Shopify **no trae origen** en ~94% de los pedidos (el `order_referrer_source` llega
vacío). Por eso el panel muestra, de forma honesta, lo que **sí** es medible hoy:
ventas web totales (Shopify) y la parte **atribuida a Google Ads** (según Google). El
desglose fino de los 6 canales (SEO, Orgánico, Meta, Email, Directo, Directo) exige
**captura de UTMs + atribución propia** — la capa «ledger» de la fase siguiente
(ver `CONTEXT-ledger-ingesta.md`, aún no incluido).

## Estructura

```
app/            layout, página (server), estilos globales, fuentes (next/font)
components/      Panel (tabs), vistas, gráficos SVG, UI, tooltip
lib/            tipos, formato, tiempo, proveedores (shopify, googleAds) y agregador
data/           snapshot.json  (datos reales de respaldo)
prototype/      maqueta HTML original (referencia visual)
```

## Pendiente (fase 2)

- **Meta Ads** — adaptador listo; falta conectar la cuenta y añadir credenciales.
- **Amazon** — SP-API (ventas) + Amazon Ads API (ACOS/TACOS).
- **Atribución propia por canal** — captura de UTMs + modelo (capa «ledger», Supabase
  opcional como almacén). Convierte el gran bloque «no atribuido» en los 6 canales.

# Panel de ventas Verde Esmeralda

Panel multicanal de ventas de **Verde Esmeralda**: web (Shopify) + Amazon, con
histórico mensual, intradía y ROAS. Stack objetivo: **Next.js + React + Supabase +
Vercel**.

Este repositorio contiene, de momento, el **prototipo autocontenido** (`index.html`):
React vía CDN + SVG dibujado a mano, con **datos ficticios**. Es la referencia visual
y funcional para portar luego a Next.js.

## Ver el prototipo

Es un único archivo estático. Para verlo:

```bash
python3 -m http.server 8000
```

Luego abre <http://localhost:8000/index.html>. (También funciona abriendo el archivo
directamente en el navegador, pero un servidor evita problemas de CORS con las fuentes.)

## Las 4 vistas (pestañas)

1. **Global** — KPIs (facturación total web+Amazon, pedidos, web, Amazon), histórico
   mensual por canal web (barras apiladas), donut **Web vs Amazon**.
2. **Intradía** — KPIs del día (facturado hoy, pedidos, hora pico, proyección de
   cierre), ventas por hora apiladas por canal con marcador «ahora», mezcla de canales
   del día, Amazon por hora, barra de ritmo vs proyección.
3. **Web** — los 6 canales (SEO, Orgánico, Google Ads, Meta Ads, Email, Directo):
   KPIs + ROAS, mezcla del mes, histórico, ventas diarias apiladas, ROAS Google+Meta.
4. **Amazon** — ventas, pedidos, ticket, Amazon Ads (ACOS/TACOS/ROAS), FBA/FBM, Buy
   Box, devoluciones, histórico mensual, top productos.

## Diseño

- **Fuentes** (Google Fonts): `Fraunces` (titulares) + `IBM Plex Sans` (datos).
- **Paleta de canales** (validada CVD; 5 vivos + Directo neutro):
  SEO `#1baf7a` · Orgánico `#eda100` · Google `#2a78d6` · Meta `#e87ba4` · Email
  `#eb6834` · Directo `#8a8f98`. Plataforma Amazon `#e4891b`.
- Reglas: nunca doble eje, leyenda siempre, `tabular-nums`, tema claro/oscuro por
  tokens, responsive (las rejillas colapsan a 1 columna < 820px).
- Componentes de chart reutilizables: `MonthlyStack`, `ChannelBars`, `DailyStack`,
  `RoasLine`, `Donut`, `AmzMonthly`, `HourlyStack`. Reciben los datos por props o
  constantes; al portar, pasar los datos de Supabase por props.

## Taxonomía de canales

El panel separa **SEO** y **Orgánico**. El enum del backend (`ledger_canal`) hoy los
une en `seo_organico`. Para separarlos: añadir un canal `organico` al enum y ajustar
`clasificar()` (social orgánico/referral → `organico`; búsqueda orgánica →
`seo_organico`). Si no, el panel muestra 5 canales + Directo.

## Contrato de datos (qué sustituir por Supabase)

Las constantes del prototipo (`WEB`, `WEB_DAILY`, `WEB_H`, `AMZ_*`, `adsSpend`,
`NOW_H`, …) se sustituyen por consultas a Supabase. Formato que esperan los
componentes:

```ts
type MesCanal = Record<"SEO"|"Org"|"Goo"|"Met"|"Ema"|"Dir", number>; // € por canal
// WEB:        Record<mes, MesCanal>
// WEB_DAILY:  Record<"01".."28", MesCanal>
// WEB_H:      Record<0..23, MesCanal>
// AMZ_M:      Record<mes, number>    AMZ_H: Record<0..23, number>
```

| Constante (demo) | Significado | Origen real |
|---|---|---|
| `WEB[mes]` | ventas web €/canal/mes | `ledger_ventas_canal_diario` (shopify_es) por mes |
| `WEB_DAILY[dia]` | ventas web €/canal/día | `ledger_ventas_canal_diario` por día (mes en curso) |
| `WEB_H[hora]`, `WEB_TODAY` | ventas web €/canal/hora y acumulado del día | vista `ledger_ventas_canal_horario` |
| `adsSpend`, `spend` (en RoasLine) | inversión Google/Meta por mes | `ledger_inversion_diaria` (google_ads / meta_ads) |
| `AMZ_M[mes]`, `amzDaily`, `AMZ_H` | ventas Amazon mes/día/hora | `ledger_amazon_diario` (fase 2) |
| `AMZ.{...}` | KPIs Amazon | SP-API + Amazon Ads API (fase 2) |
| `NOW_H` | hora de corte «ahora» | `extract(hour from now() at time zone tz)` |
| ROAS (Google/Meta) | ingresos atribuidos ÷ inversión | `ledger_roas_google_diario` (+ equivalente Meta) |
| `proyCierre` | proyección de cierre del día | acumulado ÷ fracción de día, o media de últimos N días a esa hora |

## Pasar al panel real (Next.js)

1. `app/(panel)/layout.tsx` + una página por pestaña, o una página con tabs por hash.
2. CSS del `index.html` a `globals.css` (o CSS modules). Fuentes con `next/font`.
3. Componentes de chart a `components/` (sin cambios; reciben datos por props).
4. Data layer: funciones server (RSC/route handlers) que consultan las vistas de
   Supabase y pasan los datos a los componentes.
5. Quitar `Banner`, el badge «Demo» y el helper `seeded`/generadores; `NOW_H` real.

> Backend, atribución, ingesta y SQL (incluida la vista horaria y la tabla de Amazon):
> ver `CONTEXT-ledger-ingesta.md`.

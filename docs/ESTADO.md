# Estado del proyecto y siguientes pasos

> Documento de continuidad. Última actualización: 2026-10-28.
> Rama de trabajo: `claude/dazzling-albattani-bh6ea0`.

## Decisión estratégica (vigente)
**Cerrar `mktverde` (Verde Esmeralda) primero. `brain` queda aparcado** y se retoma
después. Motivo: VE urge y el panel está casi hecho; `brain` (warehouse multi-cliente,
Python/dlt → Supabase → Metabase) solo tiene Shopify implementado y las otras 5 fuentes
son stubs. Lo construido en VE acelerará `brain` cuando se retome (misma lógica de
atribución y de integraciones). Disparador para volver a `brain`: cliente nº 2 o
necesidad de vigilancia/alertas a lo ancho de la cartera.

## Qué está hecho (construido y desplegado en Vercel)
- Panel Next.js, 4 vistas (Global, Intradía, Web, Amazon-pendiente).
- **Atribución por canal real** desde los atributos `_siana_*` del pedido
  (gclid/fbclid/utm) → SEO, Orgánico, Google Ads, Meta Ads, Email, Directo.
- Conectores: **Shopify** y **Google Ads** probados con datos reales; **Meta** escrito
  (a falta de token). Fallback a `data/snapshot.json` (datos reales de octubre) cuando
  no hay credenciales.
- **Claude / MCP:** bundle `.mcpb` (Claude Desktop) + MCP remoto en `/api/mcp/<secret>`
  (claude.ai web/móvil). Comparten `lib/mcpTools.ts`.
- Datos reales de referencia (octubre 2026, snapshot): web 36.778 € · 379 pedidos ·
  mezcla Google Ads 37% · Email 34% · Meta 12% · SEO 11% · Directo 5% · Orgánico 1%.

## Puesta en marcha — estado de cada credencial

| Fuente | Estado | Acción | Guía |
|---|---|---|---|
| **Shopify** | ⏳ lo hace JuanJo | app privada + token `shpat_…` (con `read_all_orders`) | `docs/PUESTA-EN-MARCHA.md` §1 |
| **Meta Ads** | 📤 guía reenviada, esperando 2 valores | token System User + `act_…` | `docs/META-SETUP.md` |
| **Google Ads** | ⛔ **pendiente hasta mañana** (4 valores) | developer token + client id/secret + refresh token | `docs/GOOGLE-ADS-SETUP.md` |
| **MCP remoto** | opcional | `MCP_SECRET` + conector en claude.ai | `docs/PUESTA-EN-MARCHA.md` §4 |

> **Google Ads:** NO está disponible aún. Los valores llegan **mañana** (los gestiona
> quien lleva la API de Google de la agencia, prob. Enrique). El conector de Google de
> Claude **no** sirve para el panel: el panel necesita credenciales propias.

## Mapeo valores → variables de Vercel (cuando lleguen)

| Valor que devuelven | Variable |
|---|---|
| Shopify: dominio `.myshopify.com` | `SHOPIFY_STORE_DOMAIN` (= `q2ugmg-bz.myshopify.com`) |
| Shopify: token | `SHOPIFY_ADMIN_TOKEN` |
| Meta: token | `META_ACCESS_TOKEN` |
| Meta: id cuenta | `META_AD_ACCOUNT_ID` |
| Google: developer token | `GOOGLE_ADS_DEVELOPER_TOKEN` |
| Google: client id | `GOOGLE_ADS_CLIENT_ID` |
| Google: client secret | `GOOGLE_ADS_CLIENT_SECRET` |
| Google: refresh token | `GOOGLE_ADS_REFRESH_TOKEN` |

Fijas (no cambian): `GOOGLE_ADS_LOGIN_CUSTOMER_ID=2333383997`,
`GOOGLE_ADS_CUSTOMER_ID=7701012791`, `META_API_VERSION=v23.0`,
`PANEL_TIMEZONE=Europe/Madrid`.

Los secretos los pega **JuanJo** en Vercel (no por chat). Tras cada bloque: Redeploy.

## Datos clave
- Tienda Shopify: `verdesmeraldaolive.com` · dominio API `q2ugmg-bz.myshopify.com` · EUR · CET.
- Google Ads: MCC `2333383997`, cuenta ES `7701012791` (hay también Italia y USA).
- `brain`: repo `Siana2022/brain` (Python/dlt, piloto María Catalá). `brain-siana` está vacío.

## Parcado (fase 2, tras el go-live)
- **Top anuncios de Meta** (nivel anuncio: qué creatividades funcionan). Pendiente de
  confirmar que Meta conecta primero.
- **Amazon** (SP-API + Ads). Pendiente de confirmar si VE vende en Amazon ahora.
- **Convergencia con `brain`** (el panel leería del warehouse).

## Siguientes pasos (mañana)
1. Recibir los valores de **Google Ads** (y de **Meta** si han llegado).
2. Pegarlos en Vercel según el mapeo de arriba → Redeploy.
3. Validar que el panel pasa a **«En vivo»** y que los datos cuadran; afinar si algún
   conector da error (lo típico: versión de API de Meta, o `read_all_orders` en Shopify).
4. Si todo va: añadir **top anuncios de Meta** y decidir **Amazon**.

## Cómo retomar
Rama `claude/dazzling-albattani-bh6ea0`. Todo el contexto está en este archivo y en los
`docs/*`. El panel ya está desplegado en Vercel; el `.mcpb` en `mcp/dist/`.

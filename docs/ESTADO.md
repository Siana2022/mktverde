# Estado del proyecto y siguientes pasos

> Documento de continuidad. Última actualización: 2026-11-03.
> Rama de trabajo: `claude/dazzling-albattani-bh6ea0`.

## Ampliación 2026-11-03 (hecho y desplegado)
- **Multi-país**: arquitectura para 3 tiendas Shopify independientes (ES en vivo;
  IT y US cuando lleguen credenciales, variables `SHOPIFY_IT_*` / `SHOPIFY_US_*`).
  **Selector de país** (Todos/ES/IT/EEUU) con consolidación en € (EEUU se convierte
  con `FX_USD_EUR`). Los países sin datos salen como «pendiente».
- **Filtro de fechas** interactivo (atajos + rango manual), sin recargar.
- **Amazon y Terceros**: carga manual en `data/manual.json` (pestañas propias +
  suma en Global), con la interfaz lista para pasar a API.
- **Drill-down por canal** (pestaña Web): inversión vs ventas, ROAS y crecimiento
  mes a mes al pinchar un canal.
- **Comparativa interanual**: lista; se enciende sola al cargar `data/historico.json`
  con los totales del WooCommerce antiguo.
- Guía de uso: `docs/CARGA-MANUAL.md`.

### Pendiente por parte de JuanJo
- Credenciales Shopify de **Italia** y **EEUU** → pegar en Vercel (ver guía).
- **Histórico** del WordPress antiguo → `data/historico.json` (mensual; si hay diario,
  ampliamos para Intradía).
- Cargar cifras de **Amazon/Terceros** en `data/manual.json` (o decidir API).
- Credenciales de **Google Ads** y **Meta** (siguen pendientes; de momento solo España).


## Decisión estratégica (vigente)
**Cerrar `mktverde` (Verde Esmeralda) primero. `brain` queda aparcado** y se retoma
después. Motivo: VE urge y el panel está casi hecho; `brain` (warehouse multi-cliente,
Python/dlt → Supabase → Metabase) solo tiene Shopify implementado y las otras 5 fuentes
son stubs. Lo construido en VE acelerará `brain` cuando se retome (misma lógica de
atribución y de integraciones). Disparador para volver a `brain`: cliente nº 2 o
necesidad de vigilancia/alertas a lo ancho de la cartera.

## Qué está hecho (construido y desplegado — EN VIVO)
- Panel Next.js, 4 vistas (Global, Intradía, Web, Amazon-pendiente), en `mktverde.vercel.app`.
- **Shopify EN VIVO** ✅ — conectado con *client credentials* (Client ID + Client secret
  del Dev Dashboard; el panel pide el token de 24 h él solo). App instalada en la tienda
  vía *managed installation* (botón "Install app" del menú ⋯). Badge "EN VIVO" visible.
- **Atribución por canal real** ✅ desde los atributos `_siana_*` del pedido
  (gclid/gbraid→Google, fbclid/fbc→Meta, utm_source/medium, referrer, landing_page) →
  SEO, Orgánico, Google Ads, Meta Ads, Email, Directo. Funcionando en vivo.
- **Claude / MCP:** bundle `.mcpb` (Claude Desktop) + MCP remoto en `/api/mcp/<secret>`
  (claude.ai web/móvil). Comparten `lib/mcpTools.ts`.
- Fallback a `data/snapshot.json` (datos reales de octubre) si fallan credenciales.

## Puesta en marcha — estado de cada credencial

| Fuente | Estado | Acción | Guía |
|---|---|---|---|
| **Shopify** | ✅ **EN VIVO** | Client ID + Client secret puestos en Vercel; app instalada | `docs/PUESTA-EN-MARCHA.md` §1 |
| **Meta Ads** | 📤 guía reenviada, esperando 2 valores | token System User + `act_…` | `docs/META-SETUP.md` |
| **Google Ads** | 📤 guía reenviada, esperando 4 valores | developer token + client id/secret + refresh token | `docs/GOOGLE-ADS-SETUP.md` |
| **MCP remoto** | opcional | `MCP_SECRET` + conector en claude.ai | `docs/PUESTA-EN-MARCHA.md` §4 |

> **Google Ads:** el contacto que lleva la API de Google de la agencia tiene que devolver
> los 4 valores (ver guía). El conector de Google de Claude **no** sirve para el panel:
> el panel necesita credenciales propias. Importante: la pantalla de consentimiento OAuth
> debe estar **"En producción"** o el refresh token caduca a los 7 días.

## Mapeo valores → variables de Vercel (cuando lleguen)

| Valor que devuelven | Variable |
|---|---|
| Meta: token | `META_ACCESS_TOKEN` |
| Meta: id cuenta | `META_AD_ACCOUNT_ID` |
| Google: developer token | `GOOGLE_ADS_DEVELOPER_TOKEN` |
| Google: client id | `GOOGLE_ADS_CLIENT_ID` |
| Google: client secret | `GOOGLE_ADS_CLIENT_SECRET` |
| Google: refresh token | `GOOGLE_ADS_REFRESH_TOKEN` |

Fijas (no cambian): `SHOPIFY_STORE_DOMAIN=q2ugmg-bz.myshopify.com`,
`GOOGLE_ADS_LOGIN_CUSTOMER_ID=2333383997`, `GOOGLE_ADS_CUSTOMER_ID=7701012791`,
`META_API_VERSION=v23.0`, `PANEL_TIMEZONE=Europe/Madrid`.

Los secretos los pega **JuanJo** en Vercel (no por chat). Tras cada bloque: Redeploy.

## ⚠️ Hallazgo importante: integridad de los datos históricos
La tienda venía de **WooCommerce**; los pedidos antiguos los importó la app
"VE Migration Import". **Esos datos importados no son fiables:**
- A nivel mes: Shopify dice nov-2025 ≈ **152.646 €**, pero los registros de JuanJo dicen
  **87.000 €**. Probable error del importador.
- A nivel día: Shopify dice 2-11-2025 = **699,90 €**; la herramienta directa de JuanJo
  dice **1.293,65 €**. No cuadran.
- **Los datos nativos** (pedidos hechos ya en Shopify, post-migración) **sí son fiables**
  y son los que el panel muestra en vivo correctamente.

## Intradía — comparativa interanual (YoY) — PARCADO
- **No es viable este año**: no hay histórico diario fiable (el importado está mal; JuanJo
  solo tiene los **totales mensuales** reales apuntados, no diarios ni intradía).
- **Funcionará solo el año que viene**: comparará nativo vs nativo (ambos fiables).
- **Acción de JuanJo (su lado):** pensar cómo obtener los intradía de hace un año para
  poder montar la comparativa antes. Si aparece una fuente diaria fiable, se integra.

## Otros pendientes conocidos (menores)
- **Meses vacíos jun/jul/ago** en la gráfica mensual: son nativos y fiables pero caen
  fuera del límite de 60 días de la API de pedidos de Shopify, así que en vivo salen
  vacíos. Se arregla "horneando" ese histórico nativo en el snapshot — hace falta la
  **fecha exacta de la migración** para saber desde cuándo los datos son fiables.
- **KPIs de Google** salen en 0 €: convendría mostrarlos como "pendiente" hasta conectar.

## Parcado (fase 2, tras conectar Google/Meta)
- **Top anuncios de Meta** (nivel anuncio: qué creatividades funcionan).
- **Amazon** (SP-API + Ads). Pendiente de confirmar si VE vende en Amazon ahora.
- **Convergencia con `brain`** (el panel leería del warehouse).

## Cómo retomar
Rama `claude/dazzling-albattani-bh6ea0`. Todo el contexto está en este archivo y en los
`docs/*`. El panel ya está EN VIVO en Vercel con Shopify; el `.mcpb` en `mcp/dist/`.
Próximo trabajo natural: (1) conectar Google Ads y Meta cuando lleguen los valores;
(2) decidir fecha de migración para rellenar los meses nativos; (3) retomar YoY si JuanJo
consigue el histórico diario.

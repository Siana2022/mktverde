# Puesta en marcha — pasar el panel a «En vivo»

El panel ya está desplegado y funciona con una **instantánea de datos reales**. Para
que se actualice solo hay que darle credenciales de cada fuente como **variables de
entorno en Vercel**. Puedes activarlas **de una en una** — el panel va mostrando en
vivo lo que tenga y deja el resto en la instantánea / «pendiente».

Orden recomendado (de más fácil a más fiddly): **Shopify → Meta → Google Ads**.

Al terminar cada una: *Vercel → Deployments → Redeploy*. No hace falta reconstruir nada.

---

## 1. Shopify  (lo más fácil, ~5 min) — desbloquea ventas web + atribución por canal

1. En el **admin de Shopify** de Verde Esmeralda: **Configuración → Apps y canales de
   venta → Desarrollar apps** → *Permitir el desarrollo de apps personalizadas* si lo pide.
2. **Crear una app** → nombre «Panel Verde Esmeralda».
3. **Configuration → Admin API integration → Configure**. Marca estos permisos de lectura:
   - `read_orders`
   - `read_products`
   - `read_all_orders`  ← **importante**: sin él, la API solo deja leer los pedidos de
     los **últimos 60 días** (el histórico de 6 meses se quedaría corto). Shopify pide
     una breve justificación; vale «panel analítico interno de ventas».
   Guarda.
4. **Install app**.
5. **API credentials → Admin API access token → Reveal**. Empieza por `shpat_…`.
   **Cópialo ya** (solo se muestra una vez).
6. En Vercel añade:
   ```
   SHOPIFY_STORE_DOMAIN = q2ugmg-bz.myshopify.com
   SHOPIFY_ADMIN_TOKEN  = shpat_…
   ```
   > El dominio es el interno `*.myshopify.com`, no `verdesmeraldaolive.com`. Si no estás
   > seguro, está en *Shopify → Configuración → Dominios*.
7. Redeploy. El badge pasa de «Instantánea real» a **«En vivo»** y la atribución por
   canal se calcula en tiempo real.

---

## 2. Meta Ads — inversión y ROAS de Meta (las ventas de Meta ya se atribuyen sin esto)

1. **App contenedora:** [developers.facebook.com](https://developers.facebook.com) →
   *My Apps → Create App* → tipo **Business** → nombre. Dentro: *Add Product → Marketing API*.
2. **System User token (largo plazo):** [business.facebook.com](https://business.facebook.com)
   → *Business Settings → Users → System Users → Add* (rol Admin). Asígnale:
   - *Add Assets → Ad Accounts* → la cuenta de Verde Esmeralda → permiso **View performance**
     (`ads_read`).
   - *Add Assets → Apps* → la app del paso 1.
3. **Generate New Token** → elige la app → scope **`ads_read`** → caducidad **Never** →
   copia el token.
4. El **id de la cuenta** (`act_XXXXXXXXXX`) está en Ads Manager (arriba) o en Business
   Settings → Ad Accounts.
5. En Vercel:
   ```
   META_ACCESS_TOKEN   = <token del system user>
   META_AD_ACCOUNT_ID  = act_XXXXXXXXXX
   META_API_VERSION    = v23.0
   ```
   > Si una llamada falla por versión, sube `META_API_VERSION` a la actual (la ves en el
   > desplegable del *Graph API Explorer*).
6. Redeploy. La fila de Meta en «Rendimiento por plataforma de pago» se rellena.

---

## 3. Google Ads — inversión y ROAS de Google (lo más entretenido)

Necesitas: **developer token** (del MCC, ya existe con acceso básico), un **OAuth client**
y un **refresh token**.

1. **OAuth client:** [Google Cloud Console](https://console.cloud.google.com) → un proyecto
   → *APIs & Services → Credentials → Create credentials → OAuth client ID* → tipo
   **Web application**. En *Authorized redirect URIs* añade
   `https://developers.google.com/oauthplayground`. Guarda el **client id** y **client secret**.
2. **Refresh token (una vez):** ve a
   [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) → rueda de ajustes
   (arriba dcha.) → *Use your own OAuth credentials* → pega client id/secret. En el panel
   izquierdo, en «Input your own scopes», pon:
   `https://www.googleapis.com/auth/adwords` → *Authorize APIs* → inicia sesión con la
   cuenta que tiene acceso al MCC → *Exchange authorization code for tokens* → copia el
   **Refresh token**.
3. En Vercel:
   ```
   GOOGLE_ADS_DEVELOPER_TOKEN   = <developer token del MCC>
   GOOGLE_ADS_CLIENT_ID         = <client id>
   GOOGLE_ADS_CLIENT_SECRET     = <client secret>
   GOOGLE_ADS_REFRESH_TOKEN     = <refresh token del playground>
   GOOGLE_ADS_LOGIN_CUSTOMER_ID = 2333383997
   GOOGLE_ADS_CUSTOMER_ID       = 7701012791
   ```
4. Redeploy. Los KPIs de inversión y ROAS de Google pasan a vivo.

---

## 4. MCP remoto para Claude (opcional) — hablar con los datos desde claude.ai

1. En Vercel añade `MCP_SECRET` con un valor largo y aleatorio:
   ```bash
   openssl rand -hex 24
   ```
   Redeploy.
2. En **claude.ai → Settings → Connectors → Add custom connector**, pega:
   `https://TU-APP.vercel.app/api/mcp/EL_SECRETO`
3. Ya puedes preguntarle a Claude desde web y móvil. (En Claude Desktop, alternativa: el
   bundle `mcp/dist/verde-esmeralda-ventas.mcpb`.)

---

## Todas las variables (resumen para Vercel)

| Variable | Fuente | Obligatoria para |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN` | Shopify | ventas web + atribución en vivo |
| `GOOGLE_ADS_*` (6) | Google Ads | inversión/ROAS Google |
| `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_API_VERSION` | Meta | inversión/ROAS Meta |
| `PANEL_TIMEZONE` | — | `Europe/Madrid` |
| `MCP_SECRET` | — | conector MCP remoto |

Sin ninguna, el panel sigue funcionando con la instantánea. Cada bloque que completes se
enciende por su cuenta.

## Cómo saber que está en vivo
- La cabecera muestra **«En vivo»** (verde) en vez de «Instantánea real».
- El banner dice qué fuentes están activas y la hora de actualización.

## Pendiente (fase 2, tras el go-live)
- **Top anuncios de Meta** (qué creatividades funcionan mejor/peor): extensión del
  conector de Meta a nivel de anuncio.
- **Amazon** (SP-API + Amazon Ads): cuarta fuente.
- **Convergencia con `brain`**: cuando se retome, el panel puede leer del warehouse en
  vez de llamar a las APIs directamente.

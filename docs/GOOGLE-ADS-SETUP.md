# Acceso de solo lectura a Google Ads (Verde Esmeralda)

Estamos conectando un panel de ventas con la **Google Ads API** para leer la
**inversión y el rendimiento** de la cuenta de Verde Esmeralda España. Solo lectura.

El panel es una aplicación propia (no el conector de Google Ads de Claude ni Looker),
así que necesita **sus propias credenciales de API**. Como la agencia ya usa la API de
Google Ads, lo más rápido es **reunir los valores que ya existen** y generar un
*refresh token* una vez.

Cuentas implicadas (ya conocidas, no hace falta cambiarlas):
- **MCC (login):** `2333383997`
- **Cuenta cliente:** `7701012791` (Verde Esmeralda Olive - España)

Necesitamos que nos devuelvas **cuatro datos** (al final).

---

## Qué reunir

### 1. Developer token
- En el **MCC** (2333383997): **Tools & Settings → API Center** → copia el
  **Developer token**. (Ya existe con acceso básico; sirve para lectura.)

### 2. OAuth client (id + secret)
Si ya hay un OAuth client creado para la integración de Google Ads, reutilízalo. Si no:
- [Google Cloud Console](https://console.cloud.google.com) → un proyecto →
  **APIs & Services → Credentials → Create credentials → OAuth client ID** → tipo
  **Web application**.
- En **Authorized redirect URIs** añade:
  `https://developers.google.com/oauthplayground`
- Guarda el **Client ID** y el **Client secret**.

### 3. Refresh token (una vez)
- Abre el [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
- Arriba a la derecha, **⚙ (Settings)** → marca **Use your own OAuth credentials** →
  pega el **Client ID** y **Client secret** del paso 2.
- En el panel izquierdo, en **«Input your own scopes»**, escribe exactamente:
  `https://www.googleapis.com/auth/adwords`
- **Authorize APIs** → inicia sesión con una cuenta de Google que **tenga acceso al
  MCC 2333383997** → acepta.
- Pulsa **Exchange authorization code for tokens** → copia el **Refresh token**.

---

## Qué devolver

Envía estos cuatro valores (por un canal seguro):

1. **Developer token**
2. **Client ID**
3. **Client secret**
4. **Refresh token**

Con eso configuramos el panel. Todo es de **solo lectura** (scope `adwords` sobre una
cuenta a la que ya tienes acceso); el refresh token se puede revocar cuando quieras
desde la cuenta de Google o el OAuth client.

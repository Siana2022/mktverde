# Acceso de solo lectura a Meta Ads (Verde Esmeralda)

Estamos conectando un panel de ventas con la **Meta Marketing API** para leer la
**inversión y el rendimiento** de las campañas de Verde Esmeralda. Solo necesitamos
**acceso de lectura** (`ads_read`): no se puede crear, pausar ni modificar nada.

Necesitamos que nos devuelvas **dos datos** (al final del documento).

---

## Qué hay que hacer (Meta Business Manager, ~10 min)

**Requisito:** ser administrador del Business Manager que contiene la cuenta
publicitaria de Verde Esmeralda.

### A. Crear (o reutilizar) una app
1. Entra en <https://developers.facebook.com> → **My Apps → Create App**.
2. Tipo: **Business** → ponle un nombre (p. ej. «Panel Ventas VE») → crear.
3. Dentro de la app: **Add Product → Marketing API** (solo añadirlo, no hace falta
   revisión de app para leer tu propia cuenta).

### B. Crear un System User y su token de larga duración
> Importante: **token de System User**, no un token de usuario personal (los
> personales caducan y se rompen).

4. Entra en <https://business.facebook.com> → **Business Settings** (Configuración del
   negocio).
5. **Users → System Users → Add** → nombre «panel-ventas», rol **Admin** → crear.
6. Con el system user seleccionado, **Add Assets**:
   - **Ad Accounts** → elige la cuenta de **Verde Esmeralda** → activa el permiso
     **View performance** (equivale a `ads_read`).
   - **Apps** → elige la app del paso A.
7. Pulsa **Generate New Token**:
   - Selecciona la **app** del paso A.
   - Marca el permiso **`ads_read`**.
   - Caducidad: **Never** (sin expiración).
   - **Copia el token** que aparece (se muestra una sola vez).

### C. Localizar el id de la cuenta publicitaria
8. En **Ads Manager** (arriba) o en Business Settings → **Ad Accounts**, copia el
   identificador con formato **`act_XXXXXXXXXX`**.

---

## Qué devolver

Envía estos dos datos (el token, por un canal seguro — no por email abierto):

1. **Token de System User** (la cadena larga del paso 7).
2. **Id de la cuenta publicitaria** (`act_XXXXXXXXXX`).

Con eso lo configuramos nosotros. El token es de **solo lectura**; si en algún momento
quieres revocarlo, se hace desde el mismo System User en Business Settings.

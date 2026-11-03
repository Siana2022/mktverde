# Cómo cargar datos y conectar tiendas nuevas

Guía rápida de las ampliaciones (multi-país, filtro de fechas, Amazon/Terceros y
comparativa interanual). Todo se edita en el repo y, al hacer *Redeploy* en Vercel
(o al hacer push a la rama), queda publicado.

---

## 1. Amazon y Terceros (carga manual)

Edita **`data/manual.json`**. Añade una fila por país y mes:

```json
{
  "amazon": [
    { "country": "es", "key": "2026-10", "total": 12000, "orders": 150, "spend": 1800, "convValue": 9000 }
  ],
  "terceros": [
    { "country": "es", "key": "2026-10", "total": 5000, "orders": 40, "nota": "distribuidor X" }
  ]
}
```

- `country`: `es`, `it` o `us`.
- `key`: mes en formato `AAAA-MM`.
- `total` / `spend`: importes en EUR (si los tienes en otra moneda, cambia `_moneda`).
- Amazon: `spend` = inversión de Amazon Ads; `convValue` = ventas que Amazon se atribuye (para ROAS). Opcionales.

Aparecen en las pestañas **Amazon** y **Terceros**, y suman en **Global**.
Cuando conectemos las APIs (Amazon SP-API, etc.) esto se rellenará solo.

---

## 2. Comparativa con el año pasado

Edita **`data/historico.json`** con los totales del WooCommerce antiguo:

```json
{
  "months": [
    { "country": "es", "key": "2025-11", "webTotal": 87000, "webOrders": 720 }
  ]
}
```

- `key`: el mes **del año pasado** (`2025-…`).
- En cuanto haya datos, la gráfica mensual muestra una **línea discontinua** con el
  año pasado y el KPI de Global muestra la **variación interanual** (verde/rojo).
- Si consigues el **detalle diario** del WooCommerce, lo integramos también para la
  comparativa de Intradía (habría que ampliar un poco el formato; avísame).

---

## 3. Conectar las tiendas de Italia y EEUU

En Vercel → *Settings → Environment Variables*, añade (cuando tengas las credenciales
de cada tienda Shopify, igual que se hizo con España):

**Italia** (EUR):
```
SHOPIFY_IT_STORE_DOMAIN = xxxxx.myshopify.com
SHOPIFY_IT_CLIENT_ID = ...
SHOPIFY_IT_CLIENT_SECRET = ...
```

**EEUU** (USD → se convierte a €):
```
SHOPIFY_US_STORE_DOMAIN = xxxxx.myshopify.com
SHOPIFY_US_CLIENT_ID = ...
SHOPIFY_US_CLIENT_SECRET = ...
```

**Tipo de cambio** (consolidación en €):
```
FX_USD_EUR = 0.92
```

Cada tienda necesita su **app instalada** con scopes `read_orders`, `read_products`
(mismo proceso que España: *Install app* para la instalación gestionada). Hasta que no
estén, Italia y EEUU salen en el selector como **pendientes** (punto naranja).

> Google Ads y Meta están conectados de momento **solo para España**. Cuando lleguen
> esas credenciales se enchufan; multi-país en publicidad es el siguiente paso.

---

## 4. Filtro de fechas y selector de país

Ya funcionan en la cabecera del panel, sin configurar nada:
- **Selector de país**: Todos / España / Italia / EEUU. «Todos» consolida en €.
- **Fechas**: atajos (este mes, 3/6/12 meses) o rango manual.
- **Drill-down**: en la pestaña **Web**, pincha un canal para ver inversión vs
  ventas, ROAS y crecimiento mes a mes.

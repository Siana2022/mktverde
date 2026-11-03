# Importar el histórico del año pasado desde el WooCommerce antiguo

Objetivo: traer **una sola vez** los pedidos del año pasado del WordPress/WooCommerce
viejo para la comparativa interanual (mensual y diaria/intradía). Como esos datos ya no
cambian, se extraen una vez y se guardan fijos en el panel; después puedes apagar el
WordPress viejo.

> Importante: la extracción la hace **Vercel** (que sí llega a tu dominio), no mi sesión
> (la red de mi entorno bloquea hosts externos). Por eso se hace con una ruta del panel.

## Paso 1 · Claves de solo lectura en WooCommerce
En el WordPress viejo: **WooCommerce → Ajustes → Avanzado → REST API → Añadir clave**.
- Descripción: `panel verde (lectura)`
- Permisos: **Lectura**
- Generar → copia **Consumer key** (`ck_…`) y **Consumer secret** (`cs_…`).

## Paso 2 · Variables en Vercel
En el proyecto `mktverde` → *Settings → Environment Variables* (y luego **Redeploy**):

```
WOO_URL      = https://expressive-bronze-gazelle.5-9-221-129.cpanel.site
WOO_KEY      = ck_...
WOO_SECRET   = cs_...
WOO_STATUSES = completed,processing
```

(`WOO_STATUSES` son los estados que cuentan como venta; ajústalo si tus ventas reales
incluyen otros, p. ej. `completed,processing,on-hold`.)

Necesitas también tener `MCP_SECRET` definido (ya lo usamos para el conector); el
importador se protege con ese mismo secreto.

## Paso 3 · Ejecutar la importación (una vez)
Abre en el navegador:

```
https://mktverde.vercel.app/api/import-woo/TU_MCP_SECRET
```

(opcional, acotar fechas: `...?from=2025-01-01&to=2025-12-31&statuses=completed,processing`)

Devuelve un JSON con `meta`, `months` y `days`. **Revisa que los totales mensuales
cuadren con tus registros** (p. ej. noviembre ≈ 87.000 €). Si no cuadran, prueba otros
`statuses`.

## Paso 4 · Guardar el histórico
Copia los bloques `months` y `days` dentro de **`data/historico.json`**:

```json
{
  "months": [ ...lo que devolvió... ],
  "days":   [ ...lo que devolvió... ]
}
```

Puedes editar el fichero en GitHub (web) o pasármelo y lo hago yo. Al desplegar:
- La gráfica mensual muestra la línea del año pasado y la variación interanual.
- La Intradía muestra **“Mismo día año pasado”** y el **% que llevas** respecto a ese día.

## Paso 5 · Limpieza
Cuando los datos estén guardados, **borra** `WOO_URL/WOO_KEY/WOO_SECRET` de Vercel y ya
puedes apagar el WordPress viejo: el histórico queda guardado en el panel.

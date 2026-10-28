# MCP · Ventas Verde Esmeralda

Servidor MCP que expone los datos de ventas del panel (web Shopify + Google Ads, con
atribución propia por canal) como **herramientas para Claude**. Reutiliza la misma capa
de datos que la app (`../lib`). Se instala en **Claude Desktop** como extensión `.mcpb`.

## Instalar (Claude Desktop)

1. Descarga `dist/verde-esmeralda-ventas.mcpb`.
2. Claude Desktop → **Settings → Extensions** → arrastra el `.mcpb` (o *Install from file*).
3. En la configuración de la extensión puedes dejar todo vacío (usa una **instantánea de
   datos reales**) o pegar credenciales para datos **en vivo**:
   - **Shopify Admin API token** (`shpat_…`) + dominio `.myshopify.com` → ventas web y
     atribución por canal en vivo.
   - **Google Ads** (developer token, OAuth client id/secret, refresh token) → inversión
     y ROAS en vivo. Los IDs del MCC y la cuenta ya vienen fijados.
4. Abre un chat y pregunta, p. ej.: *"¿Qué canal me está funcionando mejor este mes?"*,
   *"¿Por qué cayó el ROAS de Google en septiembre?"*, *"¿Dónde recorto inversión?"*.

## Herramientas

| Herramienta | Qué devuelve |
|---|---|
| `resumen_ventas` | Mes actual por canal, Google Ads (inversión/ROAS), hoy y top productos. |
| `ventas_mensuales` | 6 meses por canal + Google Ads por mes (tendencias). |
| `ventas_diarias` | Mes en curso, día a día, por canal. |
| `intradia_hoy` | Hoy hora a hora, por canal. |
| `top_productos` | Top productos del mes. |

## Desarrollo

```bash
npm install
npm run build   # bundle → server/index.mjs (lib + snapshot inlined, sin node_modules)
npm run pack    # build + empaqueta → dist/verde-esmeralda-ventas.mcpb
node test.mjs   # arranca el servidor y prueba el handshake MCP
```

El bundle se genera con esbuild resolviendo el alias `@/` de la app; el servidor usa
`getPanelData()` de `../lib`, así que cualquier mejora en la capa de datos del panel
(nuevas fuentes, Meta, Amazon) aparece aquí sin tocar el servidor MCP.

> Alternativa a futuro: en lugar del `.mcpb` local, exponer el mismo servidor como
> **MCP remoto** (ruta HTTP en Vercel) y añadirlo como *custom connector* en claude.ai
> (web y móvil), usando las credenciales ya configuradas en Vercel.

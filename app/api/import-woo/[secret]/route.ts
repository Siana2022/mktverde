// Importador de un solo uso del WooCommerce antiguo. Protegido por secreto en la URL
// (el mismo MCP_SECRET, o IMPORT_SECRET si se define): /api/import-woo/<secreto>.
//
// Corre en Vercel (que sí llega al dominio del WordPress). Devuelve el histórico
// agregado por día y por mes, listo para pegar en data/historico.json.
//
// Variables de entorno necesarias en Vercel:
//   WOO_URL       = https://tu-dominio-wordpress
//   WOO_KEY       = ck_...   (clave de solo lectura de WooCommerce)
//   WOO_SECRET    = cs_...
//   WOO_STATUSES  = completed,processing   (opcional; estados que cuentan como venta)
//
// Parámetros opcionales en la URL: ?from=2024-01-01&to=2026-01-01&statuses=completed,processing

import { importWoo } from "@/lib/woo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function authorized(secret: string | undefined): boolean {
  const expected = process.env.IMPORT_SECRET || process.env.MCP_SECRET;
  return Boolean(expected && secret && secret === expected);
}

export async function GET(req: Request, ctx: { params: Promise<{ secret: string }> }): Promise<Response> {
  const { secret } = await ctx.params;
  if (!authorized(secret)) return new Response("Not found", { status: 404 });

  const url = process.env.WOO_URL;
  const key = process.env.WOO_KEY;
  const wsecret = process.env.WOO_SECRET;
  if (!url || !key || !wsecret) {
    return Response.json({ error: "Faltan variables WOO_URL / WOO_KEY / WOO_SECRET en Vercel." }, { status: 400 });
  }

  const sp = new URL(req.url).searchParams;
  const now = new Date();
  const defFrom = `${now.getUTCFullYear() - 2}-01-01`; // por defecto, dos años atrás (cubre el año pasado completo)
  const from = sp.get("from") || defFrom;
  const to = sp.get("to") || now.toISOString().slice(0, 10);
  const statuses = sp.get("statuses") || process.env.WOO_STATUSES || "completed,processing";

  try {
    const result = await importWoo({ url, key, secret: wsecret, from, to, statuses });
    return Response.json(
      {
        _instrucciones: "Copia 'months' y 'days' dentro de data/historico.json y haz commit/redeploy. Revisa que los totales mensuales cuadren con tus registros antes.",
        meta: result.meta,
        months: result.months,
        days: result.days,
      },
      { status: 200 },
    );
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

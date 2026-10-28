// MCP remoto (Streamable HTTP) para añadir como conector en claude.ai.
// La autenticación es un secreto en la propia URL: /api/mcp/<MCP_SECRET>.
// Expone las mismas herramientas que el .mcpb, reutilizando lib/mcpTools.ts.

import { createMcpHandler } from "mcp-handler";
import { getPanelData } from "@/lib/data";
import { PANEL_TOOLS } from "@/lib/mcpTools";
import type { PanelData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cache de PanelData por invocación de servidor (5 min).
let cache: { at: number; data: Promise<PanelData> } | null = null;
function panelData(): Promise<PanelData> {
  if (!cache || Date.now() - cache.at > 5 * 60 * 1000) cache = { at: Date.now(), data: getPanelData() };
  return cache.data;
}

const handler = createMcpHandler((server) => {
  for (const t of PANEL_TOOLS) {
    server.registerTool(t.name, { description: t.description }, async () => {
      const data = await panelData();
      return { content: [{ type: "text" as const, text: JSON.stringify(t.run(data), null, 2) }] };
    });
  }
});

function authorized(secret: string | undefined): boolean {
  const expected = process.env.MCP_SECRET;
  return Boolean(expected && secret && secret === expected);
}

async function guard(
  req: Request,
  ctx: { params: Promise<{ secret: string }> },
): Promise<Response> {
  const { secret } = await ctx.params;
  if (!authorized(secret)) return new Response("Not found", { status: 404 });
  return handler(req);
}

export { guard as GET, guard as POST };

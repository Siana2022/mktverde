// Servidor MCP de Verde Esmeralda (transporte stdio, para el bundle .mcpb de
// Claude Desktop). Reutiliza la capa de datos del panel y las herramientas
// compartidas en lib/mcpTools.ts (las mismas que usa la ruta HTTP de Vercel).

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getPanelData } from "../../lib/data";
import { PANEL_TOOLS } from "../../lib/mcpTools";
import type { PanelData } from "../../lib/types";

// Cache de PanelData en proceso (5 min) para no repetir llamadas a las APIs.
let cache: { at: number; data: Promise<PanelData> } | null = null;
function panelData(): Promise<PanelData> {
  if (!cache || Date.now() - cache.at > 5 * 60 * 1000) cache = { at: Date.now(), data: getPanelData() };
  return cache.data;
}

const server = new Server({ name: "verde-esmeralda-ventas", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: PANEL_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: { type: "object", properties: {}, additionalProperties: false } })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = PANEL_TOOLS.find((t) => t.name === req.params.name);
  if (!tool) return { content: [{ type: "text", text: `Herramienta desconocida: ${req.params.name}` }], isError: true };
  try {
    const data = await panelData();
    return { content: [{ type: "text", text: JSON.stringify(tool.run(data), null, 2) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Error obteniendo datos: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
  }
});

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("[verde-esmeralda-ventas] servidor MCP listo");
}
main().catch((e) => {
  console.error("Fallo al arrancar el servidor MCP:", e);
  process.exit(1);
});

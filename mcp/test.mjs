import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: "node",
  args: [path.join(here, "server/index.mjs")],
  // sin credenciales → debe usar el snapshot real
  env: { PATH: process.env.PATH, PANEL_TIMEZONE: "Europe/Madrid", SHOPIFY_ADMIN_TOKEN: "", GOOGLE_ADS_DEVELOPER_TOKEN: "" },
});
const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const res = await client.callTool({ name: "resumen_ventas", arguments: {} });
const payload = JSON.parse(res.content[0].text);
console.log("en_vivo:", payload.en_vivo, "| tienda:", payload.tienda);
console.log("mes:", payload.mes_actual.mes, "| ventas_web:", payload.mes_actual.ventas_web_eur, "| ROAS Google:", payload.mes_actual.google_ads.roas);
console.log("canales:", payload.mes_actual.ventas_por_canal.map((c) => `${c.etiqueta} ${c.porcentaje}%`).join(" · "));
console.log("top#1:", payload.top_productos[0].producto, payload.top_productos[0].ventas_eur + "€");

const mens = JSON.parse((await client.callTool({ name: "ventas_mensuales", arguments: {} })).content[0].text);
console.log("meses:", mens.meses.map((m) => m.mes).join(","), "| sep ROAS:", mens.meses.find((m) => m.mes === "sep").google_ads.roas);

await client.close();
console.log("OK");

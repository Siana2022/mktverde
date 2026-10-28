import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const base = process.argv[2] || "http://localhost:3210/api/mcp/testsecret";
const transport = new StreamableHTTPClientTransport(new URL(base));
const client = new Client({ name: "test-http", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const res = await client.callTool({ name: "resumen_ventas", arguments: {} });
const p = JSON.parse(res.content[0].text);
console.log("en_vivo:", p.en_vivo, "| tienda:", p.tienda, "| mes:", p.mes_actual.mes, "| ventas:", p.mes_actual.ventas_web_eur);
console.log("canales:", p.mes_actual.ventas_por_canal.map((c) => `${c.etiqueta} ${c.porcentaje}%`).join(" · "));

await client.close();
console.log("OK");

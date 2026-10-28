// Empaqueta el servidor MCP en un único fichero server/index.mjs (con la capa
// de datos de lib/ y el snapshot inlined), sin node_modules en el bundle.
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

await esbuild.build({
  entryPoints: [path.join(here, "src/index.ts")],
  outfile: path.join(here, "server/index.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  minify: true,
  // Resuelve el alias "@/..." que usa la app (p. ej. @/data/snapshot.json).
  alias: { "@": repoRoot },
  // Node 20+ ESM no define require; algunos paquetes lo esperan.
  banner: { js: "import { createRequire as _cr } from 'module'; const require = _cr(import.meta.url);" },
  logLevel: "info",
});

console.log("OK → server/index.mjs");

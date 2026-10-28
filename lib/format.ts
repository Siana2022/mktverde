// Helpers de formato (es-ES, EUR).

export const eur = (n: number): string =>
  Math.round(n).toLocaleString("es-ES") + " €";

export const eur1 = (n: number): string =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " €";

export const num = (n: number): string => Math.round(n).toLocaleString("es-ES");

export const pct = (n: number, digits = 0): string =>
  n.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + "%";

export const roas = (n: number): string =>
  n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "x";

// Variación porcentual entre dos valores, con signo y clase para color.
export function delta(curr: number, prev: number): { text: string; cls: "up" | "down" | "flat" } {
  if (!prev) return { text: "—", cls: "flat" };
  const d = ((curr - prev) / prev) * 100;
  const cls = d > 0.05 ? "up" : d < -0.05 ? "down" : "flat";
  const arrow = cls === "up" ? "▲" : cls === "down" ? "▼" : "→";
  return { text: `${arrow} ${Math.abs(d).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`, cls };
}

export const dayNum = (isoDay: string): string => isoDay.slice(8, 10);

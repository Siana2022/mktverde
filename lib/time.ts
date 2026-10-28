// Helpers de tiempo en la zona horaria del negocio.

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function monthKeyToLabel(key: string): string {
  const m = parseInt(key.slice(5, 7), 10);
  return MONTH_LABELS[m - 1] ?? key;
}

// Partes de la fecha/hora "ahora" en la zona dada.
export function nowInTz(tz: string): { today: string; hour: number; monthKey: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return {
    today: `${p.year}-${p.month}-${p.day}`,
    hour: parseInt(p.hour, 10) % 24,
    monthKey: `${p.year}-${p.month}`,
  };
}

// Las claves de los últimos N meses (incluido el actual), terminando en monthKey.
export function lastNMonthKeys(monthKey: string, n: number): string[] {
  const year = parseInt(monthKey.slice(0, 4), 10);
  const month = parseInt(monthKey.slice(5, 7), 10); // 1..12
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let y = year;
    let m = month - i;
    while (m <= 0) { m += 12; y -= 1; }
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return keys;
}

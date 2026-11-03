// Tipos de cambio a EUR. El panel consolida todo en euros; cada tienda que
// factura en otra moneda (p. ej. EEUU en USD) se convierte con el tipo de aquí.
//
// Son tipos CONFIGURABLES (variables de entorno), no en tiempo real: para un panel
// de ventas vale un cambio fijo que se revisa de vez en cuando. Se muestra en la UI
// qué tipo se ha usado, para que quede claro.
//
//   FX_USD_EUR=0.92   (1 USD = 0,92 €)
//
// Si no se define, se usa un valor por defecto razonable.

const DEFAULTS: Record<string, number> = {
  EUR: 1,
  USD: Number(process.env.FX_USD_EUR) || 0.92,
  GBP: Number(process.env.FX_GBP_EUR) || 1.17,
};

// Tipo de la moneda `cur` a EUR. EUR siempre 1.
export function fxToEur(cur: string): number {
  const c = (cur || "EUR").toUpperCase();
  return DEFAULTS[c] ?? 1;
}

// Mapa de los tipos usados, para mostrarlos en la interfaz.
export function fxRatesUsed(): Record<string, number> {
  return { USD: DEFAULTS.USD };
}

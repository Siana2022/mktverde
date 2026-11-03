"use client";

import React from "react";
import type { CountrySel } from "@/lib/types";

export interface CountryOpt { code: "es" | "it" | "us"; label: string; flag: string; live: boolean }

// Selector de país: Todos + una pestaña por país. Los países sin datos en vivo
// se marcan con un punto para que se vea que están pendientes de conectar.
export function CountrySelector({
  value, options, onChange,
}: { value: CountrySel; options: CountryOpt[]; onChange: (c: CountrySel) => void }) {
  const base: { code: CountrySel; label: string; flag: string; live: boolean }[] = [
    { code: "all", label: "Todos", flag: "🌍", live: true },
    ...options.map((o) => ({ code: o.code as CountrySel, label: o.label, flag: o.flag, live: o.live })),
  ];
  return (
    <div className="cntry" role="tablist" aria-label="País">
      {base.map((o) => (
        <button
          key={o.code}
          className={"cbtn" + (value === o.code ? " on" : "")}
          role="tab"
          aria-selected={value === o.code}
          onClick={() => onChange(o.code)}
          title={o.live || o.code === "all" ? o.label : `${o.label} · pendiente de conectar`}
        >
          <span className="fl">{o.flag}</span>
          <span>{o.label}</span>
          {!o.live && o.code !== "all" && <span className="pend" aria-hidden>•</span>}
        </button>
      ))}
    </div>
  );
}

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function human(d: string): string {
  const [y, m, day] = d.split("-");
  return `${parseInt(day, 10)} ${MONTHS_ES[parseInt(m, 10) - 1]} ${y}`;
}

// Rango de fechas: atajos + dos selectores de fecha. `min`/`max` acotan al rango
// de datos disponible.
export function DateRange({
  from, to, min, max, onChange,
}: { from: string; to: string; min: string; max: string; onChange: (from: string, to: string) => void }) {
  // Atajos relativos a `max` (hoy).
  const shiftMonths = (n: number): string => {
    const d = new Date(max + "T00:00:00");
    d.setMonth(d.getMonth() - n);
    const iso = d.toISOString().slice(0, 10);
    return iso < min ? min : iso;
  };
  const monthStart = max.slice(0, 7) + "-01";
  const presets: [string, string, string][] = [
    ["Este mes", monthStart, max],
    ["3 meses", shiftMonths(3), max],
    ["6 meses", shiftMonths(6), max],
    ["12 meses", min, max],
  ];
  const isActive = (f: string) => from === f && to === max;

  return (
    <div className="dr">
      <div className="dr-presets">
        {presets.map(([lab, f, t]) => (
          <button key={lab} className={"pbtn" + (isActive(f) ? " on" : "")} onClick={() => onChange(f, t)}>{lab}</button>
        ))}
      </div>
      <div className="dr-inputs">
        <label className="di">
          <span>Desde</span>
          <input type="date" value={from} min={min} max={to} onChange={(e) => onChange(e.target.value || min, to)} />
        </label>
        <span className="dr-sep">—</span>
        <label className="di">
          <span>Hasta</span>
          <input type="date" value={to} min={from} max={max} onChange={(e) => onChange(from, e.target.value || max)} />
        </label>
        <span className="dr-h">{human(from)} → {human(to)}</span>
      </div>
    </div>
  );
}

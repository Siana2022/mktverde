"use client";

import React, { useMemo, useState } from "react";
import type { RawDataset, CountrySel } from "@/lib/types";
import { buildView, defaultSelection, type Selection } from "@/lib/view";
import { SourceBanner } from "./ui";
import { CountrySelector, DateRange } from "./controls";
import { GlobalView, WebView, IntradiaView, AmazonView, TercerosView } from "./views";

type Tab = "global" | "intradia" | "web" | "amazon" | "terceros";
const TABS: [Tab, string][] = [
  ["global", "Global"], ["intradia", "Intradía"], ["web", "Web"], ["amazon", "Amazon"], ["terceros", "Terceros"],
];

export default function Panel({ raw }: { raw: RawDataset }) {
  const [tab, setTab] = useState<Tab>("global");
  const [sel, setSel] = useState<Selection>(() => defaultSelection(raw));

  const data = useMemo(() => buildView(raw, sel), [raw, sel]);
  const min = `${raw.monthKeys[0]}-01`;
  const max = raw.today;

  const setCountry = (country: CountrySel) => setSel((s) => ({ ...s, country }));
  const setRange = (from: string, to: string) => setSel((s) => ({ ...s, from, to }));

  return (
    <>
      <header className="top">
        <div className="wrap head-in">
          <div className="brand">
            <div className="logo">V</div>
            <div>
              <div className="t1">Verde Esmeralda</div>
              <div className="t2">Panel de ventas · multicanal · multi-país</div>
            </div>
          </div>
          <span className={"demo " + (data.live ? "live" : "snap")}>{data.live ? "En vivo" : "Instantánea real"}</span>
          <div className="tabs" role="tablist">
            {TABS.map(([k, l]) => (
              <button key={k} className="tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="toolbar">
          <CountrySelector value={sel.country} options={data.countriesAvailable} onChange={setCountry} />
          <DateRange from={sel.from} to={sel.to} min={min} max={max} onChange={setRange} />
        </div>

        <SourceBanner live={data.live} sources={data.sources} generatedAt={data.generatedAt} fx={data.fx} />

        {tab === "global" && <GlobalView data={data} />}
        {tab === "intradia" && <IntradiaView data={data} />}
        {tab === "web" && <WebView data={data} />}
        {tab === "amazon" && <AmazonView data={data} />}
        {tab === "terceros" && <TercerosView data={data} />}
      </div>
      <div className="tt" />
    </>
  );
}

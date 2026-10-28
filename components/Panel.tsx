"use client";

import React, { useState } from "react";
import type { PanelData } from "@/lib/types";
import { SourceBanner } from "./ui";
import { GlobalView, WebView, IntradiaView, AmazonView } from "./views";

type Tab = "global" | "intradia" | "web" | "amazon";
const TABS: [Tab, string][] = [["global", "Global"], ["intradia", "Intradía"], ["web", "Web"], ["amazon", "Amazon"]];

export default function Panel({ data }: { data: PanelData }) {
  const [tab, setTab] = useState<Tab>("global");
  return (
    <>
      <header className="top">
        <div className="wrap head-in">
          <div className="brand">
            <div className="logo">V</div>
            <div>
              <div className="t1">Verde Esmeralda</div>
              <div className="t2">Panel de ventas · multicanal</div>
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
        <div style={{ paddingTop: 16 }}>
          <SourceBanner live={data.live} sources={data.sources} generatedAt={data.generatedAt} />
        </div>
        {tab === "global" && <GlobalView data={data} />}
        {tab === "intradia" && <IntradiaView data={data} />}
        {tab === "web" && <WebView data={data} />}
        {tab === "amazon" && <AmazonView />}
      </div>
      <div className="tt" />
    </>
  );
}

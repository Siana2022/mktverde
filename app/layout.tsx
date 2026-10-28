import type { Metadata } from "next";
import { fraunces, plex } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel Verde Esmeralda",
  description: "Panel multicanal de ventas de Verde Esmeralda — web (Shopify) + Google Ads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import { getPanelData } from "@/lib/data";
import Panel from "@/components/Panel";

// Página dinámica: se renderiza en cada visita (necesario porque el token de
// Shopify se pide con un fetch no cacheable). Los fetches de datos se cachean a
// nivel de fetch (next.revalidate) para no golpear las APIs en cada carga.
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getPanelData();
  return <Panel data={data} />;
}

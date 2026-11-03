import { getRawDataset } from "@/lib/data";
import Panel from "@/components/Panel";

// Página dinámica: se renderiza en cada visita (el token de Shopify se pide con un
// fetch no cacheable). Los fetches de datos se cachean a nivel de fetch (revalidate).
export const dynamic = "force-dynamic";

export default async function Page() {
  const raw = await getRawDataset();
  return <Panel raw={raw} />;
}

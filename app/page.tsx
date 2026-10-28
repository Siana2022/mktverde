import { getPanelData } from "@/lib/data";
import Panel from "@/components/Panel";

// Revalidar en servidor cada 5 minutos (cuando hay datos en vivo).
export const revalidate = 300;

export default async function Page() {
  const data = await getPanelData();
  return <Panel data={data} />;
}

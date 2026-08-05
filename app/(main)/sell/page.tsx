import { SellWizard } from "./sell-wizard";
import { getSession } from "@/lib/data";

export default async function SellPage() {
  const session = await getSession();
  return <SellWizard defaultCampus={session?.profile?.university ?? ""} />;
}

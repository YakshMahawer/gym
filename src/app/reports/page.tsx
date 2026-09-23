import { getReportsData } from "@/lib/actions/reports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportsData();
  return <ReportsClient data={data} />;
}

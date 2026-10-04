import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}

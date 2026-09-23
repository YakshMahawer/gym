import { getPayments, getDueSubscriptions } from "@/lib/actions/payments";
import { getMembers } from "@/lib/actions/members";
import { PaymentsClient } from "@/components/payments/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, dueSubscriptions, members] = await Promise.all([
    getPayments(),
    getDueSubscriptions(),
    getMembers(),
  ]);

  const allMembers = members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    memberId: m.memberId,
    dueAmount: m.subscriptions?.[0]?.dueAmount || 0,
  }));

  return (
    <PaymentsClient
      payments={payments}
      dueSubscriptions={dueSubscriptions}
      allMembers={allMembers}
    />
  );
}

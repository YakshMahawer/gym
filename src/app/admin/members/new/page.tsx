import { getPlans } from "@/lib/actions/plans";
import { getMembersLookup, getNextMemberId } from "@/lib/actions/members";
import { MemberForm } from "@/components/members/MemberForm";

export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const [plans, membersLookup, nextMemberId] = await Promise.all([
    getPlans(),
    getMembersLookup(),
    getNextMemberId(),
  ]);

  return (
    <MemberForm
      plans={plans}
      membersLookup={membersLookup}
      initialMemberId={nextMemberId}
      isEdit={false}
    />
  );
}

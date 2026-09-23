import { getMembers } from "@/lib/actions/members";
import { MemberListClient } from "@/components/members/MemberListClient";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  return <MemberListClient members={members} />;
}

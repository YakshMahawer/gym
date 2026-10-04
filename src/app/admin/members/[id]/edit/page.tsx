import { notFound } from "next/navigation";
import { getMemberById, getMembersLookup } from "@/lib/actions/members";
import { getPlans } from "@/lib/actions/plans";
import { MemberForm } from "@/components/members/MemberForm";

export const dynamic = "force-dynamic";

interface EditMemberPageProps {
  params: {
    id: string;
  };
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const [member, plans, membersLookup] = await Promise.all([
    getMemberById(params.id),
    getPlans(),
    getMembersLookup(),
  ]);

  if (!member) {
    notFound();
  }

  return <MemberForm initialData={member} plans={plans} membersLookup={membersLookup} isEdit={true} />;
}

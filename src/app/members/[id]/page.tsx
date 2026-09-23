import { notFound } from "next/navigation";
import { getMemberById } from "@/lib/actions/members";
import { getPlans } from "@/lib/actions/plans";
import { MemberDetailClient } from "@/components/members/MemberDetailClient";

export const dynamic = "force-dynamic";

interface MemberPageProps {
  params: {
    id: string;
  };
}

export default async function MemberDetailPage({ params }: MemberPageProps) {
  const [member, plans] = await Promise.all([
    getMemberById(params.id),
    getPlans(),
  ]);

  if (!member) {
    notFound();
  }

  return <MemberDetailClient member={member} plans={plans} />;
}

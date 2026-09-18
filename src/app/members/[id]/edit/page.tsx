import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MemberForm } from "../../MemberForm";
import { updateMember } from "../../actions";

export default async function EditMemberPage({
  params,
}: {
  params: { id: string };
}) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
  });

  if (!member) {
    notFound();
  }

  const updateMemberWithId = updateMember.bind(null, member.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit Member</h1>
      <MemberForm
        action={updateMemberWithId}
        submitLabel="Save Changes"
        defaultValues={{
          fullName: member.fullName,
          email: member.email ?? "",
          phone: member.phone,
          membershipStatus: member.membershipStatus,
          joinDate: member.joinDate.toISOString().slice(0, 10),
          notes: member.notes ?? "",
        }}
      />
    </div>
  );
}

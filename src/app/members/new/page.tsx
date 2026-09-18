import { MemberForm } from "../MemberForm";
import { createMember } from "../actions";

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Add Member</h1>
      <MemberForm action={createMember} submitLabel="Add Member" />
    </div>
  );
}

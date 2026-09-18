import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteMemberButton } from "./DeleteMemberButton";
import { StatusBadge } from "./StatusBadge";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  const members = await prisma.member.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
        <Link
          href="/members/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Member
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, email or phone"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Joined
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No members found.
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {member.fullName}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{member.phone}</div>
                  {member.email && (
                    <div className="text-slate-400">{member.email}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={member.membershipStatus} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(member.joinDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/members/${member.id}/edit`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Edit
                    </Link>
                    <DeleteMemberButton
                      id={member.id}
                      name={member.fullName}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

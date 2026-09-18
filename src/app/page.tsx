import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [total, active, expired, frozen] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { membershipStatus: "ACTIVE" } }),
    prisma.member.count({ where: { membershipStatus: "EXPIRED" } }),
    prisma.member.count({ where: { membershipStatus: "FROZEN" } }),
  ]);

  const stats = [
    { label: "Total members", value: total },
    { label: "Active", value: active },
    { label: "Expired", value: expired },
    { label: "Frozen", value: frozen },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <Link
          href="/members/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Member
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          This is the first draft of the CRM: basic create, read, update and
          delete for gym members. Go to{" "}
          <Link href="/members" className="text-brand-600 underline">
            Members
          </Link>{" "}
          to manage the list.
        </p>
      </div>
    </div>
  );
}

const STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  FROZEN: "bg-blue-100 text-blue-700",
  EXPIRED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

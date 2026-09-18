"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { MemberFormState } from "./actions";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "FROZEN", "EXPIRED"] as const;

type MemberFormValues = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  membershipStatus: (typeof STATUS_OPTIONS)[number];
  joinDate: string;
  notes: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export function MemberForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    prevState: MemberFormState,
    formData: FormData
  ) => Promise<MemberFormState>;
  defaultValues?: Partial<MemberFormValues>;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState<MemberFormState, FormData>(
    action,
    {}
  );

  const errors = state.errors ?? {};
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          type="text"
          name="fullName"
          defaultValue={defaultValues?.fullName}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={defaultValues?.phone}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email (optional)
          </label>
          <input
            type="email"
            name="email"
            defaultValue={defaultValues?.email}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Membership status
          </label>
          <select
            name="membershipStatus"
            defaultValue={defaultValues?.membershipStatus ?? "ACTIVE"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Join date
          </label>
          <input
            type="date"
            name="joinDate"
            defaultValue={defaultValues?.joinDate ?? todayIso}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          {errors.joinDate && (
            <p className="mt-1 text-sm text-red-600">{errors.joinDate[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

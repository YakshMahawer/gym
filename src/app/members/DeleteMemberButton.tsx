"use client";

import { useTransition } from "react";
import { deleteMember } from "./actions";

export function DeleteMemberButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm(`Delete ${name}? This cannot be undone.`)) {
          startTransition(() => {
            deleteMember(id);
          });
        }
      }}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}

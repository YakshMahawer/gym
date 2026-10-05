"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition active:bg-slate-800"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print / Save</span>
    </button>
  );
}

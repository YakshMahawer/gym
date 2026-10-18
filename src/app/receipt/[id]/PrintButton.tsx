"use client";

import React from "react";
import { Printer, Download } from "lucide-react";

export function PrintButton({ receiptId }: { receiptId?: string }) {
  return (
    <div className="flex items-center gap-2">
      {receiptId && (
        <a
          href={`/api/receipt/${encodeURIComponent(receiptId)}/pdf`}
          download={`Concept1Gym_Invoice_${receiptId}.pdf`}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition"
          title="Download official PDF receipt"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download PDF</span>
        </a>
      )}
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition active:bg-slate-800"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print Invoice</span>
      </button>
    </div>
  );
}


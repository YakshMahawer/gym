"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { updateReceiptNumber } from "@/lib/actions/payments";
import { formatINR, formatDate } from "@/lib/utils";

interface EditReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    receiptNo: string;
    amount: number;
    paymentDate: string | Date;
    paymentMethod?: string;
    paymentType?: string;
    member?: {
      fullName: string;
      memberId: string;
    };
  } | null;
  onSuccess?: () => void;
}

export function EditReceiptModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: EditReceiptModalProps) {
  const [receiptNo, setReceiptNo] = useState("");
  const [resequenceSubsequent, setResequenceSubsequent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && payment) {
      setReceiptNo(payment.receiptNo);
      setResequenceSubsequent(true);
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = receiptNo.trim();
    if (!trimmed) {
      setError("Receipt number cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await updateReceiptNumber({
        paymentId: payment.id,
        newReceiptNo: trimmed,
        resequenceSubsequent,
      });

      setLoading(false);

      if (res?.success) {
        setSuccessMessage(
          res.count && res.count > 1
            ? `Successfully updated ${res.count} receipts in chronological sequence!`
            : "Receipt number updated successfully!"
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 800);
      } else {
        setError(res?.error || "Failed to update receipt number");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Edit Receipt Number
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjust receipt ID and sequence numbering
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Payment Context Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Member:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {payment.member?.fullName || "Member"}{" "}
                <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                  ({payment.member?.memberId || "N/A"})
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Payment Date:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(payment.paymentDate)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {formatINR(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Current Receipt No:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                {payment.receiptNo}
              </span>
            </div>
          </div>

          {/* New Receipt Number Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Receipt Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value.toUpperCase())}
              placeholder="e.g. REC-261003-001"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              required
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Standard format is <span className="font-mono">REC-YYMMDD-XXX</span> (e.g. REC-261003-001).
            </p>
          </div>

          {/* Resequence Option */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={resequenceSubsequent}
                onChange={(e) => setResequenceSubsequent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  Auto-resequence all subsequent receipts
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                  Automatically updates all receipts recorded after this one consecutively so there are no numbering conflicts or gaps.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition active:scale-[0.99] flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Sequence...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Receipt Number</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

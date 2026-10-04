"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { deletePayment } from "@/lib/actions/payments";
import { formatINR, formatDateTime } from "@/lib/utils";

interface DeleteReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  payment: {
    id: string;
    receiptNo: string;
    amount: number;
    paymentDate?: string | Date;
    paymentMethod?: string;
    member?: {
      fullName: string;
      memberId: string;
    };
  } | null;
}

export function DeleteReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: DeleteReceiptModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    const res = await deletePayment(payment.id);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to delete receipt");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Receipt</h3>
              <p className="text-[11px] text-slate-400">Permanently delete payment record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <p className="text-slate-700 dark:text-slate-200 font-medium">
            Are you sure you want to delete this receipt? If this payment was added by mistake, deleting it will restore any pending due balance on the member&apos;s account.
          </p>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Receipt No:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {payment.receiptNo}
              </span>
            </div>
            {payment.member && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Member:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {payment.member.fullName} ({payment.member.memberId})
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Amount:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                {formatINR(payment.amount)}
              </span>
            </div>
            {payment.paymentDate && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Date:</span>
                <span className="text-slate-500 dark:text-slate-400">{formatDateTime(payment.paymentDate)}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Note: This action is permanent and cannot be undone.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

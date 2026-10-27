"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, User, IndianRupee, FileText, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";
import { addPayment, AddPaymentInput } from "@/lib/actions/payments";
import { PaymentMethod } from "@prisma/client";
import { formatINR, formatRS } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { sendReceiptWhatsAppAction } from "@/lib/actions/whatsapp-automation";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefillMemberId?: string;
  prefillMemberName?: string;
  prefillDueAmount?: number;
  membersList?: Array<{ id: string; fullName: string; memberId: string; dueAmount?: number }>;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  prefillMemberId,
  prefillMemberName,
  prefillDueAmount,
  membersList = [],
}: AddPaymentModalProps) {
  const { isSuperUser, isAdmin } = useAuth();
  const canSendWhatsApp = isSuperUser || isAdmin;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<any | null>(null);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  const [formData, setFormData] = useState<AddPaymentInput>({
    memberId: prefillMemberId || "",
    amount: prefillDueAmount || 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    paymentType: "DUE_CLEARANCE",
    notes: "",
  });

  useEffect(() => {
    if (prefillMemberId) {
      setFormData((prev) => ({
        ...prev,
        memberId: prefillMemberId,
        amount: prefillDueAmount || prev.amount,
      }));
    }
  }, [prefillMemberId, prefillDueAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId) {
      setError("Please select a member");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError("Please enter an amount greater than Rs. 0");
      return;
    }
    if (formData.paymentType === "OTHER" && !formData.notes?.trim()) {
      setError("Please specify the item or reason for Other payment (e.g. Diet Plan, Locker)");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await addPayment(formData);
    setLoading(false);

    if (res.success && res.payment) {
      setSuccessReceipt(res.payment.receiptNo);
      setCreatedPayment(res.payment);
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || "Failed to record payment");
    }
  };

  const handleSendWhatsAppReceipt = async () => {
    if (!createdPayment?.id) return;
    setSendingWa(true);
    try {
      const res = await sendReceiptWhatsAppAction(createdPayment.id);
      if (res.success) {
        setWaSentSuccess(true);
      } else {
        alert(res.error || "Failed to send WhatsApp receipt.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSendingWa(false);
    }
  };

  const handleClose = () => {
    setSuccessReceipt(null);
    setCreatedPayment(null);
    setWaSentSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Minimal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-400">Collect fee, PT charge, or miscellaneous payment</p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successReceipt ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Payment Recorded Successfully</h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
              <p className="text-slate-400">Receipt Number:</p>
              <p className="font-mono font-bold text-slate-900">{successReceipt}</p>
              <p className="text-slate-400 pt-1">Amount: <span className="font-semibold text-slate-900">{formatRS(formData.amount)}</span></p>
              <p className="text-slate-400">Payment Mode: <span className="font-medium text-slate-700">{formData.paymentMethod}</span></p>
              {formData.paymentType === "OTHER" && formData.notes && (
                <p className="text-slate-400">Item / Note: <span className="font-semibold text-slate-900">{formData.notes}</span></p>
              )}
            </div>

            {/* Direct WhatsApp Receipt Button: Admin & SuperUser only */}
            {canSendWhatsApp && createdPayment && (
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                disabled={sendingWa || waSentSuccess}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs ${
                  waSentSuccess
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {sendingWa ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="w-3.5 h-3.5" />
                )}
                <span>
                  {waSentSuccess
                    ? "Receipt Sent on WhatsApp ✓"
                    : "Send WhatsApp Receipt to Member"}
                </span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Member <span className="text-red-500">*</span>
              </label>
              {prefillMemberName ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>{prefillMemberName}</span>
                  {prefillDueAmount !== undefined && (
                    <span className="text-xs text-rose-600 font-bold">
                      Pending: {formatRS(prefillDueAmount)}
                    </span>
                  )}
                </div>
              ) : (
                <select
                  value={formData.memberId}
                  onChange={(e) => {
                    const selected = membersList.find((m) => m.id === e.target.value);
                    setFormData({
                      ...formData,
                      memberId: e.target.value,
                      amount: selected?.dueAmount || formData.amount,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">-- Choose Member --</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberId}) {m.dueAmount ? `- Due: Rs. ${m.dueAmount}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="0"
                value={formData.amount === 0 ? "" : formData.amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, "");
                  setFormData({ ...formData, amount: raw === "" ? 0 : Number(raw) });
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Type</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                >
                  <option value="DUE_CLEARANCE">Due Clearance</option>
                  <option value="MEMBERSHIP_FEE">Gym Membership</option>
                  <option value="PERSONAL_TRAINING">Personal Training (PT)</option>
                  <option value="OTHER">Others (Diet / Locker / Misc)</option>
                </select>
              </div>
            </div>

            {formData.paymentType === "OTHER" && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <label className="block text-xs font-bold text-amber-900">
                  Item Description / Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dietitian Plan, Locker Rental, Supplement, etc."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-medium text-slate-900"
                />
                <p className="text-[10px] text-amber-700">
                  This description will appear as the line item on the customer receipt.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {formData.paymentType !== "OTHER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via UPI Txn ID..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {loading ? "Recording..." : "Collect & Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

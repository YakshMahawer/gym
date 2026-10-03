"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Dumbbell,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { addOrRenewMemberPT } from "@/lib/actions/pt";
import { STANDARD_PT_PLANS } from "@/lib/pt-constants";
import { formatINR, formatDate } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

interface AddPTModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    fullName: string;
    memberId: string;
    phone: string;
    representative?: string | null;
    activePT?: {
      id: string;
      planName: string;
      trainerName?: string | null;
      endDate: string | Date;
      totalSessions?: number | null;
      completedSessions?: number | null;
    } | null;
  };
  onSuccess?: () => void;
  onPrintReceipt?: (receipt: any) => void;
}

const TRAINER_OPTIONS = [
  "Coach Vikram",
  "Coach Rahul",
  "Coach Priya",
  "Coach Simran",
  "Coach Alex",
  "Head Coach Aman",
  "General Trainer",
  "Other / Custom",
];

const DEFAULT_FALLBACK_PLAN = {
  name: "1 Month PT (12 Sessions)",
  price: 6000,
  durationInDays: 30,
  sessions: 12,
  description: "12 One-on-one personal training sessions in 1 month",
};

const calculateExpiryDate = (startDateStr: string, days: number): string => {
  try {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      return end.toISOString().split("T")[0];
    }
    const end = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    return end.toISOString().split("T")[0];
  } catch {
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }
};

export function AddPTModal({
  isOpen,
  onClose,
  member,
  onSuccess,
  onPrintReceipt,
}: AddPTModalProps) {
  const isExistingOngoingPT =
    Boolean(member.activePT && new Date(member.activePT.endDate) > new Date());

  const initialPlan = STANDARD_PT_PLANS[0] || DEFAULT_FALLBACK_PLAN;

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [selectedTrainerOption, setSelectedTrainerOption] = useState<string>("Coach Vikram");
  const [customTrainerName, setCustomTrainerName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    calculateExpiryDate(new Date().toISOString().split("T")[0], initialPlan.durationInDays)
  );
  const [totalAmount, setTotalAmount] = useState(initialPlan.price);
  const [paidAmount, setPaidAmount] = useState(initialPlan.price);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const isOngoing = Boolean(
        member.activePT && new Date(member.activePT.endDate) > new Date()
      );
      const defaultStart = isOngoing
        ? new Date(member.activePT!.endDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const defaultPlan = STANDARD_PT_PLANS[0] || DEFAULT_FALLBACK_PLAN;
      setSelectedPlanIndex(0);
      setStartDate(defaultStart);
      setEndDate(calculateExpiryDate(defaultStart, defaultPlan.durationInDays));

      // Check if existing trainer matches pre-defined options
      const existingTrainer = member.activePT?.trainerName || member.representative || "Coach Vikram";
      if (TRAINER_OPTIONS.includes(existingTrainer)) {
        setSelectedTrainerOption(existingTrainer);
        setCustomTrainerName("");
      } else if (existingTrainer) {
        setSelectedTrainerOption("Other / Custom");
        setCustomTrainerName(existingTrainer);
      } else {
        setSelectedTrainerOption("Coach Vikram");
        setCustomTrainerName("");
      }

      setTotalAmount(defaultPlan.price);
      setPaidAmount(defaultPlan.price);
      setPaymentMethod("UPI");
      setNotes("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handlePlanChange = (index: number) => {
    setSelectedPlanIndex(index);
    const plan = STANDARD_PT_PLANS[index];
    if (plan) {
      setTotalAmount(plan.price);
      setPaidAmount(plan.price);
      setEndDate(calculateExpiryDate(startDate, plan.durationInDays));
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    const plan = STANDARD_PT_PLANS[selectedPlanIndex] || DEFAULT_FALLBACK_PLAN;
    setEndDate(calculateExpiryDate(newStartDate, plan.durationInDays));
  };

  const getEffectiveTrainerName = (): string => {
    if (selectedTrainerOption === "Other / Custom") {
      return customTrainerName.trim() || "General Trainer";
    }
    return selectedTrainerOption;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      setError("Package amount must be greater than 0");
      return;
    }
    if (!endDate) {
      setError("Please specify a valid expiry date");
      return;
    }

    const trainer = getEffectiveTrainerName();
    if (!trainer) {
      setError("Please select or specify a trainer");
      return;
    }

    setLoading(true);
    setError(null);

    const plan = STANDARD_PT_PLANS[selectedPlanIndex] || DEFAULT_FALLBACK_PLAN;
    const planName = plan.name;
    const sessions = plan.sessions || 12;

    try {
      const res = await addOrRenewMemberPT({
        memberId: member.id,
        planName,
        trainerName: trainer,
        totalSessions: sessions,
        startDate,
        endDate,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      setLoading(false);

      if (res?.success) {
        if (res.payment && onPrintReceipt) {
          onPrintReceipt({
            ...res.payment,
            member: {
              fullName: member.fullName,
              memberId: member.memberId,
              phone: member.phone,
            },
            ptSubscription: res.pt,
            planName: `PT: ${planName} (${trainer})`,
            startDate,
            endDate,
          });
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res?.error || "Failed to activate PT package");
      }
    } catch (err: any) {
      console.error("PT Activation error:", err);
      setLoading(false);
      setError(err?.message || "An unexpected error occurred while activating PT");
    }
  };

  const dueAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isExistingOngoingPT ? "Renew / Extend PT Package" : "Personal Training (PT) Add-on"}
              </h3>
              <p className="text-[11px] text-slate-500">
                For {member.fullName} <span className="font-mono text-slate-400">({member.memberId})</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isExistingOngoingPT && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px]">
                Active PT detected. Extension will automatically begin on {formatDate(member.activePT!.endDate)}.
              </span>
            </div>
          )}

          {/* Simple Dropdown for PT Package */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select PT Package
            </label>
            <select
              value={selectedPlanIndex}
              onChange={(e) => handlePlanChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {STANDARD_PT_PLANS.map((plan, idx) => (
                <option key={idx} value={idx}>
                  {plan.name} - ₹{plan.price.toLocaleString("en-IN")} ({plan.sessions} Sessions, {plan.durationInDays} days)
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Personal Trainer - Clean Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Personal Trainer
            </label>
            <select
              value={selectedTrainerOption}
              onChange={(e) => setSelectedTrainerOption(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {TRAINER_OPTIONS.map((trainer) => (
                <option key={trainer} value={trainer}>
                  {trainer}
                </option>
              ))}
            </select>

            {selectedTrainerOption === "Other / Custom" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customTrainerName}
                  onChange={(e) => setCustomTrainerName(e.target.value)}
                  placeholder="Enter Trainer's Full Name..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm"
                  required
                />
              </div>
            )}
          </div>

          {/* Start Date & Auto-Calculated Editable Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date <span className="text-slate-400 font-normal">(Editable)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm bg-white font-medium"
                required
              />
            </div>
          </div>

          {/* Fees & Payment Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Package Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTotalAmount(val);
                    if (paidAmount > val) setPaidAmount(val);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paid Today (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm font-bold text-emerald-700"
                  required
                />
              </div>
            </div>

            {dueAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                <span className="font-medium">Pending Balance:</span>
                <span className="font-bold">{formatINR(dueAmount)}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional remark..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition active:scale-[0.99] flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? "Activating PT..." : "Activate PT Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

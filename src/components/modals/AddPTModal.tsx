"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Dumbbell,
  UserCheck,
  Calendar,
  IndianRupee,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { addOrRenewMemberPT, STANDARD_PT_PLANS } from "@/lib/actions/pt";
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

const TRAINER_SUGGESTIONS = [
  "Coach Vikram",
  "Coach Rahul",
  "Coach Priya",
  "Coach Simran",
  "Coach Alex",
  "Head Coach Aman",
];

export function AddPTModal({
  isOpen,
  onClose,
  member,
  onSuccess,
  onPrintReceipt,
}: AddPTModalProps) {
  const isExistingOngoingPT =
    member.activePT && new Date(member.activePT.endDate) > new Date();

  // Smart extension start date: If member already has ongoing PT, start new package when current one ends!
  const defaultCalculatedStartDate = isExistingOngoingPT
    ? new Date(member.activePT!.endDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [customPlanName, setCustomPlanName] = useState("");
  const [isCustomPlan, setIsCustomPlan] = useState(false);

  const initialPlan = STANDARD_PT_PLANS[0];

  const [trainerName, setTrainerName] = useState(
    member.activePT?.trainerName || member.representative || "Coach Vikram"
  );
  const [totalSessions, setTotalSessions] = useState(initialPlan.sessions);
  const [startDate, setStartDate] = useState(defaultCalculatedStartDate);
  const [durationInDays, setDurationInDays] = useState(initialPlan.durationInDays);
  const [totalAmount, setTotalAmount] = useState(initialPlan.price);
  const [paidAmount, setPaidAmount] = useState(initialPlan.price);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPayment, setCreatedPayment] = useState<any | null>(null);

  // Auto calculate endDate from startDate + durationInDays
  const calculatedEndDate = new Date(
    new Date(startDate).getTime() + durationInDays * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    if (isOpen) {
      const isOngoing = member.activePT && new Date(member.activePT.endDate) > new Date();
      const defaultStart = isOngoing
        ? new Date(member.activePT!.endDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      setStartDate(defaultStart);
      setTrainerName(member.activePT?.trainerName || member.representative || "Coach Vikram");
      setSelectedPlanIndex(0);
      setIsCustomPlan(false);
      setTotalSessions(STANDARD_PT_PLANS[0].sessions);
      setDurationInDays(STANDARD_PT_PLANS[0].durationInDays);
      setTotalAmount(STANDARD_PT_PLANS[0].price);
      setPaidAmount(STANDARD_PT_PLANS[0].price);
      setPaymentMethod("UPI");
      setNotes("");
      setError(null);
      setCreatedPayment(null);
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handlePlanSelect = (index: number) => {
    setSelectedPlanIndex(index);
    setIsCustomPlan(false);
    const plan = STANDARD_PT_PLANS[index];
    if (plan) {
      setTotalSessions(plan.sessions);
      setDurationInDays(plan.durationInDays);
      setTotalAmount(plan.price);
      setPaidAmount(plan.price);
    }
  };

  const handleCustomPlanToggle = () => {
    setIsCustomPlan(true);
    setCustomPlanName("Custom PT Package");
    setTotalSessions(12);
    setDurationInDays(30);
    setTotalAmount(6000);
    setPaidAmount(6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      setError("Package amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError(null);

    const planName = isCustomPlan
      ? customPlanName.trim() || "Custom PT Package"
      : STANDARD_PT_PLANS[selectedPlanIndex]?.name || "Personal Training";

    const res = await addOrRenewMemberPT({
      memberId: member.id,
      planName,
      trainerName: trainerName.trim() || "General Trainer",
      totalSessions: Number(totalSessions) || 12,
      startDate,
      endDate: calculatedEndDate,
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      if (res.payment) {
        setCreatedPayment({
          ...res.payment,
          member: {
            fullName: member.fullName,
            memberId: member.memberId,
            phone: member.phone,
          },
          ptSubscription: res.pt,
          planName: `PT: ${planName} (${trainerName})`,
          startDate,
          endDate: calculatedEndDate,
        });
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || "Failed to add PT add-on");
    }
  };

  const handleClose = () => {
    setCreatedPayment(null);
    setError(null);
    onClose();
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
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View with Receipt Action */}
        {createdPayment ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                PT Package Activated Successfully!
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Receipt and ledger transaction generated.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-slate-900">{createdPayment.receiptNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trainer Assigned:</span>
                <span className="font-semibold text-slate-800">{trainerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sessions:</span>
                <span className="font-semibold text-slate-800">{totalSessions} Sessions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Validity:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(startDate)} to {formatDate(calculatedEndDate)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Amount Paid:</span>
                <span className="font-bold text-emerald-700 text-sm">{formatINR(paidAmount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onPrintReceipt) onPrintReceipt(createdPayment);
                  handleClose();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print PT Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
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
                  Active PT detected. New package automatically starts on {formatDate(member.activePT!.endDate)}.
                </span>
              </div>
            )}

            {/* Step 1: Select PT Package */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Select PT Package</span>
                <button
                  type="button"
                  onClick={handleCustomPlanToggle}
                  className={`text-[11px] font-semibold underline ${
                    isCustomPlan ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {isCustomPlan ? "Using Custom Package" : "+ Custom Package"}
                </button>
              </label>

              {!isCustomPlan ? (
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {STANDARD_PT_PLANS.map((plan, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePlanSelect(idx)}
                      className={`p-2.5 rounded-lg text-left border transition ${
                        selectedPlanIndex === idx
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold text-[11px] truncate">{plan.name}</div>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className={selectedPlanIndex === idx ? "text-indigo-100" : "text-slate-500"}>
                          {plan.sessions} Sessions
                        </span>
                        <span className="font-bold">{formatINR(plan.price)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                      Custom Package Name
                    </label>
                    <input
                      type="text"
                      value={customPlanName}
                      onChange={(e) => setCustomPlanName(e.target.value)}
                      placeholder="e.g. 1 Month PT (15 Sessions)"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Assigned Trainer & Sessions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Assigned Personal Trainer
                </label>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="Enter Trainer Name..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                    required
                  />
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    {TRAINER_SUGGESTIONS.slice(0, 3).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTrainerName(t)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] whitespace-nowrap"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Total PT Sessions
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  required
                />
              </div>
            </div>

            {/* Step 3: Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Expiry Date ({durationInDays} days)
                </label>
                <input
                  type="date"
                  value={calculatedEndDate}
                  readOnly
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Step 4: Fees & Payment */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
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
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Amount Paid Today (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-bold text-emerald-700"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card / POS</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional remark..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition active:scale-[0.99] flex items-center gap-1.5"
              >
                {loading ? "Activating PT..." : "Activate PT Package"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

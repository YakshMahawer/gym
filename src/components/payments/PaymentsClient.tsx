"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  Search,
  IndianRupee,
  Calendar,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { EditReceiptModal } from "@/components/modals/EditReceiptModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { resequenceAllReceipts } from "@/lib/actions/payments";

interface PaymentsClientProps {
  payments: any[];
  dueSubscriptions: any[];
  allMembers: Array<{ id: string; fullName: string; memberId: string; dueAmount?: number }>;
}

export function PaymentsClient({ payments, dueSubscriptions, allMembers }: PaymentsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"history" | "dues">("history");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [resequencing, setResequencing] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingDue = dueSubscriptions.reduce((acc, s) => acc + s.dueAmount, 0);

  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.receiptNo.toLowerCase().includes(q) ||
      p.member.fullName.toLowerCase().includes(q) ||
      p.member.phone.includes(q) ||
      p.member.memberId.toLowerCase().includes(q);

    const matchesMethod = methodFilter === "ALL" ? true : p.paymentMethod === methodFilter;
    const matchesType =
      typeFilter === "ALL"
        ? true
        : typeFilter === "PERSONAL_TRAINING"
        ? p.paymentType === "PERSONAL_TRAINING" || Boolean(p.ptSubscription)
        : typeFilter === "MEMBERSHIP_FEE"
        ? p.paymentType === "MEMBERSHIP_FEE"
        : typeFilter === "DUE_CLEARANCE"
        ? p.paymentType === "DUE_CLEARANCE"
        : true;

    return matchesSearch && matchesMethod && matchesType;
  });

  const handleResequenceAll = async () => {
    if (
      confirm(
        "Are you sure you want to re-sequence ALL receipts in chronological order? This will assign consecutive REC-YYMMDD-XXX numbers to all payment records."
      )
    ) {
      setResequencing(true);
      const res = await resequenceAllReceipts();
      setResequencing(false);
      if (res.success) {
        alert(`Successfully resequenced ${res.count} receipts in chronological order!`);
        router.refresh();
      } else {
        alert(res.error || "Failed to resequence receipts");
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Payments & Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential receipt numbering, member fees, PT payments, and printable tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResequenceAll}
            disabled={resequencing || payments.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-lg text-xs transition active:bg-slate-100 disabled:opacity-50"
            title="Clean and re-order all receipts in sequential date order"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${resequencing ? "animate-spin" : ""}`} />
            <span>{resequencing ? "Resequencing..." : "Auto-Resequence All"}</span>
          </button>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition active:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Total Revenue Collected
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{formatINR(totalCollected)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Across {payments.length} transactions
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">
              Total Outstanding Dues
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1">{formatINR(totalPendingDue)}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pending across {dueSubscriptions.length} items
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between p-2 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Payment History ({payments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("dues")}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "dues"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Dues ({dueSubscriptions.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Payment History */}
        {activeTab === "history" && (
          <div className="p-3.5 sm:p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt no, member, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ALL">All Payment Types</option>
                  <option value="MEMBERSHIP_FEE">Membership Fee</option>
                  <option value="PERSONAL_TRAINING">Personal Training (PT)</option>
                  <option value="DUE_CLEARANCE">Due Clearance</option>
                </select>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-10 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No payment records found.</p>
              </div>
            ) : (
              <>
                {/* Mobile Transactions Cards (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {filteredPayments.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/members/${pm.member.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 block"
                          >
                            {pm.member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {pm.member.memberId} • {pm.member.phone}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">
                          {formatINR(pm.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">{pm.receiptNo}</span>
                          <button
                            onClick={() => setEditingPayment(pm)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                            title="Edit Receipt Number"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <span>{formatDateTime(pm.paymentDate)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {pm.paymentMethod}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                              ? "🎯 PT Add-on"
                              : pm.paymentType?.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingPayment(pm)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit No</span>
                          </button>
                          <button
                            onClick={() => setSelectedReceipt(pm)}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 active:bg-slate-100"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-4">Receipt Number</th>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Payment Date</th>
                        <th className="py-2.5 px-4">Mode</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPayments.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-50/60 transition group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {pm.receiptNo}
                              </span>
                              <button
                                onClick={() => setEditingPayment(pm)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded transition"
                                title="Edit Receipt Number & Resequence"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/members/${pm.member.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 block"
                            >
                              {pm.member.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              {pm.member.memberId} • {pm.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatDateTime(pm.paymentDate)}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {pm.paymentMethod}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                                pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                                ? "🎯 PT Add-on"
                                : pm.paymentType?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            {formatINR(pm.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingPayment(pm)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs font-medium inline-flex items-center gap-1 transition"
                                title="Edit Receipt Number"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit No</span>
                              </button>
                              <button
                                onClick={() => setSelectedReceipt(pm)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                              >
                                <Printer className="w-3 h-3 text-amber-400" />
                                <span>Receipt</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Outstanding Dues */}
        {activeTab === "dues" && (
          <div className="p-3.5 sm:p-5 space-y-3">
            {dueSubscriptions.length === 0 ? (
              <div className="p-10 text-center bg-slate-50/50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Pending Dues</p>
                <p className="text-[11px] text-slate-400">All member accounts are clear.</p>
              </div>
            ) : (
              <>
                {/* Mobile Dues Cards (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {dueSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/members/${sub.member.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 block"
                          >
                            {sub.member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {sub.member.memberId} • {sub.member.phone}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-rose-600">
                          Due: {formatINR(sub.dueAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Plan: <strong className="font-semibold text-slate-700">{sub.planName}</strong></span>
                        <span>Paid: {formatINR(sub.paidAmount)} / {formatINR(sub.totalAmount)}</span>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <Link
                          href={`/members/${sub.member.id}`}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center shadow-xs active:bg-slate-800"
                        >
                          Collect Due
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Plan</th>
                        <th className="py-2.5 px-4">Total</th>
                        <th className="py-2.5 px-4">Paid</th>
                        <th className="py-2.5 px-4">Pending Due</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {dueSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <Link
                              href={`/members/${sub.member.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 block"
                            >
                              {sub.member.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              {sub.member.memberId} • {sub.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{sub.planName}</td>
                          <td className="py-3 px-4 text-slate-600">{formatINR(sub.totalAmount)}</td>
                          <td className="py-3 px-4 text-emerald-700 font-medium">
                            {formatINR(sub.paidAmount)}
                          </td>
                          <td className="py-3 px-4 font-bold text-rose-600">
                            {formatINR(sub.dueAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/members/${sub.member.id}`}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition"
                            >
                              Collect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Payment */}
      <AddPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        membersList={allMembers}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Modal: Edit Receipt Number & Resequencing */}
      {editingPayment && (
        <EditReceiptModal
          isOpen={Boolean(editingPayment)}
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Modal: View / Print Receipt */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onEditReceipt={() => {
            const current = selectedReceipt;
            setSelectedReceipt(null);
            setEditingPayment(current);
          }}
        />
      )}
    </div>
  );
}

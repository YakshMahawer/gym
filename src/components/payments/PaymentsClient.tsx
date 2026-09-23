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
} from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";

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

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingDue = dueSubscriptions.reduce((acc, s) => acc + s.dueAmount, 0);

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.receiptNo.toLowerCase().includes(q) ||
      p.member.fullName.toLowerCase().includes(q) ||
      p.member.phone.includes(q) ||
      p.member.memberId.toLowerCase().includes(q);

    const matchesMethod = methodFilter === "ALL" ? true : p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Payments & Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect member fees, clear pending balances, and access receipts.
          </p>
        </div>

        <button
          onClick={() => setPaymentModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-sm transition active:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Payment</span>
        </button>
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
              Pending across {dueSubscriptions.length} subscriptions
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
          <div className="p-3.5 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search receipt #, member name, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-10 text-center bg-slate-50/50 rounded-lg">
                <p className="text-xs text-slate-400">No Transactions Found</p>
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
                        <span className="font-mono font-semibold text-slate-700">{pm.receiptNo}</span>
                        <span>{formatDateTime(pm.paymentDate)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {pm.paymentMethod} • {pm.paymentType?.replace("_", " ")}
                        </span>

                        <button
                          onClick={() => setSelectedReceipt(pm)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 active:bg-slate-100"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-4">Receipt</th>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Mode</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPayments.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {pm.receiptNo}
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
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 block">{pm.paymentMethod}</span>
                            <span className="text-[10px] text-slate-400">
                              {pm.paymentType?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            {formatINR(pm.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedReceipt(pm)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium inline-flex items-center gap-1 transition"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
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

      {/* Modal: View / Print Receipt */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

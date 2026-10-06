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
  Trash2,
  RefreshCw,
  Sparkles,
  Download,
  Filter,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { EditPaymentDateModal } from "@/components/modals/EditPaymentDateModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { DeleteReceiptModal } from "@/components/modals/DeleteReceiptModal";
import { exportToExcel } from "@/lib/export-excel";
import { useAuth } from "@/components/providers/AuthProvider";

interface PaymentsClientProps {
  payments: any[];
  dueSubscriptions: any[];
  allMembers: Array<{ id: string; fullName: string; memberId: string; dueAmount?: number }>;
}

export function PaymentsClient({ payments, dueSubscriptions, allMembers }: PaymentsClientProps) {
  const router = useRouter();
  const { canEdit, canDelete } = useAuth();
  const [activeTab, setActiveTab] = useState<"history" | "dues">("history");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [timeframeFilter, setTimeframeFilter] = useState<"ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH">("ALL");
  const [sortOrder, setSortOrder] = useState<"REC_DESC" | "REC_ASC" | "DATE_DESC" | "DATE_ASC" | "AMOUNT_DESC" | "AMOUNT_ASC">("REC_DESC");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<any | null>(null);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingDue = dueSubscriptions.reduce((acc, s) => acc + s.dueAmount, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
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

    let matchesTimeframe = true;
    if (timeframeFilter !== "ALL") {
      const pDate = new Date(p.paymentDate);
      if (timeframeFilter === "TODAY") {
        matchesTimeframe = pDate >= startOfToday;
      } else if (timeframeFilter === "THIS_WEEK") {
        matchesTimeframe = pDate >= startOfWeek;
      } else if (timeframeFilter === "THIS_MONTH") {
        matchesTimeframe = pDate >= startOfMonth;
      } else if (timeframeFilter === "LAST_MONTH") {
        matchesTimeframe = pDate >= startOfLastMonth && pDate <= endOfLastMonth;
      }
    }

    return matchesSearch && matchesMethod && matchesType && matchesTimeframe;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortOrder === "REC_DESC") {
      return b.receiptNo.localeCompare(a.receiptNo, undefined, { numeric: true, sensitivity: "base" });
    }
    if (sortOrder === "REC_ASC") {
      return a.receiptNo.localeCompare(b.receiptNo, undefined, { numeric: true, sensitivity: "base" });
    }
    if (sortOrder === "AMOUNT_DESC") {
      return b.amount - a.amount;
    }
    if (sortOrder === "AMOUNT_ASC") {
      return a.amount - b.amount;
    }
    if (sortOrder === "DATE_DESC") {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    }
    if (sortOrder === "DATE_ASC") {
      return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    }
    return 0;
  });

  const filteredTotalAmount = sortedPayments.reduce((acc, p) => acc + p.amount, 0);

  const activeFiltersCount =
    (methodFilter !== "ALL" ? 1 : 0) +
    (typeFilter !== "ALL" ? 1 : 0) +
    (timeframeFilter !== "ALL" ? 1 : 0) +
    (search.trim() !== "" ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setMethodFilter("ALL");
    setTypeFilter("ALL");
    setTimeframeFilter("ALL");
    setSortOrder("REC_DESC");
  };

  const handleExportPayments = () => {
    exportToExcel({
      data: sortedPayments,
      fileName: "Gym_Payment_Transactions",
      sheetName: "Payments",
      columns: [
        { header: "Receipt No", accessor: (p) => p.receiptNo },
        { header: "Member ID", accessor: (p) => p.member?.memberId || "" },
        { header: "Member Name", accessor: (p) => p.member?.fullName || "" },
        { header: "Mobile", accessor: (p) => p.member?.phone || "" },
        { header: "Payment Date", accessor: (p) => formatDateTime(p.paymentDate) },
        { header: "Amount (₹)", accessor: (p) => p.amount },
        { header: "Payment Mode", accessor: (p) => p.paymentMethod },
        {
          header: "Payment Type",
          accessor: (p) =>
            p.paymentType === "PERSONAL_TRAINING" || p.ptSubscription
              ? "Personal Training (PT)"
              : p.paymentType?.replace(/_/g, " ") || "Membership Fee",
        },
        { header: "Plan", accessor: (p) => p.subscription?.planName || p.ptSubscription?.planName || "" },
        { header: "Notes", accessor: (p) => p.notes || "" },
      ],
    });
  };

  const handleExportDues = () => {
    exportToExcel({
      data: dueSubscriptions,
      fileName: "Gym_Outstanding_Dues",
      sheetName: "Pending Dues",
      columns: [
        { header: "Member ID", accessor: (s) => s.member?.memberId || "" },
        { header: "Member Name", accessor: (s) => s.member?.fullName || "" },
        { header: "Mobile", accessor: (s) => s.member?.phone || "" },
        { header: "Plan Name", accessor: (s) => s.planName || "" },
        { header: "Total Amount (₹)", accessor: (s) => s.totalAmount },
        { header: "Paid Amount (₹)", accessor: (s) => s.paidAmount },
        { header: "Pending Due (₹)", accessor: (s) => s.dueAmount },
        { header: "Start Date", accessor: (s) => (s.startDate ? formatDate(s.startDate) : "") },
        { header: "End Date", accessor: (s) => (s.endDate ? formatDate(s.endDate) : "") },
      ],
    });
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
            {/* Dedicated Dropdown Filter Section */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/90 space-y-3.5">
              {/* Search Bar & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search receipt no, member name, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <span className="text-xs font-medium text-slate-500">
                    Showing <strong className="font-bold text-slate-900">{sortedPayments.length}</strong> of {payments.length} (
                    <span className="text-emerald-700 font-bold">{formatINR(filteredTotalAmount)}</span>)
                  </span>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    onClick={handleExportPayments}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition active:bg-slate-200"
                    title="Download filtered payment records as Excel (.xlsx)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Filter Dropdowns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60">
                {/* 1. Payment Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Mode
                  </label>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
                  >
                    <option value="ALL">All Payment Modes</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card / POS</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                {/* 2. Payment Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Category
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
                  >
                    <option value="ALL">All Payment Types</option>
                    <option value="MEMBERSHIP_FEE">Membership Fee</option>
                    <option value="PERSONAL_TRAINING">Personal Training (PT)</option>
                    <option value="DUE_CLEARANCE">Due Clearance</option>
                  </select>
                </div>

                {/* 3. Timeframe */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Timeframe
                  </label>
                  <select
                    value={timeframeFilter}
                    onChange={(e) => setTimeframeFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="THIS_WEEK">This Week (Last 7 Days)</option>
                    <option value="THIS_MONTH">This Month</option>
                    <option value="LAST_MONTH">Last Month</option>
                  </select>
                </div>

                {/* 4. Sort By */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sort By
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
                  >
                    <option value="REC_DESC">Receipt: Newest First</option>
                    <option value="REC_ASC">Receipt: Oldest First</option>
                    <option value="DATE_DESC">Date: Newest First</option>
                    <option value="DATE_ASC">Date: Oldest First</option>
                    <option value="AMOUNT_DESC">Amount: Highest First</option>
                    <option value="AMOUNT_ASC">Amount: Lowest First</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Tags */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    Active:
                  </span>

                  {methodFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                      Mode: {methodFilter}
                      <button onClick={() => setMethodFilter("ALL")} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {typeFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                      Type: {typeFilter.replace(/_/g, " ")}
                      <button onClick={() => setTypeFilter("ALL")} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {timeframeFilter !== "ALL" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md text-[11px] font-medium border border-indigo-200">
                      Timeframe: {timeframeFilter.replace(/_/g, " ")}
                      <button onClick={() => setTimeframeFilter("ALL")} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {search.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                      Search: &quot;{search}&quot;
                      <button onClick={() => setSearch("")} className="hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {sortedPayments.length === 0 ? (
              <div className="p-10 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No payment records found.</p>
              </div>
            ) : (
              <>
                {/* Mobile Transactions Cards (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {sortedPayments.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/portal/members/${pm.member.id}`}
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

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{pm.receiptNo}</span>
                        <div className="flex items-center gap-1.5">
                          <span>{formatDateTime(pm.paymentDate)}</span>
                          <button
                            onClick={() => setEditingPayment(pm)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Edit Payment Date"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
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

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(pm)}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 active:bg-slate-100"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />
                            <span>Receipt</span>
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => setDeletingPayment(pm)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Delete Receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                        <th className="py-2.5 px-4">Receipt Number</th>
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Payment Date</th>
                        <th className="py-2.5 px-4">Mode</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {sortedPayments.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition group">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {pm.receiptNo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/portal/members/${pm.member.id}`}
                              className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block"
                            >
                              {pm.member.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              {pm.member.memberId} • {pm.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 group/date">
                              <span>{formatDateTime(pm.paymentDate)}</span>
                              {canEdit && (
                                <button
                                  onClick={() => setEditingPayment(pm)}
                                  className="opacity-0 group-hover/date:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition"
                                  title="Edit Payment Date"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {pm.paymentMethod}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                                pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {pm.paymentType === "PERSONAL_TRAINING" || pm.ptSubscription
                                ? "🎯 PT Add-on"
                                : pm.paymentType?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                            {formatINR(pm.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedReceipt(pm)}
                                className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                              >
                                <Printer className="w-3 h-3 text-amber-400" />
                                <span>Receipt</span>
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => setDeletingPayment(pm)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                                  title="Delete Receipt"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Showing <strong className="text-slate-900">{dueSubscriptions.length}</strong> items with pending dues
                  </span>
                  <button
                    onClick={handleExportDues}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition active:bg-slate-200"
                    title="Download outstanding dues as Excel (.xlsx) with auto-filters"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Export Excel</span>
                  </button>
                </div>
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
                            href={`/portal/members/${sub.member.id}`}
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
                          href={`/portal/members/${sub.member.id}`}
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
                              href={`/portal/members/${sub.member.id}`}
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
                              href={`/portal/members/${sub.member.id}`}
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

      {/* Modal: Edit Payment Date & Resequencing */}
      {editingPayment && (
        <EditPaymentDateModal
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
          onEditPaymentDate={() => {
            const current = selectedReceipt;
            setSelectedReceipt(null);
            setEditingPayment(current);
          }}
        />
      )}

      {/* Modal: Delete Receipt Confirmation */}
      {deletingPayment && (
        <DeleteReceiptModal
          isOpen={Boolean(deletingPayment)}
          payment={deletingPayment}
          onClose={() => setDeletingPayment(null)}
          onSuccess={() => {
            setDeletingPayment(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

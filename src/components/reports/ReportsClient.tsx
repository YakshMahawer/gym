"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Sparkles,
  Trophy,
  Dumbbell,
  Target,
  Search,
  CheckCircle2,
  Tag,
  Download,
  Printer,
  FileSpreadsheet,
  Receipt,
  Filter,
  UserCheck,
  Layers,
  Award,
} from "lucide-react";
import { formatRS, formatDate, formatDateTime } from "@/lib/utils";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { exportToExcel } from "@/lib/export-excel";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  count: number;
  revenue: number;
  category?: "General" | "Personal Training" | "Special Offer";
}

interface TransactionItem {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  paymentDate: string | Date;
  amount: number;
  paymentMethod: string;
  paymentType?: string;
  notes?: string | null;
  planName: string;
  startDate?: string | Date;
  endDate?: string | Date | null;
  member: {
    id: string;
    memberId: string;
    fullName: string;
    phone: string;
    email?: string | null;
  };
}

interface ReportsClientProps {
  data: {
    monthlyRevenue: Array<{ month: string; amount: number; count: number }>;
    plansDistribution: PlanItem[];
    ptPackagesDistribution?: Array<{
      name: string;
      count: number;
      activeCount: number;
      revenue: number;
      sessions: number;
    }>;
    ptTrainerDistribution?: Array<{
      trainer: string;
      clientCount: number;
      activeClients: number;
      totalSessions: number;
      completedSessions: number;
      revenue: number;
    }>;
    ptSummary?: {
      totalClients: number;
      activeClients: number;
      totalRevenue: number;
      completedSessions: number;
    };
    otherCollections?: {
      totalRevenue: number;
      count: number;
      items: Array<{
        id: string;
        receiptNo: string;
        invoiceNo: string;
        paymentDate: Date | string;
        amount: number;
        paymentMethod: string;
        notes: string;
        memberName: string;
        memberId: string;
        phone: string;
      }>;
    };
    collectionsLedger?: TransactionItem[];
    taxLedger?: TransactionItem[];
    enquiryStats: { total: number; converted: number; rate: number };
    paymentMethods: Array<{ method: string; amount: number; count: number }>;
    memberStats: { active: number; expired: number; frozen: number; total: number };
  };
}

export function ReportsClient({ data }: ReportsClientProps) {
  const [activeReportTab, setActiveReportTab] = useState<"ledger" | "packages" | "others" | "overview">("ledger");

  // Package view states
  const [categoryFilter, setCategoryFilter] = useState<"ACTIVE" | "ALL" | "General" | "Special Offer">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  // Ledger Report filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerMethodFilter, setLedgerMethodFilter] = useState("ALL");
  const [ledgerDatePreset, setLedgerDatePreset] = useState<"all" | "this_month" | "last_month" | "this_quarter" | "custom">("all");
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");

  // Other Payments search
  const [otherSearch, setOtherSearch] = useState("");

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const maxMonthlyRevenue = Math.max(...data.monthlyRevenue.map((m) => m.amount), 1);
  const totalRevenueAll = data.paymentMethods.reduce((sum, p) => sum + p.amount, 0);
  const totalSubscriptionsSold = data.plansDistribution.reduce((acc, p) => acc + p.count, 0);

  // Filter package distribution
  const filteredPlans = data.plansDistribution.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.price.toString().includes(searchQuery);

    if (!matchesSearch) return false;
    if (categoryFilter === "ACTIVE") return plan.count > 0;
    if (categoryFilter === "ALL") return true;
    return plan.category === categoryFilter;
  });

  // Filter Collections Ledger (zero tax division, pure amount)
  const collectionsLedger = data.collectionsLedger || data.taxLedger || [];
  const filteredLedger = collectionsLedger.filter((item) => {
    const q = ledgerSearch.toLowerCase();
    const matchesSearch =
      item.invoiceNo.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q) ||
      item.member.fullName.toLowerCase().includes(q) ||
      item.member.memberId.toLowerCase().includes(q) ||
      item.member.phone.includes(q) ||
      item.planName.toLowerCase().includes(q);

    const matchesMethod = ledgerMethodFilter === "ALL" ? true : item.paymentMethod === ledgerMethodFilter;

    let matchesDate = true;
    const itemDate = new Date(item.paymentDate);
    const now = new Date();

    if (ledgerDatePreset === "this_month") {
      matchesDate =
        itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (ledgerDatePreset === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      matchesDate =
        itemDate.getMonth() === lastMonth.getMonth() &&
        itemDate.getFullYear() === lastMonth.getFullYear();
    } else if (ledgerDatePreset === "this_quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(itemDate.getMonth() / 3);
      matchesDate = currentQuarter === itemQuarter && itemDate.getFullYear() === now.getFullYear();
    } else if (ledgerDatePreset === "custom") {
      if (ledgerStartDate) {
        matchesDate = matchesDate && itemDate >= new Date(ledgerStartDate);
      }
      if (ledgerEndDate) {
        const endD = new Date(ledgerEndDate);
        endD.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= endD;
      }
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  // Aggregated Totals for filtered records
  const sumGrossAmount = filteredLedger.reduce((sum, item) => sum + item.amount, 0);
  const sumUpi = filteredLedger.filter((i) => i.paymentMethod === "UPI").reduce((sum, i) => sum + i.amount, 0);
  const sumCash = filteredLedger.filter((i) => i.paymentMethod === "CASH").reduce((sum, i) => sum + i.amount, 0);
  const sumCard = filteredLedger.filter((i) => i.paymentMethod === "CARD").reduce((sum, i) => sum + i.amount, 0);
  const sumOtherModes = sumGrossAmount - (sumUpi + sumCash + sumCard);

  // Other Collections items
  const otherItems = (data.otherCollections?.items || []).filter((item) => {
    const q = otherSearch.toLowerCase();
    return (
      item.memberName.toLowerCase().includes(q) ||
      item.memberId.toLowerCase().includes(q) ||
      item.phone.includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q)
    );
  });

  // Download Excel Export handlers
  const handleExportLedgerExcel = () => {
    exportToExcel({
      data: filteredLedger,
      fileName: "Concept1Gym_Collections_Ledger",
      sheetName: "Collections Ledger",
      columns: [
        { header: "Receipt Number", accessor: (t) => t.receiptNo },
        { header: "Invoice Number", accessor: (t) => t.invoiceNo },
        { header: "Payment Date", accessor: (t) => formatDate(t.paymentDate) },
        { header: "Member ID", accessor: (t) => t.member.memberId },
        { header: "Member Name", accessor: (t) => t.member.fullName },
        { header: "Phone", accessor: (t) => t.member.phone },
        { header: "Package / Purpose", accessor: (t) => t.planName },
        { header: "Payment Mode", accessor: (t) => t.paymentMethod },
        { header: "Amount Paid (Rs.)", accessor: (t) => t.amount },
        { header: "Remarks / Notes", accessor: (t) => t.notes || "" },
      ],
    });
  };

  const handleExportPackagesExcel = () => {
    exportToExcel({
      data: filteredPlans,
      fileName: "Concept1Gym_Packages_Analytics",
      sheetName: "Gym Packages",
      columns: [
        { header: "Package / Plan Name", accessor: (p) => p.name },
        { header: "Category", accessor: (p) => p.category || "General" },
        { header: "Price (Rs.)", accessor: (p) => p.price },
        { header: "Duration (Days)", accessor: (p) => p.durationInDays },
        { header: "Subscriptions Sold", accessor: (p) => p.count },
        { header: "Total Revenue (Rs.)", accessor: (p) => p.revenue },
      ],
    });
  };

  const handleExportPTExcel = () => {
    const ptTrainers = data.ptTrainerDistribution || [];
    exportToExcel({
      data: ptTrainers,
      fileName: "Concept1Gym_PT_Trainer_Performance",
      sheetName: "PT Trainers",
      columns: [
        { header: "Personal Trainer", accessor: (t) => t.trainer },
        { header: "Total Clients", accessor: (t) => t.clientCount },
        { header: "Active Clients", accessor: (t) => t.activeClients },
        { header: "Total Sessions", accessor: (t) => t.totalSessions },
        { header: "Completed Sessions", accessor: (t) => t.completedSessions },
        { header: "Total Revenue Generated (Rs.)", accessor: (t) => t.revenue },
      ],
    });
  };

  const handleExportOthersExcel = () => {
    exportToExcel({
      data: otherItems,
      fileName: "Concept1Gym_Other_Collections",
      sheetName: "Other Payments",
      columns: [
        { header: "Receipt Number", accessor: (t) => t.receiptNo },
        { header: "Invoice Number", accessor: (t) => t.invoiceNo },
        { header: "Payment Date", accessor: (t) => formatDate(t.paymentDate) },
        { header: "Member ID", accessor: (t) => t.memberId },
        { header: "Member Name", accessor: (t) => t.memberName },
        { header: "Phone", accessor: (t) => t.phone },
        { header: "Item Description / Purpose", accessor: (t) => t.notes },
        { header: "Payment Mode", accessor: (t) => t.paymentMethod },
        { header: "Amount Paid (Rs.)", accessor: (t) => t.amount },
      ],
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete collections ledger, PT packages breakdown, other payments, and trends.
          </p>
        </div>

        {/* Top Report Tab Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-center">
          <button
            onClick={() => setActiveReportTab("ledger")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "ledger"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Ledger</span>
          </button>

          <button
            onClick={() => setActiveReportTab("packages")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "packages"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Packages & PT</span>
          </button>

          <button
            onClick={() => setActiveReportTab("others")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "others"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Other Fees</span>
          </button>

          <button
            onClick={() => setActiveReportTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "overview"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Trends</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COLLECTIONS LEDGER (NO TAX DIVISION) */}
      {activeReportTab === "ledger" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Collection KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {formatRS(sumGrossAmount)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{filteredLedger.length} Receipts</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">UPI Collections</span>
              <div className="text-base sm:text-lg font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                {formatRS(sumUpi)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Online / QR</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cash Collections</span>
              <div className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                {formatRS(sumCash)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Physical Cash</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Card / POS</span>
              <div className="text-base sm:text-lg font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                {formatRS(sumCard)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Debit / Credit</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bank / Other</span>
              <div className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-300 mt-1">
                {formatRS(sumOtherModes)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">NEFT / Cheque</p>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Export Ledger</span>
              <button
                onClick={handleExportLedgerExcel}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition active:bg-slate-800"
                title="Download filtered collections ledger as Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search receipt #, member name, phone, package..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-slate-400 text-[11px] font-medium shrink-0">Mode:</span>
                {["ALL", "UPI", "CASH", "CARD", "BANK_TRANSFER"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setLedgerMethodFilter(method)}
                    className={`px-2.5 py-1 rounded-md font-semibold text-xs transition shrink-0 ${
                      ledgerMethodFilter === method
                        ? "bg-slate-900 text-white shadow-xs dark:bg-sky-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {method === "ALL" ? "All Modes" : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Preset Filter */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Date:</span>
                {[
                  { id: "all", label: "All Time" },
                  { id: "this_month", label: "This Month" },
                  { id: "last_month", label: "Last Month" },
                  { id: "this_quarter", label: "This Quarter" },
                  { id: "custom", label: "Custom Range" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setLedgerDatePreset(preset.id as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      ledgerDatePreset === preset.id
                        ? "bg-slate-800 text-white dark:bg-sky-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {ledgerDatePreset === "custom" && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={ledgerStartDate}
                    onChange={(e) => setLedgerStartDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={ledgerEndDate}
                    onChange={(e) => setLedgerEndDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Clean Ledger Table (Zero Tax Division) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            {filteredLedger.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No transactions found for the selected filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Package / Purpose</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{tx.receiptNo}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {formatDate(tx.paymentDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">{tx.member.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tx.member.memberId} • {tx.member.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {tx.planName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                          {formatRS(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(tx)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer Totals */}
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white">
                      <td colSpan={5} className="py-3 px-4">
                        TOTAL SUMMARY ({filteredLedger.length} Transactions)
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">
                        {formatRS(sumGrossAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES & PT ANALYTICS (Requirement 4) */}
      {activeReportTab === "packages" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* SECTION 1: PERSONAL TRAINING (PT) DETAIL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Personal Training (PT) Packages & Coach Performance
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete breakdown of PT packages sold, active trainees, sessions completed, and coach revenues.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportPTExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0 self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export PT Report</span>
              </button>
            </div>

            {/* PT Metrics KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active PT Trainees</span>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                  {data.ptSummary?.activeClients || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Currently training</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total PT Enrolled</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {data.ptSummary?.totalClients || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">All-time packages</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total PT Revenue</span>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatRS(data.ptSummary?.totalRevenue || 0)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Personal training fee</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sessions Completed</span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                  {data.ptSummary?.completedSessions || 0}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Tracked workouts</p>
              </div>
            </div>

            {/* PT Packages Cards Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PT Package Options Sold
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(data.ptPackagesDistribution || []).map((ptPlan) => (
                  <div
                    key={ptPlan.name}
                    className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {ptPlan.activeCount} Active
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {ptPlan.count} total sold
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {ptPlan.name}
                    </h5>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                      <span className="text-slate-400 text-[11px]">{ptPlan.sessions} Sessions</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRS(ptPlan.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach & Personal Trainer Performance Table */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personal Trainer & Coach Performance
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-4">Personal Trainer</th>
                      <th className="py-2.5 px-4 text-center">Active Trainees</th>
                      <th className="py-2.5 px-4 text-center">Total Clients</th>
                      <th className="py-2.5 px-4 text-center">Sessions Logged</th>
                      <th className="py-2.5 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(data.ptTrainerDistribution || []).map((t) => (
                      <tr key={t.trainer} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {t.trainer[0] || "T"}
                          </div>
                          <span>{t.trainer}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                          {t.activeClients}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-300">
                          {t.clientCount}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {t.completedSessions} / {t.totalSessions}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                          {formatRS(t.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 2: REGULAR GYM MEMBERSHIP PACKAGES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Gym Membership Packages Analytics
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown across regular gym membership plans, duration terms, and special offers.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search plan name or price..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleExportPackagesExcel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition active:bg-slate-200 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
              </div>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 p-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
              <button
                onClick={() => setCategoryFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  categoryFilter === "ACTIVE"
                    ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                Top Active (Sold &gt; 0)
              </button>

              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  categoryFilter === "ALL"
                    ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                All Packages ({data.plansDistribution.length})
              </button>

              <button
                onClick={() => setCategoryFilter("General")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === "General"
                    ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Regular Memberships</span>
              </button>

              <button
                onClick={() => setCategoryFilter("Special Offer")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === "Special Offer"
                    ? "bg-slate-900 dark:bg-sky-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Offers & Concessions</span>
              </button>
            </div>

            {/* Packages Grid */}
            <div className="p-4 sm:p-5">
              {filteredPlans.length === 0 ? (
                <div className="p-10 text-center bg-slate-50/50 dark:bg-slate-800/40 rounded-xl">
                  <p className="text-xs text-slate-400">No matching membership packages found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredPlans.map((plan, index) => {
                    const percentageOfTotal =
                      totalSubscriptionsSold > 0
                        ? Math.round((plan.count / totalSubscriptionsSold) * 100)
                        : 0;

                    return (
                      <div
                        key={plan.id || plan.name}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {plan.count > 0 && index < 3 ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                  #{index + 1} Best Seller
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700">
                                  #{index + 1}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-slate-500">
                                {plan.category || "General"}
                              </span>
                            </div>

                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {formatRS(plan.price)}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                            {plan.name}
                          </h4>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {plan.count > 0 ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  {plan.count} Enrolled
                                </span>
                              ) : (
                                <span className="text-slate-400">0 Sold</span>
                              )}
                            </span>

                            <span className="font-medium text-slate-500">
                              {plan.revenue > 0 ? formatRS(plan.revenue) : "Rs. 0"}
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                plan.count > 0 ? "bg-slate-900 dark:bg-sky-500" : "bg-transparent"
                              }`}
                              style={{ width: `${Math.max(4, percentageOfTotal)}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>{plan.durationInDays} Days Duration</span>
                            <span>{percentageOfTotal}% share</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OTHER PAYMENTS (Requirement 6) */}
      {activeReportTab === "others" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Other Collections</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatRS(data.otherCollections?.totalRevenue || 0)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Miscellaneous & Add-on revenue</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Other Receipts</span>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {data.otherCollections?.count || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Individual recorded payments</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Export Other Payments</span>
              <button
                type="button"
                onClick={handleExportOthersExcel}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Other Collections (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, receipt #, or item description..."
                value={otherSearch}
                onChange={(e) => setOtherSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {otherItems.length} records
            </span>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {otherItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No Other payments recorded yet. Record a payment with type "Others" to see it itemized here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Item / Reason</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {otherItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{item.receiptNo}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {formatDate(item.paymentDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">{item.memberName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.memberId} • {item.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-amber-900 dark:text-amber-300">
                          {item.notes}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                          {formatRS(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OVERVIEW & PAYMENT MODES */}
      {activeReportTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Members</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {data.memberStats.active}{" "}
                <span className="text-xs font-normal text-slate-400">/ {data.memberStats.total} total</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {data.memberStats.total > 0
                  ? `${Math.round((data.memberStats.active / data.memberStats.total) * 100)}% active rate`
                  : "-"}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Collections</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {formatRS(totalRevenueAll)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Recorded revenue</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Lead Conversion</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {data.enquiryStats.rate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {data.enquiryStats.converted} of {data.enquiryStats.total} leads enrolled
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Expired Passes</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {data.memberStats.expired}
              </div>
              <p className="text-xs text-rose-600 font-medium mt-1">Pending renewals</p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Last 6 Months Revenue Trend</h3>
              <p className="text-xs text-slate-400">Monthly gross fee collections.</p>
            </div>

            <div className="pt-4 grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 border-b border-slate-100 dark:border-slate-800 pb-2">
              {data.monthlyRevenue.map((m) => {
                const heightPercent = Math.max(8, Math.round((m.amount / maxMonthlyRevenue) * 100));
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatRS(m.amount)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[40px] bg-slate-900 hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-t-md transition-all duration-200"
                    />
                    <span className="text-[10px] font-medium text-slate-500 text-center truncate w-full">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Collections by Payment Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.paymentMethods.map((pm) => {
                const pct = totalRevenueAll > 0 ? Math.round((pm.amount / totalRevenueAll) * 100) : 0;
                return (
                  <div key={pm.method} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between text-xs font-semibold text-slate-800 dark:text-white">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>{pm.method}</span>
                      </span>
                      <span>{formatRS(pm.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{pm.count} transactions</span>
                      <span>{pct}% of revenue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}

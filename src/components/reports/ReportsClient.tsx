"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  IndianRupee,
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
  ArrowDownToLine,
  FileText,
} from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { ReceiptModal } from "@/components/payments/ReceiptModal";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  count: number;
  revenue: number;
  category?: "General" | "Personal Training" | "Special Offer";
}

interface TaxTransaction {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  paymentDate: string | Date;
  amount: number;
  taxableValue: number;
  totalGst: number;
  cgst: number;
  sgst: number;
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
    taxLedger?: TaxTransaction[];
    enquiryStats: { total: number; converted: number; rate: number };
    paymentMethods: Array<{ method: string; amount: number; count: number }>;
    memberStats: { active: number; expired: number; frozen: number; total: number };
  };
}

export function ReportsClient({ data }: ReportsClientProps) {
  const [activeReportTab, setActiveReportTab] = useState<"tax" | "overview" | "packages">("tax");
  
  // Package view states
  const [categoryFilter, setCategoryFilter] = useState<"ACTIVE" | "ALL" | "General" | "Personal Training" | "Special Offer">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  // Tax Report filters
  const [taxSearch, setTaxSearch] = useState("");
  const [taxMethodFilter, setTaxMethodFilter] = useState("ALL");
  const [taxDatePreset, setTaxDatePreset] = useState<"all" | "this_month" | "last_month" | "this_quarter" | "custom">("all");
  const [taxStartDate, setTaxStartDate] = useState("");
  const [taxEndDate, setTaxEndDate] = useState("");

  // Receipt Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

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

  // Filter Tax Ledger
  const taxLedger = data.taxLedger || [];
  const filteredTaxLedger = taxLedger.filter((item) => {
    const q = taxSearch.toLowerCase();
    const matchesSearch =
      item.invoiceNo.toLowerCase().includes(q) ||
      item.receiptNo.toLowerCase().includes(q) ||
      item.member.fullName.toLowerCase().includes(q) ||
      item.member.memberId.toLowerCase().includes(q) ||
      item.member.phone.includes(q) ||
      item.planName.toLowerCase().includes(q);

    const matchesMethod = taxMethodFilter === "ALL" ? true : item.paymentMethod === taxMethodFilter;

    // Date filtering
    let matchesDate = true;
    const itemDate = new Date(item.paymentDate);
    const now = new Date();

    if (taxDatePreset === "this_month") {
      matchesDate =
        itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    } else if (taxDatePreset === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      matchesDate =
        itemDate.getMonth() === lastMonth.getMonth() &&
        itemDate.getFullYear() === lastMonth.getFullYear();
    } else if (taxDatePreset === "this_quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(itemDate.getMonth() / 3);
      matchesDate = currentQuarter === itemQuarter && itemDate.getFullYear() === now.getFullYear();
    } else if (taxDatePreset === "custom") {
      if (taxStartDate) {
        matchesDate = matchesDate && itemDate >= new Date(taxStartDate);
      }
      if (taxEndDate) {
        const endD = new Date(taxEndDate);
        endD.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= endD;
      }
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  // Aggregated Tax Totals for filtered records
  const sumGrossAmount = filteredTaxLedger.reduce((sum, item) => sum + item.amount, 0);
  const sumTaxableValue = filteredTaxLedger.reduce((sum, item) => sum + item.taxableValue, 0);
  const sumCgst = filteredTaxLedger.reduce((sum, item) => sum + item.cgst, 0);
  const sumSgst = filteredTaxLedger.reduce((sum, item) => sum + item.sgst, 0);
  const sumTotalGst = sumCgst + sumSgst;

  // Download CSV Export handler
  const handleDownloadCsv = () => {
    const headers = [
      "Invoice Number",
      "Receipt Number",
      "Payment Date",
      "Member Name",
      "Member ID",
      "Phone",
      "Membership Plan",
      "Payment Mode",
      "Taxable Base Value (INR)",
      "CGST 9% (INR)",
      "SGST 9% (INR)",
      "Total GST 18% (INR)",
      "Total Gross Paid (INR)",
    ];

    const rows = filteredTaxLedger.map((t) => [
      `"${t.invoiceNo}"`,
      `"${t.receiptNo}"`,
      `"${formatDate(t.paymentDate)}"`,
      `"${t.member.fullName.replace(/"/g, '""')}"`,
      `"${t.member.memberId}"`,
      `"${t.member.phone}"`,
      `"${t.planName.replace(/"/g, '""')}"`,
      `"${t.paymentMethod}"`,
      t.taxableValue.toFixed(2),
      t.cgst.toFixed(2),
      t.sgst.toFixed(2),
      t.totalGst.toFixed(2),
      t.amount.toFixed(2),
    ]);

    // Append Summary Row
    rows.push([
      `"TOTAL SUMMARY"`,
      `""`,
      `""`,
      `""`,
      `""`,
      `""`,
      `""`,
      `""`,
      sumTaxableValue.toFixed(2),
      sumCgst.toFixed(2),
      sumSgst.toFixed(2),
      sumTotalGst.toFixed(2),
      sumGrossAmount.toFixed(2),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Concept_I_Gym_Tax_Revenue_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Financial Analytics & Tax Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GST tax ledger, invoice generation, revenue trends, and package distributions.
          </p>
        </div>

        {/* Top Report Tab Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-xs text-center">
          <button
            onClick={() => setActiveReportTab("tax")}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "tax"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">Tax & GST</span>
          </button>

          <button
            onClick={() => setActiveReportTab("packages")}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "packages"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Packages</span>
          </button>

          <button
            onClick={() => setActiveReportTab("overview")}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              activeReportTab === "overview"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Trends</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TAX AND REVENUE REPORT (Requested by User) */}
      {activeReportTab === "tax" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Tax Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Collections</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {formatINR(sumGrossAmount)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{filteredTaxLedger.length} Invoices</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Taxable Value (Base)</span>
              <div className="text-lg sm:text-xl font-bold text-blue-700 mt-1">
                {formatINR(sumTaxableValue)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Pre-tax gross</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">CGST @ 9%</span>
              <div className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
                {formatINR(sumCgst)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Central Tax</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">SGST @ 9%</span>
              <div className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
                {formatINR(sumSgst)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">State Tax</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total GST (18%)</span>
              <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                {formatINR(sumTotalGst)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">CGST + SGST</p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Export Ledger</span>
              <button
                onClick={handleDownloadCsv}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Tax Report Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by member, phone, plan or invoice #..."
                  value={taxSearch}
                  onChange={(e) => setTaxSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Presets & Payment Mode Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setTaxDatePreset("all")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      taxDatePreset === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setTaxDatePreset("this_month")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      taxDatePreset === "this_month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setTaxDatePreset("last_month")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      taxDatePreset === "last_month" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setTaxDatePreset("this_quarter")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      taxDatePreset === "this_quarter" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    This Quarter
                  </button>
                  <button
                    onClick={() => setTaxDatePreset("custom")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      taxDatePreset === "custom" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Custom Dates
                  </button>
                </div>

                <select
                  value={taxMethodFilter}
                  onChange={(e) => setTaxMethodFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>

            {/* Custom Date Pickers if selected */}
            {taxDatePreset === "custom" && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">From:</span>
                  <input
                    type="date"
                    value={taxStartDate}
                    onChange={(e) => setTaxStartDate(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">To:</span>
                  <input
                    type="date"
                    value={taxEndDate}
                    onChange={(e) => setTaxEndDate(e.target.value)}
                    className="px-2.5 py-1 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tax & Revenue Ledger - Desktop Table & Mobile Cards */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            {filteredTaxLedger.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-700">No Tax Transactions Found</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting date ranges or filters.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (Owner View on Mobile) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredTaxLedger.map((tx) => (
                    <div key={tx.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">{tx.invoiceNo}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{formatDate(tx.paymentDate)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-700 font-mono block">{formatINR(tx.amount)}</span>
                          <span className="text-[10px] text-slate-400">Total Paid</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100/80 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-900">{tx.member.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{tx.member.memberId}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex justify-between items-center">
                          <span>{tx.planName}</span>
                          <span className="text-slate-400">{tx.member.phone}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-slate-50 p-2 rounded-lg font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Taxable Base</span>
                          <span className="font-semibold text-slate-700">{formatINR(tx.taxableValue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">GST 18%</span>
                          <span className="font-semibold text-slate-700">{formatINR(tx.totalGst)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Gross</span>
                          <span className="font-bold text-emerald-700">{formatINR(tx.amount)}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(tx)}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-[0.99]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print Tax Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Summary Footnote */}
                  <div className="p-3 bg-slate-50 text-xs font-semibold text-slate-800 flex justify-between items-center border-t border-slate-200">
                    <span>Summary ({filteredTaxLedger.length} Invoices)</span>
                    <span className="font-bold font-mono text-emerald-800 text-sm">{formatINR(sumGrossAmount)}</span>
                  </div>
                </div>

                {/* Desktop Full Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Package</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4 text-right">Taxable Base (₹)</th>
                        <th className="py-3 px-4 text-right">CGST 9% (₹)</th>
                        <th className="py-3 px-4 text-right">SGST 9% (₹)</th>
                        <th className="py-3 px-4 text-right">Total Paid (₹)</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTaxLedger.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {tx.invoiceNo}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatDate(tx.paymentDate)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{tx.member.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {tx.member.memberId} • {tx.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {tx.planName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                            {formatINR(tx.taxableValue)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatINR(tx.cgst)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatINR(tx.sgst)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatINR(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(tx)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Table Footer Totals */}
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                        <td colSpan={5} className="py-3 px-4">
                          TOTAL SUMMARY ({filteredTaxLedger.length} Invoices)
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-700">
                          {formatINR(sumTaxableValue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatINR(sumCgst)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatINR(sumSgst)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-800 text-sm">
                          {formatINR(sumGrossAmount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERSHIP PACKAGE DISTRIBUTION */}
      {activeReportTab === "packages" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Header with Title and Search */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Membership Package Analytics & Distribution
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown across all 17 gym packages, personal training plans, and special offers.
                </p>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search plan name or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Category Pills Filter */}
            <div className="flex items-center gap-1.5 p-3 bg-slate-50/70 border-b border-slate-100 overflow-x-auto text-xs">
              <button
                onClick={() => setCategoryFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  categoryFilter === "ACTIVE"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                🔥 Top Active (Sold &gt; 0)
              </button>

              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  categoryFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                All Packages ({data.plansDistribution.length})
              </button>

              <button
                onClick={() => setCategoryFilter("General")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === "General"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Regular Memberships</span>
              </button>

              <button
                onClick={() => setCategoryFilter("Personal Training")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === "Personal Training"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Personal Training (PT)</span>
              </button>

              <button
                onClick={() => setCategoryFilter("Special Offer")}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                  categoryFilter === "Special Offer"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Offers & Concessions</span>
              </button>
            </div>

            {/* Packages Grid Showcase */}
            <div className="p-4 sm:p-5">
              {filteredPlans.length === 0 ? (
                <div className="p-10 text-center bg-slate-50/50 rounded-xl">
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
                        className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              {plan.count > 0 && index < 3 ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                  #{index + 1} Best Seller
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100">
                                  #{index + 1}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-slate-500">
                                {plan.category || "General"}
                              </span>
                            </div>

                            <span className="font-bold text-xs text-slate-900">
                              {formatINR(plan.price)}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                            {plan.name}
                          </h4>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {plan.count > 0 ? (
                                <span className="text-emerald-700 font-bold">
                                  {plan.count} Enrolled
                                </span>
                              ) : (
                                <span className="text-slate-400">0 Sold</span>
                              )}
                            </span>

                            <span className="font-medium text-slate-500">
                              {plan.revenue > 0 ? formatINR(plan.revenue) : "₹0 revenue"}
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                plan.count > 0 ? "bg-slate-900" : "bg-transparent"
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

      {/* TAB 3: OVERVIEW & PAYMENT MODES */}
      {activeReportTab === "overview" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Members</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {data.memberStats.active}{" "}
                <span className="text-xs font-normal text-slate-400">/ {data.memberStats.total} total</span>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {data.memberStats.total > 0
                  ? `${Math.round((data.memberStats.active / data.memberStats.total) * 100)}% active rate`
                  : "-"}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Collections</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {formatINR(totalRevenueAll)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Recorded revenue</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Lead Conversion</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {data.enquiryStats.rate}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {data.enquiryStats.converted} of {data.enquiryStats.total} leads enrolled
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Expired Passes</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {data.memberStats.expired}
              </div>
              <p className="text-xs text-rose-600 font-medium mt-1">Pending renewals</p>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Last 6 Months Revenue Trend</h3>
              <p className="text-xs text-slate-400">Monthly gross fee collections.</p>
            </div>

            <div className="pt-4 grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 border-b border-slate-100 pb-2">
              {data.monthlyRevenue.map((m) => {
                const heightPercent = Math.max(8, Math.round((m.amount / maxMonthlyRevenue) * 100));
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatINR(m.amount)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[40px] bg-slate-900 hover:bg-slate-700 rounded-t-md transition-all duration-200"
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
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Collections by Payment Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.paymentMethods.map((pm) => {
                const pct = totalRevenueAll > 0 ? Math.round((pm.amount / totalRevenueAll) * 100) : 0;
                return (
                  <div key={pm.method} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>{pm.method}</span>
                      </span>
                      <span>{formatINR(pm.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
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

      {/* Official Tax Invoice Modal */}
      {selectedInvoice && (
        <ReceiptModal
          receipt={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

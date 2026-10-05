"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  CreditCard,
  MessageCircle,
  Eye,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  X,
  Sparkles,
  Phone,
  Dumbbell,
  Download,
  Filter,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { formatINR, formatDate, calculateDaysRemaining } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { exportToExcel } from "@/lib/export-excel";

interface MemberListClientProps {
  members: any[];
}

export function MemberListClient({ members }: MemberListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ptFilter, setPtFilter] = useState<"ALL" | "ACTIVE_PT" | "EXPIRED_PT" | "NO_PT">("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [dueFilter, setDueFilter] = useState<"ALL" | "HAS_DUE" | "PAID">("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"ID_DESC" | "ID_ASC" | "NAME_ASC" | "NAME_DESC" | "EXPIRY_ASC" | "ENROLL_DESC">("ID_DESC");

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    dueAmount: number;
  } | null>(null);

  const now = new Date();

  // Extract unique plans from member dataset
  const uniquePlans = Array.from(
    new Set(
      members
        .flatMap((m) => m.subscriptions?.map((s: any) => s.planName) || [])
        .filter(Boolean)
    )
  ).sort();

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q));

    const latestSub = m.subscriptions?.[0];
    const latestPT = m.ptSubscriptions?.[0];
    const subDue = latestSub?.dueAmount || 0;
    const ptDue = latestPT?.dueAmount || 0;
    const totalDue = subDue + ptDue;

    // Real-time dynamic status evaluation
    const isSubActive = latestSub && latestSub.status === "ACTIVE" && new Date(latestSub.endDate) >= now;
    const isSubExpired = latestSub && (latestSub.status === "EXPIRED" || new Date(latestSub.endDate) < now);
    const isSubInactive = !latestSub || m.membershipStatus === "INACTIVE";

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? isSubActive
        : statusFilter === "INACTIVE"
        ? isSubInactive
        : statusFilter === "EXPIRED"
        ? isSubExpired
        : true;

    // PT Filter Match
    const isPTActive = latestPT && latestPT.status === "ACTIVE" && new Date(latestPT.endDate) >= now;
    const isPTExpired = latestPT && (latestPT.status === "EXPIRED" || new Date(latestPT.endDate) < now);
    const hasNoPT = !latestPT;

    const matchesPT =
      ptFilter === "ALL"
        ? true
        : ptFilter === "ACTIVE_PT"
        ? isPTActive
        : ptFilter === "EXPIRED_PT"
        ? isPTExpired
        : ptFilter === "NO_PT"
        ? hasNoPT
        : true;

    const matchesPlan =
      planFilter === "ALL"
        ? true
        : latestSub?.planName === planFilter;

    const matchesDue =
      dueFilter === "ALL"
        ? true
        : dueFilter === "HAS_DUE"
        ? totalDue > 0
        : dueFilter === "PAID"
        ? totalDue === 0
        : true;

    const matchesGender =
      genderFilter === "ALL"
        ? true
        : (m.gender || "").toLowerCase() === genderFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPT && matchesPlan && matchesDue && matchesGender;
  });

  // Sorting
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === "ID_DESC") {
      const numA = parseInt(a.memberId?.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.memberId?.replace(/\D/g, "") || "0", 10);
      return numB - numA;
    }
    if (sortBy === "ID_ASC") {
      const numA = parseInt(a.memberId?.replace(/\D/g, "") || "0", 10);
      const numB = parseInt(b.memberId?.replace(/\D/g, "") || "0", 10);
      return numA - numB;
    }
    if (sortBy === "NAME_ASC") {
      return (a.fullName || "").localeCompare(b.fullName || "");
    }
    if (sortBy === "NAME_DESC") {
      return (b.fullName || "").localeCompare(a.fullName || "");
    }
    if (sortBy === "EXPIRY_ASC") {
      const endA = a.subscriptions?.[0]?.endDate ? new Date(a.subscriptions[0].endDate).getTime() : 9999999999999;
      const endB = b.subscriptions?.[0]?.endDate ? new Date(b.subscriptions[0].endDate).getTime() : 9999999999999;
      return endA - endB;
    }
    if (sortBy === "ENROLL_DESC") {
      const enrollA = a.enrollDate ? new Date(a.enrollDate).getTime() : 0;
      const enrollB = b.enrollDate ? new Date(b.enrollDate).getTime() : 0;
      return enrollB - enrollA;
    }
    return 0;
  });

  const activeFiltersCount =
    (statusFilter !== "ALL" ? 1 : 0) +
    (ptFilter !== "ALL" ? 1 : 0) +
    (planFilter !== "ALL" ? 1 : 0) +
    (dueFilter !== "ALL" ? 1 : 0) +
    (genderFilter !== "ALL" ? 1 : 0) +
    (search.trim() !== "" ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPtFilter("ALL");
    setPlanFilter("ALL");
    setDueFilter("ALL");
    setGenderFilter("ALL");
    setSortBy("ID_DESC");
  };

  const handleOpenPayment = (memberId: string, fullName: string, due: number) => {
    setSelectedMember({ id: memberId, name: fullName, dueAmount: due });
    setPaymentModalOpen(true);
  };

  const handleExportMembers = () => {
    exportToExcel({
      data: sortedMembers,
      fileName: "Gym_Members_Directory",
      sheetName: "Members",
      columns: [
        { header: "Member ID", accessor: (m) => m.memberId },
        { header: "Full Name", accessor: (m) => m.fullName },
        { header: "Mobile", accessor: (m) => m.phone },
        { header: "Email", accessor: (m) => m.email || "" },
        { header: "Gender", accessor: (m) => m.gender || "Male" },
        { header: "Membership Status", accessor: (m) => m.membershipStatus },
        { header: "Active Plan", accessor: (m) => m.subscriptions?.[0]?.planName || "None" },
        {
          header: "Plan Start Date",
          accessor: (m) => (m.subscriptions?.[0]?.startDate ? formatDate(m.subscriptions[0].startDate) : ""),
        },
        {
          header: "Plan Expiry Date",
          accessor: (m) => (m.subscriptions?.[0]?.endDate ? formatDate(m.subscriptions[0].endDate) : ""),
        },
        {
          header: "Days Left",
          accessor: (m) => {
            const sub = m.subscriptions?.[0];
            return sub ? calculateDaysRemaining(sub.endDate) : 0;
          },
        },
        {
          header: "Active PT",
          accessor: (m) => {
            const pt = m.ptSubscriptions?.[0];
            const isPTActive = pt && pt.status === "ACTIVE" && new Date(pt.endDate) >= now;
            return isPTActive ? "Yes" : "No";
          },
        },
        { header: "PT Plan", accessor: (m) => m.ptSubscriptions?.[0]?.planName || "" },
        { header: "PT Trainer", accessor: (m) => m.ptSubscriptions?.[0]?.trainerName || "" },
        {
          header: "PT Expiry",
          accessor: (m) => (m.ptSubscriptions?.[0]?.endDate ? formatDate(m.ptSubscriptions[0].endDate) : ""),
        },
        {
          header: "Pending Due (₹)",
          accessor: (m) => {
            const subDue = m.subscriptions?.[0]?.dueAmount || 0;
            const ptDue = m.ptSubscriptions?.[0]?.dueAmount || 0;
            return subDue + ptDue;
          },
        },
        {
          header: "Payment Status",
          accessor: (m) => {
            const subDue = m.subscriptions?.[0]?.dueAmount || 0;
            const ptDue = m.ptSubscriptions?.[0]?.dueAmount || 0;
            return subDue + ptDue > 0 ? "Due" : "Paid";
          },
        },
        { header: "Enrolled Date", accessor: (m) => formatDate(m.enrollDate) },
        { header: "Representative", accessor: (m) => m.representative || "" },
      ],
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Members Directory</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {members.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, search and manage gym athletes, memberships, PT packages, and dues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMembers}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs transition active:bg-slate-200"
            title="Download filtered members as Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <Link
            href="/portal/members/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* Modern Dropdown Filter Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Search Bar & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by member name, phone number, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-medium text-slate-500">
              Showing <strong className="font-bold text-slate-900">{sortedMembers.length}</strong> of {members.length}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg border border-rose-200/60 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
          
          {/* 1. Membership Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Membership
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Membership</option>
              <option value="EXPIRED">Expired Plan</option>
              <option value="INACTIVE">Inactive / No Plan</option>
            </select>
          </div>

          {/* 2. PT Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Personal Training
            </label>
            <select
              value={ptFilter}
              onChange={(e) => setPtFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ALL">All PT Statuses</option>
              <option value="ACTIVE_PT">🎯 Has Active PT</option>
              <option value="EXPIRED_PT">⌛ PT Expired</option>
              <option value="NO_PT">No PT Plan</option>
            </select>
          </div>

          {/* 3. Plan / Package */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Plan / Package
            </label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800 truncate"
            >
              <option value="ALL">All Plans</option>
              {uniquePlans.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Payment / Due */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Payment Status
            </label>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ALL">All Payment Status</option>
              <option value="HAS_DUE">⚠️ Has Pending Dues</option>
              <option value="PAID">✓ Fully Paid (Zero Due)</option>
            </select>
          </div>

          {/* 5. Gender */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Gender
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 6. Sort By */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              <option value="ID_DESC">ID: Newest First</option>
              <option value="ID_ASC">ID: Oldest First</option>
              <option value="NAME_ASC">Name: A to Z</option>
              <option value="NAME_DESC">Name: Z to A</option>
              <option value="EXPIRY_ASC">Expiry: Soonest</option>
              <option value="ENROLL_DESC">Join Date: Newest</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Active:
            </span>

            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter("ALL")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {ptFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md text-[11px] font-medium border border-indigo-200">
                PT: {ptFilter === "ACTIVE_PT" ? "Active" : ptFilter === "EXPIRED_PT" ? "Expired" : "None"}
                <button onClick={() => setPtFilter("ALL")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {planFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                Plan: {planFilter}
                <button onClick={() => setPlanFilter("ALL")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dueFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-medium border border-amber-200">
                Due: {dueFilter === "HAS_DUE" ? "Pending Dues" : "Fully Paid"}
                <button onClick={() => setDueFilter("ALL")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {genderFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                Gender: {genderFilter}
                <button onClick={() => setGenderFilter("ALL")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {search.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200">
                Search: &quot;{search}&quot;
                <button onClick={() => setSearch("")} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Members Directory Content */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {sortedMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Members Found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile Member Cards View (block md:hidden) */}
            <div className="p-3 grid grid-cols-1 gap-2.5 md:hidden">
              {sortedMembers.map((member) => {
                const activeSub = member.subscriptions?.[0];
                const latestPT = member.ptSubscriptions?.[0];
                const isPTActive = latestPT && latestPT.status === "ACTIVE" && new Date(latestPT.endDate) >= now;
                const isPTExpired = latestPT && (latestPT.status === "EXPIRED" || new Date(latestPT.endDate) < now);

                const subDue = activeSub?.dueAmount || 0;
                const ptDue = latestPT?.dueAmount || 0;
                const totalDue = subDue + ptDue;

                const daysLeft = activeSub ? calculateDaysRemaining(activeSub.endDate) : 0;
                const isExpired = daysLeft < 0 || member.membershipStatus === "EXPIRED";

                return (
                  <div
                    key={member.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          #{member.memberId}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/portal/members/${member.id}`}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 leading-tight"
                            >
                              {member.fullName}
                            </Link>
                            {isPTActive && (
                              <span
                                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.2 rounded text-[10px] font-bold"
                                title={`Active PT (${latestPT?.trainerName || "General"})`}
                              >
                                <Dumbbell className="w-2.5 h-2.5 text-indigo-600" />
                                <span>PT</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {member.phone}
                          </span>
                        </div>
                      </div>

                      {totalDue > 0 ? (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          Due: {formatINR(totalDue)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Paid
                        </span>
                      )}
                    </div>

                    {/* Subscriptions & PT Badges */}
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-800">{activeSub?.planName || "No Plan"}</span>
                          {member.programme && (
                            <span className="text-slate-400"> • {member.programme}</span>
                          )}
                        </div>
                        <div>
                          {activeSub ? (
                            isExpired ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Expired
                              </span>
                            ) : daysLeft <= 7 ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                {daysLeft}d left
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {daysLeft}d left
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">No subscription</span>
                          )}
                        </div>
                      </div>

                      {/* PT Badge in Mobile */}
                      {latestPT && (
                        <div className="flex items-center justify-between bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100/70">
                          <span className="text-indigo-900 font-medium flex items-center gap-1 text-[10px]">
                            <Dumbbell className="w-3 h-3 text-indigo-600" />
                            <span>PT: <strong>{latestPT.trainerName || "Trainer"}</strong></span>
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isPTActive
                                ? "bg-indigo-600 text-white"
                                : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {isPTActive ? `${calculateDaysRemaining(latestPT.endDate)}d left` : "PT Expired"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${member.phone}`}
                        className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:bg-slate-100"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/91${member.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:bg-slate-100"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      {totalDue > 0 && (
                        <button
                          onClick={() => handleOpenPayment(member.id, member.fullName, totalDue)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs active:bg-rose-800"
                        >
                          Collect
                        </button>
                      )}

                      <Link
                        href={`/portal/members/${member.id}`}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center shadow-xs active:bg-slate-800"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Mobile</th>
                    <th className="py-2.5 px-4">Plan</th>
                    <th className="py-2.5 px-4">Validity</th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sortedMembers.map((member) => {
                    const activeSub = member.subscriptions?.[0];
                    const latestPT = member.ptSubscriptions?.[0];
                    const isPTActive = latestPT && latestPT.status === "ACTIVE" && new Date(latestPT.endDate) >= now;
                    const isPTExpired = latestPT && (latestPT.status === "EXPIRED" || new Date(latestPT.endDate) < now);

                    const subDue = activeSub?.dueAmount || 0;
                    const ptDue = latestPT?.dueAmount || 0;
                    const totalDue = subDue + ptDue;

                    const daysLeft = activeSub ? calculateDaysRemaining(activeSub.endDate) : 0;
                    const isExpired = daysLeft < 0 || member.membershipStatus === "EXPIRED";

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition">
                        
                        {/* ID */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs">
                            #{member.memberId}
                          </span>
                        </td>

                        {/* Name + Active PT Symbol */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/portal/members/${member.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600"
                            >
                              {member.fullName}
                            </Link>
                            {isPTActive && (
                              <span
                                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs"
                                title={`Active Personal Training (Trainer: ${latestPT?.trainerName || "General"})`}
                              >
                                <Dumbbell className="w-3 h-3 text-indigo-600" />
                                <span>PT Active</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Mobile */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-600 font-medium">
                            {member.phone}
                          </span>
                        </td>

                        {/* Plan */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 block">
                            {activeSub?.planName || "No Plan"}
                          </span>
                          {member.programme && (
                            <span className="text-[11px] text-slate-400">
                              {member.programme}
                            </span>
                          )}
                        </td>

                        {/* Validity */}
                        <td className="py-3 px-4">
                          {activeSub ? (
                            <div>
                              <span className="text-slate-600 font-medium block">
                                {formatDate(activeSub.endDate)}
                              </span>
                              {isExpired ? (
                                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  Expired
                                </span>
                              ) : daysLeft <= 7 ? (
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {daysLeft} days left
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {daysLeft} days left
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No Plan Assigned</span>
                          )}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3 px-4">
                          {totalDue > 0 ? (
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block">
                              Due: {formatINR(totalDue)}
                            </span>
                          ) : !activeSub ? (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                              Unassigned
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!activeSub ? (
                              <Link
                                href={`/portal/members/${member.id}`}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition inline-flex items-center gap-1"
                              >
                                <span>Assign Plan</span>
                              </Link>
                            ) : totalDue > 0 ? (
                              <button
                                onClick={() => handleOpenPayment(member.id, member.fullName, totalDue)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
                              >
                                Collect
                              </button>
                            ) : null}

                            <a
                              href={`https://wa.me/91${member.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            <Link
                              href={`/portal/members/${member.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Collect Payment Modal */}
      {selectedMember && (
        <AddPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedMember(null);
          }}
          prefillMemberId={selectedMember.id}
          prefillMemberName={selectedMember.name}
          prefillDueAmount={selectedMember.dueAmount}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

    </div>
  );
}

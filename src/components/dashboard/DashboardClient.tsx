"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  IndianRupee,
  UserPlus,
  AlertTriangle,
  Calendar,
  Cake,
  HeartHandshake,
  Clock,
  ArrowUpRight,
  Phone,
  MessageCircle,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";

interface DashboardDataProps {
  data: {
    metrics: {
      sold: { today: number; week: number; month: number };
      sales: { today: number; week: number; month: number };
      enquiries: { today: number; week: number; month: number };
      totalDue: number;
    };
    dueSubscriptions: Array<{
      id: string;
      planName: string;
      dueAmount: number;
      totalAmount: number;
      startDate: Date;
      endDate: Date;
      member: {
        id: string;
        memberId: string;
        fullName: string;
        phone: string;
      };
    }>;
    pendingFollowUps: Array<{
      id: string;
      name: string;
      phone: string;
      preferredPlan: string | null;
      status: string;
      followUpDate: Date | null;
      notes: string | null;
    }>;
    recentMembers: Array<{
      id: string;
      memberId: string;
      fullName: string;
      phone: string;
      enrollDate: Date;
      membershipStatus: string;
      subscriptions: Array<{
        planName: string;
      }>;
    }>;
    expiringSoon: Array<{
      id: string;
      planName: string;
      endDate: Date;
      member: {
        id: string;
        memberId: string;
        fullName: string;
        phone: string;
      };
    }>;
    upcomingEvents: Array<{
      id: string;
      memberId: string;
      fullName: string;
      phone: string;
      type: "Birthday" | "Anniversary";
      date: Date;
      isToday: boolean;
      daysUntil: number;
      detail?: string;
    }>;
  };
}

export function DashboardClient({ data }: DashboardDataProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("month");
  const [activeTab, setActiveTab] = useState<"dues" | "events" | "followups" | "newMembers" | "expiring">("dues");

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDueMember, setSelectedDueMember] = useState<{
    id: string;
    name: string;
    amount: number;
  } | null>(null);

  const handleOpenPayment = (memberId: string, name: string, dueAmount: number) => {
    setSelectedDueMember({ id: memberId, name, amount: dueAmount });
    setPaymentModalOpen(true);
  };

  const getMetricSubtitle = () => {
    if (timeframe === "today") return "Today";
    if (timeframe === "week") return "This Week";
    return "This Month";
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Segmented Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key metrics for memberships, sales, enquiries, and pending balances.
          </p>
        </div>

        {/* Minimal Segmented Switcher - Full width 3-col on mobile */}
        <div className="grid grid-cols-3 sm:flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 w-full sm:w-auto text-xs">
          <button
            onClick={() => setTimeframe("today")}
            className={`py-1.5 px-3 rounded-md font-semibold text-center transition ${
              timeframe === "today"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe("week")}
            className={`py-1.5 px-3 rounded-md font-semibold text-center transition ${
              timeframe === "week"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`py-1.5 px-3 rounded-md font-semibold text-center transition ${
              timeframe === "month"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Minimal Metric Cards - 2x2 grid on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Memberships Sold */}
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Sold
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {data.metrics.sold[timeframe]}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Enrolled {getMetricSubtitle().toLowerCase()}
            </p>
          </div>
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 mt-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Sales
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-lg sm:text-3xl font-bold text-slate-900 tracking-tight truncate">
              {formatINR(data.metrics.sales[timeframe])}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Collected revenue
            </p>
          </div>
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-0.5"
          >
            <span>Ledger</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 3: Enquiries */}
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Leads
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {data.metrics.enquiries[timeframe]}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Inquiries logged
            </p>
          </div>
          <Link
            href="/admin/enquiries"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-600 hover:text-amber-700 mt-0.5"
          >
            <span>Manage</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 4: Total Due Payment */}
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Dues
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-2 sm:my-3">
            <div className="text-lg sm:text-3xl font-bold text-rose-600 tracking-tight truncate">
              {formatINR(data.metrics.totalDue)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Pending balance
            </p>
          </div>
          <button
            onClick={() => setActiveTab("dues")}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-rose-600 hover:text-rose-700 mt-0.5 text-left"
          >
            <span>Dues list</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Interactive Tabbed Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Clean Segmented Tab Navigation Header with smooth mobile scroll */}
        <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setActiveTab("dues")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "dues"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Dues ({data.dueSubscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "events"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-purple-500" />
            <span>Events ({data.upcomingEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("followups")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "followups"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Follow-ups ({data.pendingFollowUps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("newMembers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "newMembers"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>New ({data.recentMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("expiring")}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === "expiring"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>Expiring ({data.expiringSoon.length})</span>
          </button>
        </div>

        {/* Tab 1: Due Payments Content */}
        {activeTab === "dues" && (
          <div className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Pending Dues & Balances</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Members with pending payment balances.
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                Total: {formatINR(data.metrics.totalDue)}
              </span>
            </div>

            {data.dueSubscriptions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Pending Dues</p>
                <p className="text-[11px] text-slate-500">All member subscription fees are up to date.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {data.dueSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/admin/members/${sub.member.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-blue-600 block"
                          >
                            {sub.member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {sub.member.memberId} • {sub.member.phone}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-600 block">
                            Due: {formatINR(sub.dueAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Total: {formatINR(sub.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Plan: <strong className="font-semibold text-slate-700">{sub.planName}</strong></span>
                        <span>Till: {formatDate(sub.endDate)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`https://wa.me/91${sub.member.phone}?text=Hi%20${encodeURIComponent(
                            sub.member.fullName
                          )},%20gentle%20reminder%20regarding%20your%20pending%20membership%20due%20of%20Rs.${
                            sub.dueAmount
                          }.%20Kindly%20clear%20at%20your%20earliest%20convenience.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 active:bg-slate-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() =>
                            handleOpenPayment(sub.member.id, sub.member.fullName, sub.dueAmount)
                          }
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs active:bg-slate-800"
                        >
                          Collect Due
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Plan</th>
                        <th className="py-2.5 px-3">Total Fee</th>
                        <th className="py-2.5 px-3">Pending Due</th>
                        <th className="py-2.5 px-3">Valid Until</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.dueSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3">
                            <Link
                              href={`/admin/members/${sub.member.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 block"
                            >
                              {sub.member.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              {sub.member.memberId} • {sub.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">
                            {sub.planName}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {formatINR(sub.totalAmount)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-rose-600">
                              {formatINR(sub.dueAmount)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {formatDate(sub.endDate)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`https://wa.me/91${sub.member.phone}?text=Hi%20${encodeURIComponent(
                                  sub.member.fullName
                                )},%20gentle%20reminder%20regarding%20your%20pending%20membership%20due%20of%20Rs.${
                                  sub.dueAmount
                                }.\x20Kindly%20clear%20at%20your%20earliest%20convenience.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1 border border-slate-200 transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                onClick={() =>
                                  handleOpenPayment(sub.member.id, sub.member.fullName, sub.dueAmount)
                                }
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
                              >
                                Collect
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

        {/* Tab 2: Birthdays & Anniversaries Content */}
        {activeTab === "events" && (
          <div className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Birthdays & Anniversaries</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Send greetings to members celebrating their special days this week.
                </p>
              </div>
            </div>

            {data.upcomingEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                <Cake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Celebrations This Week</p>
                <p className="text-[11px] text-slate-500">No member birthdays or wedding anniversaries in the next 7 days.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {data.upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex flex-col justify-between space-y-3 transition hover:border-slate-300 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            evt.type === "Birthday"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-pink-50 text-pink-600"
                          }`}
                        >
                          {evt.type === "Birthday" ? (
                            <Cake className="w-4 h-4" />
                          ) : (
                            <HeartHandshake className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-slate-900 block">
                            {evt.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {evt.memberId} • {evt.detail || evt.type}
                          </span>
                        </div>
                      </div>

                      {evt.isToday ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200">
                          Today 🎉
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                          In {evt.daysUntil}d
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(evt.date)}
                      </span>
                      <a
                        href={`https://wa.me/91${evt.phone}?text=Dear%20${encodeURIComponent(
                          evt.fullName
                        )},%20Wishing%20you%20a%20very%20Happy%20${
                          evt.type
                        }%20from%20Concept%20I%20Gym!%20Stay%20fit%20and%20healthy!%20🎂💪`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:bg-slate-800 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send Wish</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Follow-up List Content */}
        {activeTab === "followups" && (
          <div className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Enquiries & Follow-up Queue</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Prospective leads scheduled for calls and visits.
                </p>
              </div>
              <Link
                href="/admin/enquiries"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                All Enquiries →
              </Link>
            </div>

            {data.pendingFollowUps.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Pending Follow-ups</p>
                <p className="text-[11px] text-slate-500">All enquiry calls are up to date.</p>
              </div>
            ) : (
              <>
                {/* Mobile Follow-up Cards (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {data.pendingFollowUps.map((enq) => (
                    <div
                      key={enq.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{enq.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{enq.phone}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            enq.status === "TRIAL_SCHEDULED"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : enq.status === "FOLLOW_UP"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {enq.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Plan: {enq.preferredPlan || "General Fitness"}</span>
                        <span>Date: {formatDate(enq.followUpDate)}</span>
                      </div>

                      {enq.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                          &quot;{enq.notes}&quot;
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${enq.phone}`}
                          className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 active:bg-slate-100"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/91${enq.phone}?text=Hi%20${encodeURIComponent(
                            enq.name
                          )},%20greetings%20from%20Concept%20I%20Gym!%20Regarding%20your%20fitness%20enquiry.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-emerald-600 rounded-lg text-xs font-semibold flex items-center justify-center"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        <Link
                          href={`/admin/members/new?name=${encodeURIComponent(
                            enq.name
                          )}&phone=${encodeURIComponent(enq.phone)}&plan=${encodeURIComponent(
                            enq.preferredPlan || ""
                          )}`}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center shadow-xs active:bg-slate-800"
                        >
                          Convert
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Follow-up Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Lead Name</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Plan</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Scheduled</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.pendingFollowUps.map((enq) => (
                        <tr key={enq.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{enq.name}</span>
                            {enq.notes && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {enq.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {enq.phone}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {enq.preferredPlan || "General Fitness"}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                enq.status === "TRIAL_SCHEDULED"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : enq.status === "FOLLOW_UP"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {enq.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {formatDate(enq.followUpDate)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`tel:${enq.phone}`}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-medium inline-flex items-center gap-1 transition"
                              >
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>Call</span>
                              </a>
                              <Link
                                href={`/admin/members/new?name=${encodeURIComponent(
                                  enq.name
                                )}&phone=${encodeURIComponent(enq.phone)}&plan=${encodeURIComponent(
                                  enq.preferredPlan || ""
                                )}`}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
                              >
                                Convert
                              </Link>
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

        {/* Tab 4: New Members Content */}
        {activeTab === "newMembers" && (
          <div className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Recently Enrolled Members</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Newly registered members.</p>
              </div>
              <Link
                href="/admin/members/new"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                + Register Member
              </Link>
            </div>

            {/* Mobile New Member Cards (block md:hidden) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {data.recentMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="font-bold text-xs text-slate-900 hover:text-blue-600 block"
                      >
                        {m.fullName}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {m.memberId} • {m.phone}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {m.membershipStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Plan: <strong className="font-semibold text-slate-700">{m.subscriptions[0]?.planName || "Standard Membership"}</strong></span>
                    <span>Enrolled: {formatDate(m.enrollDate)}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={`https://wa.me/91${m.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-600 font-medium inline-flex items-center gap-1 hover:text-emerald-600"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>

                    <Link
                      href={`/admin/members/${m.id}`}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold"
                    >
                      Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop New Member Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Enrolled</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data.recentMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 block"
                        >
                          {m.fullName}
                        </Link>
                        <span className="text-[11px] text-slate-400">{m.memberId}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{m.phone}</td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {m.subscriptions[0]?.planName || "Standard Membership"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {formatDate(m.enrollDate)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.membershipStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Expiring Soon Content */}
        {activeTab === "expiring" && (
          <div className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Expiring in Next 7 Days</h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Contact members for early renewal.</p>
              </div>
            </div>

            {data.expiringSoon.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Expiring Memberships</p>
                <p className="text-[11px] text-slate-500">All active subscriptions extend beyond the next 7 days.</p>
              </div>
            ) : (
              <>
                {/* Mobile Expiring Cards (block md:hidden) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {data.expiringSoon.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/admin/members/${item.member.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-blue-600 block"
                          >
                            {item.member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.member.memberId} • {item.member.phone}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-rose-600">
                          {formatDate(item.endDate)}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        Current Plan: <strong className="font-semibold text-slate-700">{item.planName}</strong>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`https://wa.me/91${item.member.phone}?text=Hi%20${encodeURIComponent(
                            item.member.fullName
                          )},%20your%20gym%20membership%20is%20expiring%20on%20${formatDate(
                            item.endDate
                          )}.%20Renew%20now%20to%20continue%20your%20fitness%20streak!%20💪`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 active:bg-slate-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <Link
                          href={`/admin/members/${item.member.id}`}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center shadow-xs active:bg-slate-800"
                        >
                          Renew
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Expiring Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Current Plan</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.expiringSoon.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3">
                            <Link
                              href={`/admin/members/${item.member.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 block"
                            >
                              {item.member.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              {item.member.memberId} • {item.member.phone}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">{item.planName}</td>
                          <td className="py-3 px-3 font-semibold text-rose-600">
                            {formatDate(item.endDate)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`https://wa.me/91${item.member.phone}?text=Hi%20${encodeURIComponent(
                                  item.member.fullName
                                )},%20your%20gym%20membership%20is%20expiring%20on%20${formatDate(
                                  item.endDate
                                )}.%20Renew%20now%20to%20continue%20your%20fitness%20streak!%20💪`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium inline-flex items-center gap-1 transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                              <Link
                                href={`/admin/members/${item.member.id}`}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
                              >
                                Renew
                              </Link>
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
      </div>

      {/* Collect Payment Modal */}
      {selectedDueMember && (
        <AddPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedDueMember(null);
          }}
          prefillMemberId={selectedDueMember.id}
          prefillMemberName={selectedDueMember.name}
          prefillDueAmount={selectedDueMember.amount}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

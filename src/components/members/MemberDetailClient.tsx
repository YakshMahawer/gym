"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Heart,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  ShieldAlert,
  IndianRupee,
  RefreshCw,
  Printer,
  Sparkles,
} from "lucide-react";
import { formatINR, formatDate, formatDateTime, calculateDaysRemaining } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { AddPTModal } from "@/components/modals/AddPTModal";
import { ReceiptModal } from "@/components/payments/ReceiptModal";
import { renewSubscription, deleteMember } from "@/lib/actions/members";
import { updatePTSessions } from "@/lib/actions/pt";
import { PaymentMethod } from "@prisma/client";
import { Dumbbell } from "lucide-react";

interface MemberDetailClientProps {
  member: any;
  plans: any[];
}

export function MemberDetailClient({ member, plans }: MemberDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "health">("overview");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [ptModalOpen, setPtModalOpen] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeSub = member.subscriptions?.[0];
  const daysLeft = activeSub ? calculateDaysRemaining(activeSub.endDate) : 0;
  const isExpired = daysLeft < 0 || member.membershipStatus === "EXPIRED";
  const isOngoing = activeSub && new Date(activeSub.endDate) > new Date();
  const dueAmount = activeSub?.dueAmount || 0;

  // Personal Training (PT) State
  const latestPT = member.ptSubscriptions?.[0];
  const ptDaysLeft = latestPT ? calculateDaysRemaining(latestPT.endDate) : 0;
  const isPTOngoing = latestPT && new Date(latestPT.endDate) > new Date();
  const isPTExpired = latestPT && (ptDaysLeft < 0 || latestPT.status === "EXPIRED");
  const ptDueAmount = latestPT?.dueAmount || 0;

  // Extension Start Date Logic: If member has an active package, new extension starts from day current plan ends!
  const defaultCalculatedStartDate = isOngoing
    ? new Date(activeSub.endDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Renewal Form state
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [renewalStartDate, setRenewalStartDate] = useState(defaultCalculatedStartDate);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const [renewalTotal, setRenewalTotal] = useState(selectedPlan?.price || 5000);
  const [renewalPaid, setRenewalPaid] = useState(selectedPlan?.price || 5000);
  const [renewalMethod, setRenewalMethod] = useState<PaymentMethod>("UPI");
  const [renewalLoading, setRenewalLoading] = useState(false);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const p = plans.find((item) => item.id === planId);
    if (p) {
      setRenewalTotal(p.price);
      setRenewalPaid(p.price);
    }
  };

  const handleOpenRenewal = () => {
    setRenewalStartDate(
      isOngoing
        ? new Date(activeSub.endDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setRenewalModalOpen(true);
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setRenewalLoading(true);
    const start = new Date(renewalStartDate);
    const end = new Date(start.getTime() + selectedPlan.durationInDays * 24 * 60 * 60 * 1000);

    const res = await renewSubscription({
      memberId: member.id,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      totalAmount: renewalTotal,
      paidAmount: renewalPaid,
      paymentMethod: renewalMethod,
      notes: "Membership renewal",
    });

    setRenewalLoading(false);
    if (res.success) {
      setRenewalModalOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to renew subscription");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete member ${member.fullName}?`)) {
      setDeleting(true);
      const res = await deleteMember(member.id);
      if (res.success) {
        router.push("/members");
        router.refresh();
      } else {
        alert(res.error || "Failed to delete");
        setDeleting(false);
      }
    }
  };

  const hasHealthFlags =
    member.qFaintOrDizzy ||
    member.qChestPain ||
    member.qRecentChestPain ||
    member.qBloodPressureHeart ||
    member.qDiabetes ||
    member.qJointBoneProblem ||
    member.qPregnant ||
    member.qOver65 ||
    Boolean(member.qOtherHealthIssues);

  const totalDuesAll = dueAmount + ptDueAmount;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <Link
            href="/members"
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition active:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-slate-900">{member.fullName}</h1>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                #{member.memberId}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  member.membershipStatus === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : member.membershipStatus === "INACTIVE"
                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {member.membershipStatus === "INACTIVE" ? "Inactive (No Plan)" : member.membershipStatus}
              </span>

              {latestPT && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isPTOngoing
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <Dumbbell className="w-3 h-3" />
                  <span>{isPTOngoing ? "PT Active" : "PT Expired"}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Enrolled: {formatDate(member.enrollDate)} • Trainer: {latestPT?.trainerName || member.representative || "None"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <a
            href={`https://wa.me/91${member.phone}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5 transition active:bg-slate-100"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          {/* PT Add-on / Renew PT Button */}
          <button
            onClick={() => setPtModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:bg-indigo-800"
          >
            <Dumbbell className="w-3.5 h-3.5 text-indigo-200" />
            <span>{isPTOngoing ? "Extend PT" : latestPT ? "Renew PT" : "+ PT Add-on"}</span>
          </button>

          {/* Primary Action Button based on member status and dues */}
          {member.membershipStatus === "INACTIVE" || !activeSub ? (
            <button
              onClick={handleOpenRenewal}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Assign Plan & Activate</span>
            </button>
          ) : totalDuesAll > 0 ? (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:bg-rose-800"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Collect Due ({formatINR(totalDuesAll)})</span>
            </button>
          ) : (
            <button
              onClick={handleOpenRenewal}
              className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isOngoing ? "Extend Plan" : "Renew Plan"}</span>
            </button>
          )}

          <Link
            href={`/members/${member.id}/edit`}
            className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition"
            title="Edit Details"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 sm:p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg transition"
            title="Delete Member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Info + Detailed Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Left Column: Membership Card & PT Card */}
        <div className="space-y-3.5 sm:space-y-4">
          
          {/* Membership Pass Card / Inactive Notice */}
          {activeSub ? (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">Membership Pass</span>
                <span className="font-mono font-bold text-slate-800">#{member.memberId}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{member.fullName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{member.phone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-semibold text-slate-900">{activeSub.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires:</span>
                  <span className="font-medium text-slate-800">{formatDate(activeSub.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-semibold ${isExpired ? "text-rose-600" : "text-emerald-700"}`}>
                    {isExpired ? "Expired" : `${daysLeft} Days Left`}
                  </span>
                </div>
              </div>

              {isOngoing && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Renewal will automatically start on {formatDate(activeSub.endDate)}.</span>
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Goal: {member.programme || "Fitness"}</span>
                <span>Source: {member.source || "Walk-in"}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">Membership Status</span>
                <span className="font-mono font-bold text-slate-800">#{member.memberId}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{member.fullName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{member.phone}</p>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>No Active Plan Assigned</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  This member was registered via Quick Save. Assign a membership package and record payment details to activate.
                </p>
                <button
                  onClick={handleOpenRenewal}
                  className="w-full mt-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 active:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Assign Plan & Collect Fee</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Goal: {member.programme || "Fitness"}</span>
                <span>Source: {member.source || "Walk-in"}</span>
              </div>
            </div>
          )}

          {/* Dedicated Personal Training (PT) Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Dumbbell className="w-4 h-4 text-indigo-600" />
                <span>Personal Training (PT)</span>
              </div>
              <button
                onClick={() => setPtModalOpen(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {latestPT ? "Manage / Renew" : "+ Add PT"}
              </button>
            </div>

            {latestPT ? (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/80 space-y-2.5 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 block">{latestPT.planName}</span>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        Trainer: <strong className="font-semibold">{latestPT.trainerName || "General Trainer"}</strong>
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isPTOngoing
                          ? "bg-indigo-600 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isPTOngoing ? `${ptDaysLeft}d left` : "Expired"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-indigo-100/60 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Start Date:</span>
                      <span className="font-medium text-slate-800">{formatDate(latestPT.startDate)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Expiry Date:</span>
                      <span className="font-semibold text-slate-900">{formatDate(latestPT.endDate)}</span>
                    </div>
                    {latestPT.dueAmount > 0 && (
                      <div className="flex justify-between text-rose-600 pt-1 font-bold">
                        <span>Pending Due:</span>
                        <span>{formatINR(latestPT.dueAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-500">No active Personal Training package.</p>
                <button
                  onClick={() => setPtModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Add PT Add-on</span>
                </button>
              </div>
            )}
          </div>

          {/* Pending Due Box if any */}
          {totalDuesAll > 0 && (
            <div className="p-4 bg-white border border-rose-200/80 rounded-xl space-y-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pending Balance</span>
                </span>
                <span className="text-sm font-bold text-rose-700">{formatINR(totalDuesAll)}</span>
              </div>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition active:bg-slate-800"
              >
                Collect Balance
              </button>
            </div>
          )}

          {/* Health Alert Callout */}
          {hasHealthFlags && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Trainer Medical Notice</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-normal">
                Check Health Questionnaire before prescribing heavy workout loads.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Tabbed Detailed Views */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "overview"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Profile Details
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "payments"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Payments & Receipts ({member.payments?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("health")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === "health"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Health Questionnaire
              </button>
            </div>

            {/* TAB 1: Profile Details */}
            {activeTab === "overview" && (
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Phone</span>
                    <span className="font-semibold text-slate-800 text-sm">{member.phone}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Email</span>
                    <span className="font-semibold text-slate-800">{member.email || "None"}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{formatDate(member.dob)}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Gender</span>
                    <span className="font-semibold text-slate-800">{member.gender || "Male"}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Occupation & Designation</span>
                    <span className="font-semibold text-slate-800">
                      {member.occupation ? `${member.occupation} (${member.designation || "Staff"})` : "None"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Marital Status</span>
                    <span className="font-semibold text-slate-800">
                      {member.isMarried
                        ? `Married (${member.spouseName || "Spouse"})${
                            member.anniversaryDate ? ` • Anni: ${formatDate(member.anniversaryDate)}` : ""
                          }`
                        : "Single"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Referred By</span>
                    <span className="font-semibold text-slate-800">{member.referredBy || "Direct Walk-in"}</span>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Assigned Representative</span>
                    <span className="font-semibold text-slate-800">{member.representative || "None"}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Address</span>
                  <span className="font-medium text-slate-800">{member.address || "No address on record"}</span>
                </div>

                {member.notes && (
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-medium block">Notes</span>
                    <p className="text-slate-700 mt-1">{member.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Payments with Print Receipt */}
            {activeTab === "payments" && (
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-800">Payment Transactions</h4>
                  
                  <div className="flex items-center gap-2">
                    {totalDuesAll > 0 ? (
                      <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition"
                      >
                        Collect Due ({formatINR(totalDuesAll)})
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenRenewal}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        <span>Renew / Extend</span>
                      </button>
                    )}
                  </div>
                </div>

                {member.payments?.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">No payment records found.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Transactions List (block md:hidden) */}
                    <div className="grid grid-cols-1 gap-2.5 md:hidden">
                      {member.payments.map((pm: any) => (
                        <div
                          key={pm.id}
                          className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono font-bold text-xs text-slate-900 block">
                                {pm.receiptNo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDateTime(pm.paymentDate)}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-emerald-700">
                              {formatINR(pm.amount)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/50">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>Mode: <strong className="font-semibold">{pm.paymentMethod}</strong></span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  pm.paymentType === "PERSONAL_TRAINING"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {pm.paymentType === "PERSONAL_TRAINING" ? "🎯 PT Add-on" : pm.paymentType?.replace(/_/g, " ")}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setSelectedReceiptForPrint({
                                  ...pm,
                                  member: {
                                    fullName: member.fullName,
                                    memberId: member.memberId,
                                    phone: member.phone,
                                  },
                                })
                              }
                              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 active:bg-slate-100"
                            >
                              <Printer className="w-3 h-3" />
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
                          <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                            <th className="py-2.5 px-3">Receipt</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Mode</th>
                            <th className="py-2.5 px-3">Payment Type</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {member.payments.map((pm: any) => (
                            <tr key={pm.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{pm.receiptNo}</td>
                              <td className="py-2.5 px-3 text-slate-500">{formatDateTime(pm.paymentDate)}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">{pm.paymentMethod}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                                    pm.paymentType === "PERSONAL_TRAINING"
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {pm.paymentType === "PERSONAL_TRAINING" ? "🎯 PT Add-on" : pm.paymentType?.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">{formatINR(pm.amount)}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() =>
                                    setSelectedReceiptForPrint({
                                      ...pm,
                                      member: {
                                        fullName: member.fullName,
                                        memberId: member.memberId,
                                        phone: member.phone,
                                      },
                                    })
                                  }
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

            {/* TAB 3: Health */}
            {activeTab === "health" && (
              <div className="p-5 space-y-3">
                <h4 className="font-semibold text-xs text-slate-800">Physical Readiness Questionnaire</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Ever faint / get dizzy / loss of balance?", val: member.qFaintOrDizzy },
                    { label: "Chest pain during physical activity?", val: member.qChestPain },
                    { label: "Chest pain in past month at rest?", val: member.qRecentChestPain },
                    { label: "High Blood Pressure / Heart condition?", val: member.qBloodPressureHeart },
                    { label: "Insulin-dependent diabetes?", val: member.qDiabetes },
                    { label: "Joint, bone or spinal orthopedic injury?", val: member.qJointBoneProblem },
                    { label: "Currently pregnant or nursing?", val: member.qPregnant },
                    { label: "Age 65+ and new to exercise?", val: member.qOver65 },
                  ].map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                        q.val ? "bg-rose-50/50 border-rose-200 text-rose-900" : "bg-slate-50 border-slate-100 text-slate-700"
                      }`}
                    >
                      <span>{q.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          q.val ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {q.val ? "YES" : "NO"}
                      </span>
                    </div>
                  ))}
                </div>

                {member.qOtherHealthIssues && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <span className="text-slate-400 block font-medium">Remarks</span>
                    <p className="text-slate-800 mt-0.5">{member.qOtherHealthIssues}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <AddPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        prefillMemberId={member.id}
        prefillMemberName={member.fullName}
        prefillDueAmount={totalDuesAll}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Add / Renew PT Modal */}
      <AddPTModal
        isOpen={ptModalOpen}
        onClose={() => setPtModalOpen(false)}
        member={{
          id: member.id,
          fullName: member.fullName,
          memberId: member.memberId,
          phone: member.phone,
          representative: member.representative,
          activePT: latestPT,
        }}
        onSuccess={() => {
          router.refresh();
        }}
        onPrintReceipt={(receipt) => {
          setSelectedReceiptForPrint(receipt);
        }}
      />

      {/* Renewal Modal */}
      {renewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {!activeSub
                    ? "Assign Membership Package & Activate"
                    : isOngoing
                    ? "Renew / Extend Plan"
                    : "Renew Membership"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {member.fullName} ({member.memberId}) {!activeSub && "• Initial Plan Assignment"}
                </p>
              </div>
              <button onClick={() => setRenewalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleRenew} className="p-6 space-y-4">
              {isOngoing && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-0.5">
                  <p className="font-bold">Current Active Plan: {activeSub?.planName}</p>
                  <p className="text-[11px]">
                    Valid till {formatDate(activeSub?.endDate)}. Renewal automatically begins on <strong className="font-semibold">{formatDate(renewalStartDate)}</strong>.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Choose Package</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price.toLocaleString("en-IN")} ({p.durationInDays} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isOngoing ? "Extension Start Date (From Expiry)" : "Start Date"}
                </label>
                <input
                  type="date"
                  value={renewalStartDate}
                  onChange={(e) => setRenewalStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={renewalTotal === 0 ? "" : renewalTotal}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, "");
                      setRenewalTotal(raw === "" ? 0 : Number(raw));
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Paid Today (₹)</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRenewalPaid(renewalTotal)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 transition"
                        title="Set full package fee as paid"
                      >
                        Paid Full
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenewalPaid(0)}
                        className="text-[10px] text-rose-700 hover:text-rose-800 font-semibold bg-rose-50 hover:bg-rose-100 px-1.5 py-0.2 rounded border border-rose-200 transition"
                        title="Mark full package fee as due"
                      >
                        Full Due (₹0)
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={renewalPaid === 0 ? "" : renewalPaid}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, "");
                      setRenewalPaid(raw === "" ? 0 : Number(raw));
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg font-semibold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={renewalMethod}
                  onChange={(e) => setRenewalMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewalLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
                >
                  {renewalLoading ? "Saving..." : !activeSub ? "Activate Membership" : "Confirm Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptForPrint && (
        <ReceiptModal
          receipt={selectedReceiptForPrint}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}
    </div>
  );
}

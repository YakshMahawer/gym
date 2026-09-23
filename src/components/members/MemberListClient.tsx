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
  Hash,
  X,
  Sparkles,
  Phone,
} from "lucide-react";
import { formatINR, formatDate, calculateDaysRemaining } from "@/lib/utils";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { resequenceAllMembers } from "@/lib/actions/members";

interface MemberListClientProps {
  members: any[];
}

export function MemberListClient({ members }: MemberListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlyDues, setOnlyDues] = useState(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    dueAmount: number;
  } | null>(null);

  // Resequencing modal state
  const [reseqModalOpen, setReseqModalOpen] = useState(false);
  const [startSeqNum, setStartSeqNum] = useState(1001);
  const [resequencing, setResequencing] = useState(false);
  const [reseqMsg, setReseqMsg] = useState<string | null>(null);

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.fullName.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q));

    const latestSub = m.subscriptions?.[0];
    const dueAmount = latestSub?.dueAmount || 0;

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? m.membershipStatus === "ACTIVE"
        : statusFilter === "EXPIRED"
        ? m.membershipStatus === "EXPIRED"
        : true;

    const matchesDue = onlyDues ? dueAmount > 0 : true;

    return matchesSearch && matchesStatus && matchesDue;
  });

  // Always keep sorting based on ID highest to lowest (descending numeric order: e.g. GYM-4233, GYM-1006, GYM-1005...)
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const numA = parseInt(a.memberId?.replace(/\D/g, "") || "0", 10);
    const numB = parseInt(b.memberId?.replace(/\D/g, "") || "0", 10);
    return numB - numA;
  });

  const handleOpenPayment = (memberId: string, fullName: string, due: number) => {
    setSelectedMember({ id: memberId, name: fullName, dueAmount: due });
    setPaymentModalOpen(true);
  };

  const handleResequence = async () => {
    setResequencing(true);
    const res = await resequenceAllMembers(Number(startSeqNum) || 1001);
    setResequencing(false);

    if (res.success) {
      setReseqMsg(`Successfully re-sequenced all ${res.count} members!`);
      setTimeout(() => {
        setReseqMsg(null);
        setReseqModalOpen(false);
        router.refresh();
      }, 1500);
    } else {
      alert(res.error || "Failed to re-sequence members");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage athlete records, check active subscription validity, and collect pending fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Re-sequence IDs Tool Button */}
          <button
            onClick={() => setReseqModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            title="Cleanly re-sequence all Member IDs sequentially starting from 1001"
          >
            <Hash className="w-3.5 h-3.5 text-slate-600" />
            <span>Re-sequence Sequence</span>
          </button>

          <Link
            href="/members/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, phone, or GYM-ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Quick Count Badge */}
          <div className="text-xs font-medium text-slate-500 self-end sm:self-auto">
            Showing <strong className="font-semibold text-slate-800">{sortedMembers.length}</strong> of {members.length} athletes
          </div>
        </div>

        {/* Filter Pills with Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto text-xs">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setOnlyDues(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
              statusFilter === "ALL" && !onlyDues
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            All Members ({members.length})
          </button>

          <button
            onClick={() => {
              setStatusFilter("ACTIVE");
              setOnlyDues(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
              statusFilter === "ACTIVE" && !onlyDues
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Active
          </button>

          <button
            onClick={() => {
              setStatusFilter("EXPIRED");
              setOnlyDues(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
              statusFilter === "EXPIRED" && !onlyDues
                ? "bg-rose-700 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Expired
          </button>

          <button
            onClick={() => setOnlyDues(!onlyDues)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1 ${
              onlyDues
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Dues Only</span>
          </button>
        </div>
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
                const dueAmount = activeSub?.dueAmount || 0;
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
                          <Link
                            href={`/members/${member.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 block leading-tight"
                          >
                            {member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {member.phone}
                          </span>
                        </div>
                      </div>

                      {dueAmount > 0 ? (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          Due: {formatINR(dueAmount)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Paid
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-700">{activeSub?.planName || "No Plan"}</span>
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

                      {dueAmount > 0 && (
                        <button
                          onClick={() => handleOpenPayment(member.id, member.fullName, dueAmount)}
                          className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs active:bg-rose-800"
                        >
                          Collect
                        </button>
                      )}

                      <Link
                        href={`/members/${member.id}`}
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
                    <th className="py-2.5 px-4">Member ID</th>
                    <th className="py-2.5 px-4">Athlete Details</th>
                    <th className="py-2.5 px-4">Active Plan</th>
                    <th className="py-2.5 px-4">Validity</th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4">Representative</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sortedMembers.map((member) => {
                    const activeSub = member.subscriptions?.[0];
                    const dueAmount = activeSub?.dueAmount || 0;
                    const daysLeft = activeSub ? calculateDaysRemaining(activeSub.endDate) : 0;
                    const isExpired = daysLeft < 0 || member.membershipStatus === "EXPIRED";

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition">
                        
                        {/* Member Sequential ID */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-xs">
                            {member.memberId}
                          </span>
                        </td>

                        {/* Member Info */}
                        <td className="py-3 px-4">
                          <Link
                            href={`/members/${member.id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 block"
                          >
                            {member.fullName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {member.phone}
                          </span>
                        </td>

                        {/* Active Plan */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700 block">
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
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3 px-4">
                          {dueAmount > 0 ? (
                            <div>
                              <span className="font-bold text-rose-600">
                                Due: {formatINR(dueAmount)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Paid</span>
                            </span>
                          )}
                        </td>

                        {/* Representative */}
                        <td className="py-3 px-4 text-slate-500">
                          {member.representative || "None"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {dueAmount > 0 && (
                              <button
                                onClick={() => handleOpenPayment(member.id, member.fullName, dueAmount)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
                              >
                                Collect
                              </button>
                            )}

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
                              href={`/members/${member.id}`}
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

      {/* Re-sequence All Members Modal */}
      {reseqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-700" />
                  <span>Re-sequence Member IDs</span>
                </h3>
                <p className="text-xs text-slate-400">Maintain clean unbroken numbering</p>
              </div>
              <button
                onClick={() => setReseqModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              {reseqMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{reseqMsg}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="font-bold text-slate-800">
                  How Sequence Ordering Works:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  All <strong>{members.length} members</strong> will be renumbered consecutively starting from the base number based on enrollment chronology.
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Whenever you assign a custom number (e.g. 1003) to any member, all members after that number are automatically shifted by +1 to maintain sequence.</em>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starting Sequence Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={startSeqNum}
                  onChange={(e) => setStartSeqNum(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Sequence will range from <strong>{startSeqNum}</strong> to <strong>{startSeqNum + Math.max(0, members.length - 1)}</strong>.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReseqModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resequencing}
                  onClick={handleResequence}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {resequencing ? "Re-sequencing..." : "Confirm & Re-sequence"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

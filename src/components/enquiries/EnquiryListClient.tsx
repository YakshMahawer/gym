"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Phone,
  Calendar,
  Tag,
  Trash2,
  MessageCircle,
  Plus,
  ArrowRight,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { updateEnquiryStatus, deleteEnquiry } from "@/lib/actions/enquiries";
import { NewEnquiryModal } from "@/components/modals/NewEnquiryModal";
import { EnquiryStatus } from "@prisma/client";
import { exportToExcel } from "@/lib/export-excel";

interface EnquiryListClientProps {
  enquiries: any[];
  plans?: Array<{ id: string; name: string; price: number; durationInDays: number }>;
}

export function EnquiryListClient({ enquiries, plans = [] }: EnquiryListClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredEnquiries = enquiries.filter((enq) => {
    const q = search.toLowerCase();
    const matchesSearch =
      enq.name.toLowerCase().includes(q) ||
      enq.phone.includes(q) ||
      (enq.email && enq.email.toLowerCase().includes(q)) ||
      (enq.preferredPlan && enq.preferredPlan.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "ALL" ? true : enq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    setLoadingId(id);
    const res = await updateEnquiryStatus(id, newStatus);
    setLoadingId(null);
    if (res.success) {
      router.refresh();
    } else {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete enquiry for ${name}?`)) {
      setLoadingId(id);
      const res = await deleteEnquiry(id);
      setLoadingId(null);
      if (res.success) {
        router.refresh();
      }
    }
  };

  const handleExportEnquiries = () => {
    exportToExcel({
      data: filteredEnquiries,
      fileName: "Gym_Enquiries_Leads",
      sheetName: "Enquiries",
      columns: [
        { header: "Name", accessor: (e) => e.name },
        { header: "Mobile", accessor: (e) => e.phone },
        { header: "Email", accessor: (e) => e.email || "" },
        { header: "Gender", accessor: (e) => e.gender || "Male" },
        { header: "Status", accessor: (e) => e.status },
        { header: "Preferred Plan", accessor: (e) => e.preferredPlan || "General" },
        { header: "Source", accessor: (e) => e.source || "Walk-in" },
        { header: "Budget", accessor: (e) => e.budget || "" },
        { header: "Follow-Up Date", accessor: (e) => (e.followUpDate ? formatDate(e.followUpDate) : "") },
        { header: "Notes", accessor: (e) => e.notes || "" },
        { header: "Assigned Staff", accessor: (e) => e.assignedTo || "" },
        { header: "Created At", accessor: (e) => (e.createdAt ? formatDate(e.createdAt) : "") },
      ],
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Enquiries & Leads Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track prospective visitor inquiries, scheduled follow-up calls, and conversions to members.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition active:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, phone, plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Status Filters & Export */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <div className="flex items-center gap-1.5">
            {["ALL", "NEW", "FOLLOW_UP", "CONVERTED", "LOST"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "ALL" ? `All (${enquiries.length})` : st.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportEnquiries}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition active:bg-slate-200 whitespace-nowrap shrink-0"
            title="Download filtered enquiries as Excel (.xlsx) with auto-filters"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Leads Content */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredEnquiries.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Enquiries Found</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;New Enquiry&quot; to log a visitor.</p>
          </div>
        ) : (
          <>
            {/* Mobile Lead Cards View (block md:hidden) */}
            <div className="p-3 grid grid-cols-1 gap-2.5 md:hidden">
              {filteredEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{enq.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{enq.phone}</span>
                    </div>

                    <select
                      value={enq.status}
                      onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
                      disabled={loadingId === enq.id}
                      className={`text-[11px] font-bold px-2 py-1 rounded-md border focus:outline-none bg-white ${
                        enq.status === "CONVERTED"
                          ? "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                          : enq.status === "FOLLOW_UP"
                          ? "text-amber-700 border-amber-200 bg-amber-50/50"
                          : enq.status === "LOST"
                          ? "text-slate-500 border-slate-200"
                          : "text-blue-700 border-blue-200 bg-blue-50/50"
                      }`}
                    >
                      <option value="NEW">New Lead</option>
                      <option value="FOLLOW_UP">Follow Up</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Plan: <strong className="font-semibold text-slate-700">{enq.preferredPlan || "General"}</strong></span>
                    <span>Follow-up: {formatDate(enq.followUpDate)}</span>
                  </div>

                  {enq.notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                      &quot;{enq.notes}&quot;
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <a
                      href={`tel:${enq.phone}`}
                      className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:bg-slate-100"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://wa.me/91${enq.phone}?text=Hi%20${encodeURIComponent(
                        enq.name
                      )},%20greetings%20from%20Concept%20I%20Gym!%20We%20are%20reaching%20out%20regarding%20your%20membership%20enquiry.`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-emerald-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 active:bg-slate-100"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {enq.status !== "CONVERTED" && (
                      <Link
                        href={`/portal/members/new?name=${encodeURIComponent(
                          enq.name
                        )}&phone=${encodeURIComponent(enq.phone)}&plan=${encodeURIComponent(
                          enq.preferredPlan || ""
                        )}`}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold text-center shadow-xs active:bg-slate-800"
                      >
                        Convert
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(enq.id, enq.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Interested Plan & Source</th>
                    <th className="py-2.5 px-4">Follow-up Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEnquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-slate-50/60 transition">
                      
                      {/* Contact */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{enq.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{enq.phone}</span>
                      </td>

                      {/* Plan & Source */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">
                          {enq.preferredPlan || "General Membership"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Source: {enq.source || "Walk-in"}
                        </span>
                      </td>

                      {/* Follow-up Date */}
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(enq.followUpDate)}
                      </td>

                      {/* Status Dropdown - No trial option */}
                      <td className="py-3 px-4">
                        <select
                          value={enq.status}
                          onChange={(e) => handleStatusChange(enq.id, e.target.value as EnquiryStatus)}
                          disabled={loadingId === enq.id}
                          className={`text-xs font-semibold px-2 py-1 rounded border focus:outline-none bg-white transition ${
                            enq.status === "CONVERTED"
                              ? "text-emerald-700 border-emerald-200"
                              : enq.status === "FOLLOW_UP"
                              ? "text-amber-700 border-amber-200"
                              : enq.status === "LOST"
                              ? "text-slate-500 border-slate-200"
                              : "text-blue-700 border-blue-200"
                          }`}
                        >
                          <option value="NEW">New Lead</option>
                          <option value="FOLLOW_UP">Follow Up</option>
                          <option value="CONVERTED">Converted</option>
                          <option value="LOST">Lost</option>
                        </select>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs text-slate-500 line-clamp-1">
                        {enq.notes || "-"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/91${enq.phone}?text=Hi%20${encodeURIComponent(
                              enq.name
                            )},%20greetings%20from%20Concept%20I%20Gym!%20We%20are%20reaching%20out%20regarding%20your%20membership%20enquiry.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <a
                            href={`tel:${enq.phone}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {enq.status !== "CONVERTED" && (
                            <Link
                              href={`/portal/members/new?name=${encodeURIComponent(
                                enq.name
                              )}&phone=${encodeURIComponent(enq.phone)}&plan=${encodeURIComponent(
                                enq.preferredPlan || ""
                              )}`}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(enq.id, enq.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add Enquiry Modal */}
      <NewEnquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        plans={plans}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

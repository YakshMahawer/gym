"use client";

import React, { useState } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  RefreshCw,
  Phone,
  User,
  Gift,
} from "lucide-react";
import { sendMembershipExtensionWhatsAppAction } from "@/lib/actions/whatsapp-automation";
import { formatDate } from "@/lib/utils";

interface SendExtensionWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    fullName: string;
    phone?: string | null;
    planName?: string | null;
    endDate?: string | Date | null;
  };
  onSuccess?: () => void;
}

export function SendExtensionWhatsAppModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: SendExtensionWhatsAppModalProps) {
  const [mode, setMode] = useState<"now" | "schedule">("now");

  // Default offer validity: 7 days from now (YYYY-MM-DD)
  const getDefaultOfferDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  // Default schedule: tomorrow at 10:00 AM (YYYY-MM-DDTHH:mm)
  const getDefaultScheduleDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [offerValidUntil, setOfferValidUntil] = useState<string>(getDefaultOfferDate());
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(getDefaultScheduleDateTime());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const firstName = member.fullName.trim().split(" ")[0] || "Member";
  const formattedPreviewDate = offerValidUntil ? formatDate(new Date(offerValidUntil)) : "";

  const handleDispatch = async () => {
    setError(null);
    setSuccess(null);

    if (!offerValidUntil) {
      setError("Please specify the offer validity date.");
      return;
    }

    setLoading(true);

    try {
      const scheduledFor = mode === "schedule" ? new Date(scheduleDateTime) : null;
      if (mode === "schedule") {
        if (!scheduledFor || isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
          setError("Please select a future date and time.");
          setLoading(false);
          return;
        }
      }

      const res = await sendMembershipExtensionWhatsAppAction({
        memberId: member.id,
        offerValidUntil: new Date(offerValidUntil),
        scheduledFor,
      });

      if (res.success) {
        setSuccess(res.message || "Membership extension offer processed!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to process membership extension message.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Compact Header */}
        <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900">Membership Extension Offer</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Active Member
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Body */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Member Details in 1 Compact Box */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{member.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-0.5 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                {member.phone || "No phone"}
              </span>
              {member.endDate && (
                <>
                  <span className="text-slate-400">·</span>
                  <span>Exp: {formatDate(member.endDate)}</span>
                </>
              )}
            </div>
          </div>

          {/* Offer Validity Date Input (Parameter 2) */}
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1 text-emerald-950 text-[11px]">
                <Calendar className="w-3 h-3 text-emerald-600" />
                Offer Valid Until Date (Param 2)
              </span>
              {formattedPreviewDate && (
                <span className="text-[10px] text-emerald-700 font-bold font-mono">
                  &quot;{formattedPreviewDate}&quot;
                </span>
              )}
            </div>
            <input
              type="date"
              value={offerValidUntil}
              onChange={(e) => setOfferValidUntil(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
          </div>

          {/* Segmented Mode Selector */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setMode("now")}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === "now"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Send className="w-3 h-3 text-emerald-600" />
                <span>Send Now</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("schedule")}
                className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === "schedule"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Schedule</span>
              </button>
            </div>
          </div>

          {/* Schedule Picker (Only shown when mode === "schedule") */}
          {mode === "schedule" && (
            <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1 text-indigo-950 text-[11px]">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  Scheduled Date & Time
                </span>
                <span className="text-[10px] text-indigo-600 font-normal">Auto-dispatched</span>
              </div>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={loading || !member.phone}
            className={`px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              mode === "schedule"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : mode === "schedule" ? (
              <Clock className="w-3 h-3" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            <span>
              {loading
                ? mode === "schedule"
                  ? "Scheduling..."
                  : "Sending..."
                : mode === "schedule"
                ? "Schedule Offer"
                : "Send Offer Now"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

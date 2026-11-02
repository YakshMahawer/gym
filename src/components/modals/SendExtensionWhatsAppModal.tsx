"use client";

import React, { useState } from "react";
import {
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
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
      setError("Please specify the date until which this extension offer is valid.");
      return;
    }

    setLoading(true);

    try {
      const scheduledFor = mode === "schedule" ? new Date(scheduleDateTime) : null;
      if (mode === "schedule") {
        if (!scheduledFor || isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
          setError("Please select a future date and time for the scheduled message.");
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
        setSuccess(res.message || "Membership extension reminder processed successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">Membership Extension Offer</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Active Only
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Template: membership_extension_reminder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Member Details */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <User className="w-4 h-4 text-slate-500" />
                <span>{member.fullName}</span>
              </div>
              {member.planName && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {member.planName}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                {member.phone || "No phone registered"}
              </span>
              {member.endDate && (
                <span className="text-slate-500">
                  Current Expiry: <strong className="text-slate-700">{formatDate(member.endDate)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Offer Validity Date Input (Parameter 2) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Offer Valid Until (Parameter 2)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Populates {"{{2}}"}</span>
            </label>
            <input
              type="date"
              value={offerValidUntil}
              onChange={(e) => setOfferValidUntil(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900"
            />
            {formattedPreviewDate && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Will show in message as: &quot;{formattedPreviewDate}&quot;
              </p>
            )}
          </div>

          {/* Dispatch Mode: Send Now vs Schedule */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Choose Dispatch Mode
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("now")}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  mode === "now"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Send className={`w-4 h-4 mt-0.5 ${mode === "now" ? "text-emerald-600" : "text-slate-400"}`} />
                <div>
                  <span className="font-bold text-xs block">Send Now</span>
                  <span className="text-[10px] text-slate-500">Dispatch directly</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("schedule")}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  mode === "schedule"
                    ? "bg-indigo-50/70 border-indigo-400 text-indigo-950 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Clock className={`w-4 h-4 mt-0.5 ${mode === "schedule" ? "text-indigo-600" : "text-slate-400"}`} />
                <div>
                  <span className="font-bold text-xs block">Schedule</span>
                  <span className="text-[10px] text-slate-500">Queue for future</span>
                </div>
              </button>
            </div>
          </div>

          {/* Schedule Date & Time Picker */}
          {mode === "schedule" && (
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Schedule Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-[11px] text-indigo-700">
                The offer reminder will be sent to {firstName} automatically on this date.
              </p>
            </div>
          )}

          {/* Variables Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Template Parameters Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-slate-400 block font-sans text-[9px]">Param 1 (Name):</span>
                <span className="font-bold text-slate-800">{firstName}</span>
              </div>
              <div className="bg-white p-1.5 rounded border border-slate-200">
                <span className="text-slate-400 block font-sans text-[9px]">Param 2 (Offer Date):</span>
                <span className="font-bold text-slate-800">{formattedPreviewDate || "Select Date"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={loading || !member.phone}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : mode === "schedule" ? (
              <Clock className="w-3.5 h-3.5" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {loading
                ? mode === "schedule"
                  ? "Scheduling..."
                  : "Sending..."
                : mode === "schedule"
                ? "Schedule Extension Offer"
                : "Send Extension Offer"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}


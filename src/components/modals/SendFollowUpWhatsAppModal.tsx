"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  RefreshCw,
  Phone,
  User,
  Sparkles,
} from "lucide-react";
import { sendCustomerFollowUpWhatsAppAction } from "@/lib/actions/whatsapp-automation";

interface SendFollowUpWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    name: string;
    phone: string;
    memberId?: string;
    enquiryId?: string;
    planOrStatus?: string;
  };
  onSuccess?: () => void;
}

export function SendFollowUpWhatsAppModal({
  isOpen,
  onClose,
  recipient,
  onSuccess,
}: SendFollowUpWhatsAppModalProps) {
  const [mode, setMode] = useState<"now" | "schedule">("now");

  // Default schedule: tomorrow at 10:00 AM
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  const [scheduleDateTime, setScheduleDateTime] = useState<string>(getTomorrowString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const firstName = recipient.name.trim().split(" ")[0] || "Customer";

  const handleDispatch = async () => {
    setError(null);
    setSuccess(null);
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

      const res = await sendCustomerFollowUpWhatsAppAction({
        recipientName: recipient.name,
        recipientPhone: recipient.phone,
        enquiryId: recipient.enquiryId,
        memberId: recipient.memberId,
        scheduledFor,
      });

      if (res.success) {
        setSuccess(res.message || "Follow-up WhatsApp processed successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Failed to dispatch WhatsApp message.");
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
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Follow-up WhatsApp</h3>
              <p className="text-[11px] text-slate-400">Template: customer_followup_update</p>
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

          {/* Recipient Details */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <User className="w-4 h-4 text-slate-500" />
                <span>{recipient.name}</span>
              </div>
              {recipient.planOrStatus && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {recipient.planOrStatus}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-slate-400" />
                {recipient.phone}
              </span>
              <span className="text-slate-500">
                1st Parameter: <strong className="text-slate-800 font-semibold">&quot;{firstName}&quot;</strong>
              </span>
            </div>
          </div>

          {/* Mode Option: Send Now vs Schedule */}
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
                    ? "bg-amber-50/70 border-amber-400 text-amber-950 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Send className={`w-4 h-4 mt-0.5 ${mode === "now" ? "text-amber-600" : "text-slate-400"}`} />
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
                  <span className="text-[10px] text-slate-500">Send on set date</span>
                </div>
              </button>
            </div>
          </div>

          {/* Schedule Date & Time Picker */}
          {mode === "schedule" && (
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
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
                The message will be queued and automatically sent to {firstName} at the scheduled time.
              </p>
            </div>
          )}

          {/* Template Info Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Fast2SMS Template Details</span>
            </div>
            <p>
              Sends official follow-up template addressed to <strong>{firstName}</strong>.
            </p>
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
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
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
                ? "Schedule WhatsApp"
                : "Send Follow-up WhatsApp"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}


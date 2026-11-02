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
  Trash2,
  Check,
} from "lucide-react";
import {
  sendCustomerFollowUpWhatsAppAction,
  cancelScheduledWhatsAppMessageAction,
} from "@/lib/actions/whatsapp-automation";
import { formatDateTime } from "@/lib/utils";

interface SendFollowUpWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    name: string;
    phone: string;
    enquiryId?: string;
    memberId?: string;
    planOrStatus?: string;
    scheduledWhatsApp?: {
      id: string;
      status: string; // "PENDING" | "SENT"
      scheduledFor: string;
      sentAt?: string | null;
      sentBy?: string | null;
    } | null;
  };
  onSuccess?: () => void;
}

export function SendFollowUpWhatsAppModal({
  isOpen,
  onClose,
  recipient,
  onSuccess,
}: SendFollowUpWhatsAppModalProps) {
  const isAlreadyPending = recipient.scheduledWhatsApp?.status === "PENDING";
  const isAlreadySent = recipient.scheduledWhatsApp?.status === "SENT";

  const [mode, setMode] = useState<"now" | "schedule">(
    isAlreadyPending ? "schedule" : "now"
  );

  // Default schedule: prefill with existing schedule or tomorrow 10:00 AM
  const getInitialScheduleString = () => {
    if (recipient.scheduledWhatsApp?.scheduledFor) {
      try {
        const d = new Date(recipient.scheduledWhatsApp.scheduledFor);
        if (!isNaN(d.getTime())) {
          return d.toISOString().slice(0, 16);
        }
      } catch {}
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [scheduleDateTime, setScheduleDateTime] = useState<string>(
    getInitialScheduleString()
  );
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
          setError("Please select a future date and time.");
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
        setSuccess(
          mode === "schedule"
            ? isAlreadyPending
              ? "Schedule updated successfully!"
              : "Message scheduled successfully!"
            : "Follow-up WhatsApp sent successfully!"
        );
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to process WhatsApp message.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!recipient.scheduledWhatsApp?.id) return;
    setError(null);
    setCancelling(true);

    try {
      const res = await cancelScheduledWhatsAppMessageAction(
        recipient.scheduledWhatsApp.id
      );
      if (res.success) {
        setSuccess("Scheduled message cancelled successfully.");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Failed to cancel scheduled message.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel schedule.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Compact Header */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900">Follow-up WhatsApp</h3>
                <span className="text-[10px] font-mono text-slate-400">customer_followup_update</span>
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

          {/* Already Scheduled Banner */}
          {isAlreadyPending && (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-indigo-950">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  Currently Scheduled
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  {formatDateTime(recipient.scheduledWhatsApp!.scheduledFor)}
                </span>
              </div>
              <p className="text-[11px] text-indigo-800/80 leading-tight">
                Queued by {recipient.scheduledWhatsApp!.sentBy || "Staff"}. You can change the time below, send now, or cancel.
              </p>
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCancelSchedule}
                  disabled={cancelling || loading}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-100/60 rounded-md transition flex items-center gap-1 border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{cancelling ? "Cancelling..." : "Cancel Schedule"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Already Sent Banner */}
          {isAlreadySent && !isAlreadyPending && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-1 font-semibold text-[11px]">
                <Check className="w-3 h-3 text-emerald-600" />
                Sent on {formatDateTime(recipient.scheduledWhatsApp!.sentAt || recipient.scheduledWhatsApp!.scheduledFor)}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Can send again below</span>
            </div>
          )}

          {/* Compact Recipient Bar (Single Line) */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{recipient.name}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span className="flex items-center gap-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {recipient.phone}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700 font-sans">
                Name: <strong className="font-semibold text-slate-900">{firstName}</strong>
              </span>
            </div>
          </div>

          {/* Segmented Dispatch Mode Pill */}
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
                <Send className="w-3 h-3 text-amber-600" />
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
                  <Calendar className="w-3 h-3 text-indigo-600" />
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
            disabled={loading || cancelling}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDispatch}
            disabled={loading || cancelling}
            className={`px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              mode === "schedule"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-amber-600 hover:bg-amber-700"
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
                  ? isAlreadyPending
                    ? "Updating..."
                    : "Scheduling..."
                  : "Sending..."
                : mode === "schedule"
                ? isAlreadyPending
                  ? "Update Schedule"
                  : "Schedule WhatsApp"
                : isAlreadyPending
                ? "Send Directly Now"
                : "Send Follow-up Now"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

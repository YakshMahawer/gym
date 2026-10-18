"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Send,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { sendManualExpiryWhatsAppAction } from "@/lib/actions/whatsapp-automation";

interface SendExpiryWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    fullName: string;
    phone: string;
    memberId?: string;
    expiryDate?: string | Date | null;
    planName?: string | null;
  };
  onSuccess?: () => void;
}

export function SendExpiryWhatsAppModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: SendExpiryWhatsAppModalProps) {
  const [templateType, setTemplateType] = useState<"expiry_message" | "today_expiry">(
    "expiry_message"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const expiryFormatted = member.expiryDate ? formatDate(member.expiryDate) : "Not set";

  const handleSend = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await sendManualExpiryWhatsAppAction({
        memberId: member.id,
        templateType,
      });

      if (res.success) {
        setSuccess(res.message || "Expiry message sent successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Failed to dispatch WhatsApp message via Fast2SMS.");
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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send WhatsApp Expiry Message</h3>
              <p className="text-[11px] text-slate-400">Powered by Fast2SMS</p>
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

          {/* Member Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{member.fullName}</span>
              <span className="font-mono text-[11px] text-slate-500">
                {member.memberId ? `#${member.memberId}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>Phone: <strong className="font-mono">{member.phone}</strong></span>
              <span className="flex items-center gap-1 text-amber-800 font-medium">
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>Expiry: {expiryFormatted}</span>
              </span>
            </div>
            {member.planName && (
              <div className="text-[11px] text-slate-400 pt-0.5">
                Plan: <span className="text-slate-700 font-medium">{member.planName}</span>
              </div>
            )}
          </div>

          {/* Template Choice */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Select Expiry Template to Dispatch
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: expiry_message */}
              <label
                onClick={() => setTemplateType("expiry_message")}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  templateType === "expiry_message"
                    ? "bg-blue-50/70 border-blue-400 text-blue-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="templateType"
                  checked={templateType === "expiry_message"}
                  onChange={() => setTemplateType("expiry_message")}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block">1. expiry_message (7-Day Reminder)</span>
                  <p className="text-[11px] text-slate-500">
                    Sends reminder with member name and last gym date: <em>&quot;{expiryFormatted}&quot;</em>.
                  </p>
                </div>
              </label>

              {/* Option 2: today_expiry */}
              <label
                onClick={() => setTemplateType("today_expiry")}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  templateType === "today_expiry"
                    ? "bg-amber-50/70 border-amber-400 text-amber-900 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="templateType"
                  checked={templateType === "today_expiry"}
                  onChange={() => setTemplateType("today_expiry")}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold block">2. today_expiry (Final Day Alert)</span>
                  <p className="text-[11px] text-slate-500">
                    Alerts member that today is their last membership day and prompts renewal.
                  </p>
                </div>
              </label>
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
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Sending..." : "Send Expiry WhatsApp"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

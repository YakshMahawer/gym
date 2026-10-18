"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ShieldCheck,
  Power,
  Key,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Send,
  HelpCircle,
  FileText,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  getWhatsAppStatusAction,
  toggleWhatsAppAutomationAction,
  saveWhatsAppApiSettingsAction,
} from "@/lib/actions/whatsapp-automation";
import { formatDateTime } from "@/lib/utils";

export function WhatsAppSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [senderNumber, setSenderNumber] = useState("+1555-382-0648");
  const [verifiedName, setVerifiedName] = useState("Concept Gym");
  const [showApiKey, setShowApiKey] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Confirmation modal for turning ON
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await getWhatsAppStatusAction();
      setIsAutomationEnabled(res.config.isAutomationEnabled);
      setApiKeyMasked(res.config.apiKeyMasked);
      setPhoneNumberId(res.config.phoneNumberId !== "Not configured" ? res.config.phoneNumberId : "");
      setWabaId(res.config.wabaId !== "Not configured" ? res.config.wabaId : "");
      setSenderNumber(res.config.senderNumber || "+1555-382-0648");
      setVerifiedName(res.config.verifiedName || "Concept Gym");
      setRecentLogs(res.recentLogs || []);
    } catch (err: any) {
      console.error("Failed to load WhatsApp status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggle = async (turnOn: boolean) => {
    if (turnOn) {
      setConfirmModalOpen(true);
      return;
    }

    // Direct turn off
    executeToggle(false);
  };

  const executeToggle = async (turnOn: boolean) => {
    setToggling(true);
    setStatusMessage(null);
    setConfirmModalOpen(false);

    try {
      const res = await toggleWhatsAppAutomationAction(turnOn);
      if (res.success) {
        setIsAutomationEnabled(turnOn);
        setStatusMessage({
          type: "success",
          text: res.message || "Automation status updated successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to toggle automation.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setToggling(false);
      loadStatus();
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await saveWhatsAppApiSettingsAction({
        apiKey: apiKeyInput ? apiKeyInput : undefined,
        phoneNumberId: phoneNumberId,
        wabaId: wabaId,
        senderNumber: senderNumber,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Fast2SMS WhatsApp credentials and sender number saved successfully!",
        });
        setApiKeyInput("");
        loadStatus();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to save credentials.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error saving credentials.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-3 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MASTER TOGGLE CARD (Clean White) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isAutomationEnabled
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Master WhatsApp Automation Switch
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isAutomationEnabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isAutomationEnabled ? "ACTIVE (ON)" : "DISABLED (OFF)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Controls daily afternoon expiry reminders for 7-day and today-expiring members.
              </p>
            </div>
          </div>

          <div>
            {isAutomationEnabled ? (
              <button
                type="button"
                onClick={() => handleToggle(false)}
                disabled={toggling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Turn OFF Automation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleToggle(true)}
                disabled={toggling}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Turn ON Automation</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety Reassurance Notice */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            isAutomationEnabled
              ? "bg-amber-50/70 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-600"
          }`}
        >
          <ShieldCheck
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              isAutomationEnabled ? "text-amber-600" : "text-emerald-600"
            }`}
          />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-semibold text-slate-800">
              {isAutomationEnabled
                ? "Automation is currently LIVE"
                : "Safe Mode: Automation is currently OFF (Default)"}
            </p>
            <p className="text-[11px] text-slate-500">
              {isAutomationEnabled
                ? "The system automatically dispatches expiry_message and today_expiry every afternoon ONLY to members who have NOT renewed. If a member renews, the message is automatically suppressed."
                : "While turned OFF, no automated background messages will be dispatched to any member numbers in your database. Manual triggers (receipts and individual member reminders) remain accessible to authorized admins."}
            </p>
          </div>
        </div>
      </div>

      {/* VERIFIED WHATSAPP SENDER BANNER */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  {senderNumber || "+1555-382-0648"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected · GREEN
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                  Meta Cloud API
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Verified Business Profile: <strong className="text-slate-900">{verifiedName}</strong> • Messaging Tier: <span className="font-semibold text-slate-800">TIER_250</span>
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Phone Number ID
            </span>
            <span className="font-mono text-xs font-bold text-slate-800">
              {phoneNumberId || "1291098734095226"}
            </span>
          </div>
        </div>
      </div>

      {/* 4 WHATSAPP TEMPLATES SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Template 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Case 1 · Automated
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: 36849</span>
          </div>
          <h3 className="text-xs font-bold text-slate-900">expiry_message</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            Sent <strong>7 days before</strong> membership expiry around afternoon.
          </p>
          <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-600 font-mono space-y-0.5">
            <div>&#123;&#123;1&#125;&#125;: Member Name</div>
            <div>&#123;&#123;2&#125;&#125;: Last Gym Date (e.g. 29 Nov 2026)</div>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium">✓ Auto-skips if member renewed</p>
        </div>

        {/* Template 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Case 2 · Automated
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: 37428</span>
          </div>
          <h3 className="text-xs font-bold text-slate-900">today_expiry</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            Sent on the <strong>last gym date</strong> around afternoon.
          </p>
          <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-600 font-mono space-y-0.5">
            <div>&#123;&#123;1&#125;&#125;: Member Name</div>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium">✓ Auto-skips if member renewed</p>
        </div>

        {/* Template 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Case 3 · Manual
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: 36850</span>
          </div>
          <h3 className="text-xs font-bold text-slate-900">welcome_and_receipt</h3>
          <p className="text-[11px] text-slate-500 leading-snug">
            Triggered by <strong>Admin & Superuser only</strong> next to Print and Delete.
          </p>
          <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-600 font-mono space-y-0.5">
            <div>&#123;&#123;1&#125;&#125;: Member Name</div>
            <div className="text-purple-700 font-semibold">+ PDF Receipt Header Document</div>
          </div>
          <p className="text-[10px] text-indigo-700 font-medium">✓ Button changes to &quot;Resend&quot; once sent</p>
        </div>
      </div>

      {/* FAST2SMS CREDENTIALS FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fast2SMS API Configuration
              </h3>
              <p className="text-[11px] text-slate-400">
                Found in your Fast2SMS Developer Dashboard & WhatsApp Business Manager.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadStatus}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* API Key */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Fast2SMS API Key</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Current: {apiKeyMasked || "None"}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter new Fast2SMS API Key (leave empty to keep current)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sender Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Sender Phone Number
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="+1555-382-0648"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800"
              />
            </div>

            {/* Phone Number ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="1291098734095226"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800"
              />
            </div>

            {/* WABA ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                WABA ID
              </label>
              <input
                type="text"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="1114633681106778"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl transition shadow-xs disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Fast2SMS Credentials"}
            </button>
          </div>
        </form>
      </div>

      {/* RECENT WHATSAPP MESSAGE LOGS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent WhatsApp Dispatch Logs</h3>
            <p className="text-[11px] text-slate-400">
              Audit log of all automated reminders and manual receipt shares.
            </p>
          </div>
          <button
            type="button"
            onClick={loadStatus}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">No WhatsApp messages dispatched yet.</p>
            <p className="text-[11px] text-slate-400">
              Logs will appear here once receipt shares or expiry reminders are sent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">Date / Time</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Template</th>
                  <th className="pb-2">Trigger</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Sent By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-2.5 font-mono font-medium text-slate-900">
                      {log.phone}
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {log.templateName}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-500">
                      {log.triggerType}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : log.status === "SKIPPED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-500">
                      {log.sentBy || "SYSTEM"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL BEFORE TURNING ON AUTOMATION */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Turning ON WhatsApp Automation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Turning this ON will cause automated reminders (<strong>expiry_message</strong> and <strong>today_expiry</strong>) to be dispatched daily in the afternoon to non-renewed members.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">⚠️ Real Data Protection Reminder:</p>
              <p className="text-[11px] text-amber-800">
                Please make sure your Fast2SMS templates are approved and template variables match.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel (Keep OFF)
              </button>
              <button
                type="button"
                onClick={() => executeToggle(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Yes, Turn ON Automation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

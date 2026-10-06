"use client";

import React, { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  ShieldAlert,
} from "lucide-react";
import { changeUserPassword } from "@/lib/actions/auth";
import { useAuth } from "@/components/providers/AuthProvider";

export default function SettingsPage() {
  const { user, isSuperUser, isAdmin } = useAuth();

  const [targetUser, setTargetUser] = useState<"admin" | "deskmanager">("admin");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 5) {
      setError("New password must be at least 5 characters long.");
      return;
    }

    setLoading(true);

    const res = await changeUserPassword({
      targetUsername: targetUser,
      oldPassword,
      newPassword,
      confirmPassword,
    });

    setLoading(false);

    if (res.success) {
      setSuccess(res.message || "Password successfully changed!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(res.error || "Failed to update password.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-100 dark:border-blue-900/40 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Security & Portal Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {isSuperUser ? "Superuser Access" : "Admin Access"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage authentication credentials, staff roles, and administrative security settings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Password Management Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-blue-900/40 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Account Password
                </h2>
                <p className="text-[11px] text-slate-400">
                  Update credentials for Admin or Front Desk accounts
                </p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target User Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Account to Update
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetUser("admin");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      targetUser === "admin"
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                      ADM
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Admin Account
                      </span>
                      <span className="text-[10px] text-slate-400">username: admin</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetUser("deskmanager");
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                      targetUser === "deskmanager"
                        ? "bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                      REC
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Front Desk Account
                      </span>
                      <span className="text-[10px] text-slate-400">username: deskmanager</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Old Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Current / Old Password for {targetUser === "admin" ? "Admin" : "Front Desk"}
                </label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 5 characters"
                      className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update {targetUser === "admin" ? "Admin" : "Front Desk"} Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Roles & Protection Info */}
        <div className="space-y-4">
          {/* Superuser Security Card */}
          <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/60 dark:bg-gradient-to-br dark:from-rose-950/30 dark:to-slate-900 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Superuser Master Authority</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              The <strong>superuser</strong> account has permanent root access and cannot be modified or overridden. If credentials for Admin or Front Desk are forgotten, Superuser can log in anytime to reset them.
            </p>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-rose-200 dark:border-rose-800/40 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="font-bold text-rose-600">superuser</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">Hardcoded Root</span>
              </div>
            </div>
          </div>

          {/* Role Permissions Reference */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-blue-900/40 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Role Matrix Summary
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Front Desk (deskmanager)</span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    Add Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Can register members, enquiries, payments, and PT. Cannot edit or delete records.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Admin (admin)</span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Full permissions (Add, Edit, Delete, Excel Exports, Financial Reports, Password Changes).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

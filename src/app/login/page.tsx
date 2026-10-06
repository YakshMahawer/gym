"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dumbbell,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { loginUser } from "@/lib/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/portal";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginUser({ username, password });
    if (res.success) {
      router.push(from);
      router.refresh();
    } else {
      setLoading(false);
      setError(res.error || "Invalid username or password.");
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-sky-100 dark:border-blue-900/40 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 mb-1">
          <Dumbbell className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Concept I <span className="text-rose-500">Gym</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Reception Desk & Management Portal
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Username / User ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, deskmanager, superuser"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Role Quick Selector Cards */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block text-center">
          Quick Access Credential Hints
        </span>

        <div className="grid grid-cols-3 gap-2">
          {/* Front Desk */}
          <button
            type="button"
            onClick={() => handleQuickFill("deskmanager", "root12345")}
            className="p-2 rounded-xl bg-sky-50/70 hover:bg-sky-100/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-sky-200/60 dark:border-slate-700 text-left transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 block leading-tight">
                Front Desk
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">Add only</span>
            </div>
            <span className="text-[8px] font-mono text-slate-400 mt-1 block group-hover:text-sky-600">
              deskmanager
            </span>
          </button>

          {/* Admin */}
          <button
            type="button"
            onClick={() => handleQuickFill("admin", "concept0011")}
            className="p-2 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-indigo-200/60 dark:border-slate-700 text-left transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block leading-tight">
                Admin
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">Full Access</span>
            </div>
            <span className="text-[8px] font-mono text-slate-400 mt-1 block group-hover:text-indigo-600">
              admin
            </span>
          </button>

          {/* Superuser */}
          <button
            type="button"
            onClick={() => handleQuickFill("superuser", "YakshIsGod")}
            className="p-2 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-rose-200/60 dark:border-slate-700 text-left transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block leading-tight">
                Superuser
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">Master Root</span>
            </div>
            <span className="text-[8px] font-mono text-slate-400 mt-1 block group-hover:text-rose-600">
              superuser
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-blue-100/80 dark:from-slate-950 dark:via-[#0b1b36] dark:to-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Gym Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white p-8 rounded-3xl text-center space-y-3">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading Portal Login...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

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
  AlertCircle,
  Activity,
  CheckCircle2,
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
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
      
      {/* Left Visual Branding Panel */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Background SVG vector accents */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Decorative Gym Vector Graphic Background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 400"
          fill="currentColor"
        >
          <path d="M50 200 L120 200 L150 140 L180 260 L210 170 L240 220 L260 200 L350 200" stroke="white" strokeWidth="6" fill="none" />
          <circle cx="200" cy="200" r="140" stroke="white" strokeWidth="2" strokeDasharray="6 6" fill="none" />
        </svg>

        {/* Brand Header */}
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-sm">
            <Dumbbell className="w-6 h-6 text-sky-400" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
              Management Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Concept I <span className="text-rose-500">Gym</span>
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Front Desk, Active Members, PT Sessions & Real-time Accounts.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 py-6 relative z-10 hidden sm:block">
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>Fast member enrollment & renewal</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>5-digit tax invoice & receipt generator</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>Personal training & session logs</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-1.5 relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Secure Staff Access Portal</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
        <div className="max-w-sm w-full mx-auto space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please enter your credentials to access the portal.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Username
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
                  placeholder="Enter your username"
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
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-slate-900/10 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-sky-400 dark:text-white" />
                </>
              )}
            </button>
          </form>

          {/* Simple Bottom Notice */}
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-2">
            Concept I Gym CRM • Authorized Staff Only
          </p>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white p-8 rounded-3xl text-center space-y-3 shadow-lg">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading Login Portal...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

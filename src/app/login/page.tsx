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
    <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
      
      {/* Left Visual Branding Panel with Gym Vector Art */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
            <Dumbbell className="w-5 h-5 text-sky-400" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              Management CRM
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Concept I <span className="text-rose-500">Gym</span>
            </h1>
          </div>
        </div>

        {/* Center: Stylized Vector Gym / Fitness Art */}
        <div className="my-auto py-6 flex items-center justify-center relative z-10">
          <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center">
            
            {/* Background Geometric Rings */}
            <div className="absolute inset-0 rounded-full border border-sky-500/20 border-dashed animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-sky-500/10 to-transparent blur-md" />

            {/* Custom High-Quality Gym Vector Illustration */}
            <svg
              viewBox="0 0 240 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full relative z-10 drop-shadow-xl"
            >
              {/* Central Power Shield */}
              <path
                d="M120 28L180 52V112C180 152 154 188 120 200C86 188 60 152 60 112V52L120 28Z"
                fill="url(#shield-grad)"
                fillOpacity="0.35"
                stroke="url(#stroke-grad)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Barbell Across Center */}
              {/* Left Weight Plates */}
              <rect x="74" y="98" width="6" height="44" rx="3" fill="#38bdf8" />
              <rect x="83" y="104" width="5" height="32" rx="2.5" fill="#0284c7" />
              <rect x="91" y="110" width="4" height="20" rx="2" fill="#bae6fd" />

              {/* Main Bar */}
              <rect x="91" y="117" width="58" height="6" rx="3" fill="#f8fafc" />

              {/* Right Weight Plates */}
              <rect x="145" y="110" width="4" height="20" rx="2" fill="#bae6fd" />
              <rect x="152" y="104" width="5" height="32" rx="2.5" fill="#0284c7" />
              <rect x="160" y="98" width="6" height="44" rx="3" fill="#38bdf8" />

              {/* Stylized Silhouette Athlete Figure (Torso & Head) */}
              <circle cx="120" cy="74" r="10" fill="#f1f5f9" />
              <path
                d="M102 108C102 96 109 90 120 90C131 90 138 96 138 108L140 134H100L102 108Z"
                fill="#cbd5e1"
                fillOpacity="0.9"
              />

              {/* Energy Pulse Line */}
              <path
                d="M72 152H96L106 138L116 164L126 142L134 156L142 152H168"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Accent Sparkles */}
              <circle cx="92" cy="68" r="2" fill="#38bdf8" />
              <circle cx="154" cy="78" r="2" fill="#38bdf8" />
              <circle cx="120" cy="182" r="3" fill="#38bdf8" />

              {/* Gradients */}
              <defs>
                <linearGradient id="shield-grad" x1="60" y1="28" x2="180" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0284c7" />
                  <stop offset="1" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="stroke-grad" x1="60" y1="28" x2="180" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="0.5" stopColor="#818cf8" />
                  <stop offset="1" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Staff Portal Access</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v2.0</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
        <div className="max-w-sm w-full mx-auto space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your staff credentials to continue to the portal.
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
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-transparent transition"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 focus:border-transparent transition"
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
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
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

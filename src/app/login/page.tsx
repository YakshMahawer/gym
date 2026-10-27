"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
    <div className="w-full max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-200/90 dark:border-slate-800 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
      
      {/* Left Visual Branding Panel with Gym Vector Art */}
      <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-9 text-white flex flex-col justify-between relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-lg border border-white/40 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/icons/logo.png"
                alt="Concept 1 Gym Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 block">
                Official CRM Portal
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white leading-none">
                Concept 1 <span className="text-rose-500">Gym</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Aesthetic Glassmorphism Emblem Showcase with Concept 1 Logo */}
        <div className="my-auto py-8 flex flex-col items-center justify-center relative z-10">
          <div className="relative flex flex-col items-center justify-center">
            
            {/* Outer Ambient Rotating Rings & Glow */}
            <div className="absolute -inset-6 rounded-full border border-sky-400/25 border-dashed animate-[spin_80s_linear_infinite] pointer-events-none" />
            <div className="absolute -inset-12 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -inset-2 rounded-full border border-white/10 pointer-events-none" />

            {/* Glowing Glassmorphic Circular Disc containing Official Logo */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-2.5 bg-gradient-to-tr from-white/20 via-sky-400/20 to-white/10 backdrop-blur-xl border border-white/30 shadow-[0_0_50px_rgba(56,189,248,0.35)] flex items-center justify-center transition-transform hover:scale-105 duration-500">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-3.5 shadow-2xl overflow-hidden relative">
                <img
                  src="/icons/logo.png"
                  alt="Concept 1 Gym"
                  className="w-full h-full object-contain filter drop-shadow-md select-none"
                />
              </div>
            </div>

            {/* Floating Motto Pill */}
            <div className="mt-6 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-lg">
              <span className="text-[11px] font-bold tracking-widest uppercase text-sky-300">
                Precision • Strength • Dedication
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Authorized Staff Only</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Concept 1 • Vadodara</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white/90 dark:bg-slate-900/90">
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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-100 dark:bg-slate-950">
      
      {/* Aesthetic Tiled Repeating Pattern Background with Subtle Blur & Overlay */}
      <div
        className="absolute inset-0 bg-repeat opacity-[0.08] dark:opacity-[0.04] pointer-events-none filter blur-[1px] scale-105"
        style={{
          backgroundImage: "url('/gym-pattern.jpg')",
          backgroundSize: "360px auto",
        }}
      />
      
      {/* Ambient Gradient Glows */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 via-transparent to-sky-100/40 dark:from-slate-950/80 dark:via-transparent dark:to-blue-950/40 pointer-events-none" />

      {/* Floating Center Card */}
      <div className="relative z-10 w-full flex items-center justify-center">
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
    </div>
  );
}

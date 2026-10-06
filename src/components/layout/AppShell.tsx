"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  BarChart3,
  Dumbbell,
  Bell,
  Search,
  Plus,
  Cake,
  AlertCircle,
  Menu,
  X,
  FileText,
  ChevronRight,
  ShieldAlert,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NewEnquiryModal } from "@/components/modals/NewEnquiryModal";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { logoutUser } from "@/lib/actions/auth";
import { SessionUser } from "@/lib/auth";

interface AppShellProps {
  children: React.ReactNode;
  user?: SessionUser | null;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isSuperUser, isFrontDesk } = useAuth();

  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // 1. Immediately wipe client cookie for 0ms edge middleware effect
      document.cookie = "gym_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
    } catch {}

    // 2. Fire backend logout in background without waiting
    logoutUser().catch(() => {});

    // 3. Instant hard redirect to login
    window.location.replace("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/portal",
      icon: LayoutDashboard,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-100 dark:bg-sky-500/20",
      activeBg: "bg-sky-600 text-white",
      activePill: "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 font-bold",
      indicatorColor: "bg-white",
    },
    {
      label: "Members",
      href: "/portal/members",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-500/20",
      activeBg: "bg-blue-600 text-white",
      activePill: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 font-bold",
      indicatorColor: "bg-white",
    },
    {
      label: "Enquiries",
      href: "/portal/enquiries",
      icon: UserPlus,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-500/20",
      activeBg: "bg-cyan-600 text-white",
      activePill: "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-500/30 font-bold",
      indicatorColor: "bg-white",
    },
    {
      label: "Payments & Dues",
      href: "/portal/payments",
      icon: CreditCard,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-500/20",
      activeBg: "bg-teal-600 text-white",
      activePill: "bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md shadow-teal-500/30 font-bold",
      indicatorColor: "bg-white",
    },
    {
      label: "Reports",
      href: "/portal/reports",
      icon: BarChart3,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-500/20",
      activeBg: "bg-indigo-600 text-white",
      activePill: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/30 font-bold",
      indicatorColor: "bg-white",
    },
    ...(isAdmin || isSuperUser
      ? [
          {
            label: "Settings",
            href: "/portal/settings",
            icon: Settings,
            color: "text-slate-600 dark:text-slate-400",
            bgColor: "bg-slate-100 dark:bg-slate-800",
            activeBg: "bg-slate-700 text-white",
            activePill: "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md shadow-slate-900/30 font-bold",
            indicatorColor: "bg-white",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 flex flex-col antialiased text-slate-800 dark:text-slate-100 pb-20 md:pb-0 transition-colors duration-200">
      {/* Top Header Bar - Midnight Blue / Sapphire Gradient */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-[#0b1b36] to-[#0c234a] text-white border-b border-blue-900/40 shadow-md transition-colors duration-200">
        <div className="w-full px-3.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 rounded-lg hover:bg-white/10 md:hidden text-slate-300 active:bg-white/20 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/portal" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20 transition-transform group-hover:scale-105">
                <Dumbbell className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white leading-none">
                  Concept I <span className="text-rose-400 font-extrabold">Gym</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-blue-200/70 font-medium tracking-wide">
                  Reception Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Actions in Top Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Live Website link */}
            <Link
              href="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-200 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition"
              title="Open Public Website"
            >
              <span>Live Site ↗</span>
            </Link>

            {/* Desktop + New Enquiry Button */}
            <button
              onClick={() => setEnquiryModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl text-xs font-semibold shadow-xs transition backdrop-blur-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-200" />
              <span>New Enquiry</span>
            </button>

            {/* Desktop + New Member Button */}
            <Link
              href="/portal/members/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-950/30 transition active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Member</span>
            </Link>

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition"
                title="Alerts & Reminders"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900" />
              </button>

              {notificationOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100">Today&apos;s Alerts</h4>
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <div className="py-2 space-y-1.5 text-xs">
                    <Link
                      href="/"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 transition"
                    >
                      <div className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Cake className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Simran Kaur&apos;s Birthday</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Wish them a happy birthday today</p>
                      </div>
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 transition"
                    >
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Pending Dues Reminder</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Priya Patel has pending ₹2,500 due</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Quick Action Button */}
            <button
              onClick={() => setMobileActionSheetOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-rose-600 text-white active:bg-rose-700 shadow-xs flex items-center gap-1 text-xs font-bold"
              aria-label="Quick Actions"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Staff Role Badge & Logout Button */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/15 text-xs">
              <div
                className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-[10px] shadow-xs ${
                  isSuperUser
                    ? "bg-rose-500 border border-rose-300 shadow-rose-500/30"
                    : isAdmin
                    ? "bg-indigo-600 border border-indigo-300 shadow-indigo-500/30"
                    : "bg-sky-500 border border-sky-300 shadow-sky-500/30"
                }`}
              >
                {isSuperUser ? "ROOT" : isAdmin ? "ADM" : "REC"}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="font-semibold text-white leading-none">
                  {user?.name || (isSuperUser ? "Superuser" : isAdmin ? "Administrator" : "Front Desk")}
                </span>
                <span className="text-[10px] text-blue-200/70">
                  {isSuperUser ? "Root Master" : isAdmin ? "Full Admin" : "Receptionist"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500/20 active:bg-rose-500/30 transition disabled:opacity-50"
                title="Sign Out of Portal"
                aria-label="Logout"
              >
                {loggingOut ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width container with items-start for sticky sidebar */}
      <div className="flex-1 flex w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 gap-6 items-start">
        
        {/* Left Sidebar - Light Sky & Ice Blue Palette (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-20 z-20">
          <div className="bg-gradient-to-b from-sky-50/90 via-blue-50/70 to-sky-100/60 dark:bg-gradient-to-b dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl border border-sky-200/80 dark:border-blue-900/40 p-3.5 space-y-3 shadow-md shadow-sky-900/5 transition-all min-h-[calc(100vh-6.5rem)] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300 flex items-center justify-between">
                <span>Navigation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />
              </div>
              
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/portal"
                      ? pathname === "/portal"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? item.activePill
                          : "text-slate-600 dark:text-slate-300 hover:text-sky-900 dark:hover:text-white hover:bg-sky-100/80 dark:hover:bg-blue-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-2xs ${
                            isActive ? "bg-white/20 text-white" : `${item.bgColor} ${item.color}`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      {isActive ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.indicatorColor}`} />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-sky-400 opacity-0 group-hover:opacity-100 transition" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop Sidebar Bottom Profile & Logout Card */}
            <div className="pt-3 border-t border-sky-200/80 dark:border-blue-900/40 space-y-2">
              <div className="p-2.5 rounded-xl bg-sky-100/70 dark:bg-slate-800/70 border border-sky-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 shrink-0 rounded-lg text-white font-bold flex items-center justify-center text-[10px] ${
                      isSuperUser ? "bg-rose-600" : isAdmin ? "bg-indigo-600" : "bg-sky-600"
                    }`}
                  >
                    {isSuperUser ? "ROOT" : isAdmin ? "ADM" : "REC"}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                      {user?.name || (isSuperUser ? "Superuser" : isAdmin ? "Administrator" : "Front Desk")}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      @{user?.username || "deskmanager"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                  title="Sign Out"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden flex animate-in fade-in duration-150">
            <div className="w-72 bg-white dark:bg-slate-900 h-full p-4 space-y-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                        Concept I <span className="text-rose-600 dark:text-rose-500">Gym</span>
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {user?.name || "Portal User"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? `${item.activePill} border font-bold shadow-xs` 
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isActive ? item.activeBg : `${item.bgColor} ${item.color}`
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? item.color : "text-slate-400"}`} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Add Section inside Drawer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 px-1">
                  Quick Actions
                </p>
                <Link
                  href="/portal/members/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-white shadow-xs"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add New Member</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setEnquiryModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>New Lead / Enquiry</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPaymentModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Record Payment</span>
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition disabled:opacity-50"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{loggingOut ? "Signing Out..." : `Sign Out (@${user?.username || "user"})`}</span>
                </button>
              </div>

              {/* Bottom Drawer Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-[11px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Concept I Gym Manager</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Logged in as {user?.role || "FRONTDESK"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden">
        <div className="grid grid-cols-5 items-center h-16 px-1 safe-area-pb">
          {/* 1. Dashboard */}
          <Link
            href="/portal"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname === "/portal" ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname === "/portal" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60" : ""}`}>
              <LayoutDashboard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Home</span>
          </Link>

          {/* 2. Members */}
          <Link
            href="/portal/members"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/portal/members") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/portal/members") ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60" : ""}`}>
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Members</span>
          </Link>

          {/* 3. Central Elevated Action Button */}
          <div className="flex flex-col items-center justify-center -mt-4">
            <button
              onClick={() => setMobileActionSheetOpen(true)}
              className="w-12 h-12 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center active:scale-90 transition transform hover:bg-rose-500"
              aria-label="New Actions"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-none">Create</span>
          </div>

          {/* 4. Enquiries */}
          <Link
            href="/portal/enquiries"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/portal/enquiries") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/portal/enquiries") ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60" : ""}`}>
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Enquiries</span>
          </Link>

          {/* 5. Payments */}
          <Link
            href="/portal/payments"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/portal/payments") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/portal/payments") ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60" : ""}`}>
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Payments</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Action Sheet Modal */}
      {mobileActionSheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Quick Actions</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Choose an action to perform</p>
              </div>
              <button 
                onClick={() => setMobileActionSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <Link
                href="/portal/members/new"
                onClick={() => setMobileActionSheetOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs shadow-sm active:scale-98 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Add New Member</p>
                  <p className="text-[11px] text-slate-300 dark:text-slate-400">Register member with health profile & plan</p>
                </div>
              </Link>

              <button
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setEnquiryModalOpen(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs active:bg-slate-50 dark:active:bg-slate-750 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">New Enquiry / Lead</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Log walk-in visitor & set follow-up date</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setPaymentModalOpen(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs active:bg-slate-50 dark:active:bg-slate-750 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Record / Collect Payment</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Clear member pending due or add transaction</p>
                </div>
              </button>

              <Link
                href="/portal/reports"
                onClick={() => setMobileActionSheetOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs active:bg-slate-50 dark:active:bg-slate-750 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Tax Invoices & Reports</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">View GST sales report & package performance</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <NewEnquiryModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <AddPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

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
} from "lucide-react";
import { NewEnquiryModal } from "@/components/modals/NewEnquiryModal";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Members", href: "/members", icon: Users },
    { label: "Enquiries", href: "/enquiries", icon: UserPlus },
    { label: "Payments & Dues", href: "/payments", icon: CreditCard },
    { label: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col antialiased text-slate-800 dark:text-slate-100 pb-20 md:pb-0 transition-colors duration-200">
      {/* Top Header Bar - Minimal & Clean */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors duration-200">
        <div className="w-full px-3.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-600 dark:text-slate-300 active:bg-slate-200 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-slate-900 dark:bg-rose-600 text-white flex items-center justify-center font-bold shadow-sm transition-colors">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Concept I <span className="text-rose-600 dark:text-rose-400">Gym</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                  Reception Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Actions in Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop + New Enquiry Button */}
            <button
              onClick={() => setEnquiryModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-sm transition hover:border-slate-300"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>New Enquiry</span>
            </button>

            {/* Desktop + New Member Button */}
            <Link
              href="/members/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Member</span>
            </Link>

            {/* Dark Mode Toggle (Manager View) */}
            <ThemeToggle />

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 transition"
                title="Alerts & Reminders"
              >
                <Bell className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </button>

              {notificationOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl sm:rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100">Today&apos;s Alerts</h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
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
              className="sm:hidden p-2 rounded-lg bg-slate-900 dark:bg-rose-600 text-white active:bg-slate-800 shadow-xs flex items-center gap-1 text-xs font-bold"
              aria-label="Quick Actions"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Quick Staff Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-[11px]">
                REC
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 dark:text-slate-200 leading-none">Front Desk</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Main Branch</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width container using side space */}
      <div className="flex-1 flex w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 gap-6">
        
        {/* Left Sidebar - Minimal & Sleek (Desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 dark:bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden flex animate-in fade-in duration-150">
            <div className="w-72 bg-white dark:bg-slate-900 h-full p-4 space-y-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-200 dark:border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-rose-600 text-white flex items-center justify-center font-bold">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">Concept I Gym</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Reception & Management</span>
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
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive 
                            ? "bg-slate-900 dark:bg-rose-600 text-white shadow-xs" 
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/70" : "text-slate-400"}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Quick Add Section inside Drawer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 px-1">
                    Quick Actions
                  </p>
                  <Link
                    href="/members/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-rose-600 text-white shadow-xs"
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
                </div>
              </div>

              {/* Bottom Drawer Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-[11px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Concept I Gym Manager</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Mobile Desk v1.0</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Expansive width */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar - Standard 1-thumb touch navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden">
        <div className="grid grid-cols-5 items-center h-16 px-1 safe-area-pb">
          {/* 1. Dashboard */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname === "/" ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname === "/" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
              <LayoutDashboard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Home</span>
          </Link>

          {/* 2. Members */}
          <Link
            href="/members"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/members") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/members") ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Members</span>
          </Link>

          {/* 3. Central Elevated Action Button */}
          <div className="flex flex-col items-center justify-center -mt-4">
            <button
              onClick={() => setMobileActionSheetOpen(true)}
              className="w-12 h-12 rounded-full bg-slate-900 dark:bg-rose-600 text-white shadow-lg shadow-slate-900/20 dark:shadow-rose-600/30 flex items-center justify-center active:scale-90 transition transform hover:bg-slate-800 dark:hover:bg-rose-700"
              aria-label="New Actions"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-1 leading-none">Create</span>
          </div>

          {/* 4. Enquiries */}
          <Link
            href="/enquiries"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/enquiries") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/enquiries") ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Enquiries</span>
          </Link>

          {/* 5. Payments & Dues */}
          <Link
            href="/payments"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/payments") ? "text-slate-900 dark:text-white font-bold" : "text-slate-500 dark:text-slate-400 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/payments") ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Ledger</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Quick Action Bottom Sheet */}
      {mobileActionSheetOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center md:hidden animate-in fade-in duration-150"
          onClick={() => setMobileActionSheetOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
            
            <div className="flex items-center justify-between pb-1">
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
                href="/members/new"
                onClick={() => setMobileActionSheetOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900 dark:bg-rose-600 text-white font-semibold text-xs shadow-sm active:scale-98 transition"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Add New Member</p>
                  <p className="text-[11px] text-white/70">Register member with health profile & plan</p>
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
                href="/reports"
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


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
    <div className="min-h-screen bg-slate-50/70 flex flex-col antialiased text-slate-800 pb-20 md:pb-0">
      {/* Top Header Bar - Minimal & Clean */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="w-full px-3.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 rounded-lg hover:bg-slate-100 md:hidden text-slate-600 active:bg-slate-200 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-none">
                  Concept I <span className="text-rose-600">Gym</span>
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide">
                  Reception Desk
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Actions in Top Bar */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Desktop + New Enquiry Button */}
            <button
              onClick={() => setEnquiryModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition hover:border-slate-300"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>New Enquiry</span>
            </button>

            {/* Desktop + New Member Button */}
            <Link
              href="/members/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Member</span>
            </Link>

            {/* Mobile Quick Action Button */}
            <button
              onClick={() => setMobileActionSheetOpen(true)}
              className="sm:hidden p-2 rounded-lg bg-slate-900 text-white active:bg-slate-800 shadow-xs flex items-center gap-1 text-xs font-bold"
              aria-label="Quick Actions"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition"
                title="Alerts & Reminders"
              >
                <Bell className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>

              {notificationOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:w-80 bg-white text-slate-800 rounded-2xl sm:rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-semibold text-xs text-slate-800">Today&apos;s Alerts</h4>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <div className="py-2 space-y-1.5 text-xs">
                    <Link
                      href="/"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition"
                    >
                      <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Cake className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Simran Kaur&apos;s Birthday</p>
                        <p className="text-[11px] text-slate-500">Wish them a happy birthday today</p>
                      </div>
                    </Link>
                    <Link
                      href="/"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition"
                    >
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Pending Dues Reminder</p>
                        <p className="text-[11px] text-slate-500">Priya Patel has pending ₹2,500 due</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Staff Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold flex items-center justify-center text-[11px]">
                REC
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800 leading-none">Front Desk</span>
                <span className="text-[10px] text-slate-400">Main Branch</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width container using side space */}
      <div className="flex-1 flex w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 gap-6">
        
        {/* Left Sidebar - Minimal & Sleek (Desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-2 space-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden flex animate-in fade-in duration-150">
            <div className="w-72 bg-white h-full p-4 space-y-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block leading-tight">Concept I Gym</span>
                      <span className="text-[10px] text-slate-400">Reception & Management</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                            ? "bg-slate-900 text-white shadow-xs" 
                            : "text-slate-700 hover:bg-slate-100 active:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/70" : "text-slate-400"}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Quick Add Section inside Drawer */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">
                    Quick Actions
                  </p>
                  <Link
                    href="/members/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add New Member</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setEnquiryModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span>New Lead / Enquiry</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPaymentModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Bottom Drawer Footer */}
              <div className="p-3 bg-slate-50 rounded-xl text-center text-[11px] text-slate-500 border border-slate-100">
                <p className="font-semibold text-slate-700">Concept I Gym Manager</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Mobile Desk v1.0</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Expansive width */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar - Standard 1-thumb touch navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden">
        <div className="grid grid-cols-5 items-center h-16 px-1 safe-area-pb">
          {/* 1. Dashboard */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname === "/" ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname === "/" ? "bg-slate-100" : ""}`}>
              <LayoutDashboard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Home</span>
          </Link>

          {/* 2. Members */}
          <Link
            href="/members"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/members") ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/members") ? "bg-slate-100" : ""}`}>
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Members</span>
          </Link>

          {/* 3. Central Elevated Action Button */}
          <div className="flex flex-col items-center justify-center -mt-4">
            <button
              onClick={() => setMobileActionSheetOpen(true)}
              className="w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 flex items-center justify-center active:scale-90 transition transform hover:bg-slate-800"
              aria-label="New Actions"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
            <span className="text-[9px] font-bold text-slate-700 mt-1 leading-none">Create</span>
          </div>

          {/* 4. Enquiries */}
          <Link
            href="/enquiries"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/enquiries") ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/enquiries") ? "bg-slate-100" : ""}`}>
              <UserPlus className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">Enquiries</span>
          </Link>

          {/* 5. Payments & Dues */}
          <Link
            href="/payments"
            className={`flex flex-col items-center justify-center py-1 rounded-lg transition active:scale-95 ${
              pathname.startsWith("/payments") ? "text-slate-900 font-bold" : "text-slate-500 font-medium"
            }`}
          >
            <div className={`p-1 rounded-md ${pathname.startsWith("/payments") ? "bg-slate-100" : ""}`}>
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
            className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
            
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="font-bold text-base text-slate-900">Quick Actions</h3>
                <p className="text-xs text-slate-400">Choose an action to perform</p>
              </div>
              <button 
                onClick={() => setMobileActionSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <Link
                href="/members/new"
                onClick={() => setMobileActionSheetOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-xs shadow-sm active:scale-98 transition"
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
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-semibold text-xs shadow-2xs active:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">New Enquiry / Lead</p>
                  <p className="text-[11px] text-slate-400">Log walk-in visitor & set follow-up date</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setMobileActionSheetOpen(false);
                  setPaymentModalOpen(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-semibold text-xs shadow-2xs active:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Record / Collect Payment</p>
                  <p className="text-[11px] text-slate-400">Clear member pending due or add transaction</p>
                </div>
              </button>

              <Link
                href="/reports"
                onClick={() => setMobileActionSheetOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-semibold text-xs shadow-2xs active:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Tax Invoices & Reports</p>
                  <p className="text-[11px] text-slate-400">View GST sales report & package performance</p>
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


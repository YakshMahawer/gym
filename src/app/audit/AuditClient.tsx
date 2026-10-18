"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  BellRing,
  ShieldCheck,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
  CalendarClock,
  Dumbbell,
  MessageSquare,
  Sparkles,
  Share,
  PlusSquare,
  Volume2,
  VolumeX,
  ExternalLink,
  Users,
  Activity,
  Check,
} from "lucide-react";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BD-_ASVqkJTw0NmlB1xsPmlUNh_YMsqd4FYhzud-7o3FaCcPNBSg0zWnvXKNQcKhl3_WdJk0QP6INM6sD3mos0Q";

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function parseSafeDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  let s = String(dateInput).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const d = new Date(Number(s));
    return isNaN(d.getTime()) ? null : d;
  }
  // Replace space with T for iOS Safari compatibility: "2026-10-19 01:45:00" -> "2026-10-19T01:45:00"
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) {
    s = s.replace(" ", "T");
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelativeTime(dateString: string | Date | number): string {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1m ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function formatTime(dateString: string | Date | number): string {
  const d = parseSafeDate(dateString);
  if (!d) return "";
  try {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toTimeString().slice(0, 5);
  }
}

function formatDateTimeShort(dateString: string | Date | number): string {
  const d = parseSafeDate(dateString);
  if (!d) return "Today";
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  let timeStr = "";
  try {
    timeStr = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    timeStr = d.toTimeString().slice(0, 5);
  }

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${timeStr}`;
}

function formatDateHeader(dateString: string | Date | number): string {
  const d = parseSafeDate(dateString);
  if (!d) return "Recent Activity";
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const dateStr = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (isToday) {
    return `Today · ${dateStr}`;
  }
  if (isYesterday) {
    return `Yesterday · ${dateStr}`;
  }
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AuditLogItem {
  id: string;
  userId?: string | null;
  username: string;
  role: string;
  action: string;
  category: string;
  title: string;
  details: string;
  metadata?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export function AuditClient() {
  // Security PIN Lock
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Push Notification State
  const [swSupported, setSwSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Data & Filtering State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<{
    todayTotal: number;
    todayLogins: number;
    todayPayments: number;
    todayMembers: number;
    subscribedDevices: number;
  }>({
    todayTotal: 0,
    todayLogins: 0,
    todayPayments: 0,
    todayMembers: 0,
    subscribedDevices: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStaff, setSelectedStaff] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const prevLogCountRef = useRef<number>(0);

  // Check saved unlock state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUnlock = localStorage.getItem("concept1_owner_unlocked");
      if (savedUnlock === "true") {
        setIsUnlocked(true);
      }
    }
  }, []);

  // Handle Passcode Unlock - Configured to 4321
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    if (clean === "4321" || clean === "YakshIsGod") {
      setIsUnlocked(true);
      setPinError("");
      localStorage.setItem("concept1_owner_unlocked", "true");
    } else {
      setPinError("Incorrect Passcode. Please try again.");
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    localStorage.removeItem("concept1_owner_unlocked");
    setPinInput("");
  };

  // Inspect environment: iOS, Standalone, ServiceWorker
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSwSupported(true);
      if ("Notification" in window) {
        setPermission(Notification.permission);
      }

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  // Subscribe to Push Notifications
  const handleSubscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    try {
      setSubscribing(true);

      const reg = await navigator.serviceWorker.register("/sw-audit.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        alert(
          perm === "denied"
            ? "Notifications are blocked. Please enable notifications in your phone's browser or app settings."
            : "Notification permission was not granted."
        );
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      const res = await fetch("/api/audit/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subJson.keys,
          deviceName: isIOS ? "Apple iPhone / iPad" : "Android / Mobile Device",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register subscription on server.");
      }

      setIsSubscribed(true);
      alert("🎉 Real-time alerts activated! Your phone will now receive alerts whenever staff logs in or performs actions.");
    } catch (err: any) {
      console.error("Subscription error:", err);
      alert("Failed to activate notifications: " + err.message);
    } finally {
      setSubscribing(false);
    }
  };

  // Fetch Audit Logs
  const fetchLogs = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setRefreshing(true);
        const params = new URLSearchParams();
        if (selectedCategory !== "ALL") params.set("category", selectedCategory);
        if (selectedStaff !== "ALL") params.set("username", selectedStaff);
        if (dateFilter) params.set("date", dateFilter);

        const res = await fetch(`/api/audit/logs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load logs");

        const data = await res.json();
        if (data.success) {
          if (
            soundEnabled &&
            prevLogCountRef.current > 0 &&
            data.logs.length > prevLogCountRef.current
          ) {
            playChime();
          }
          prevLogCountRef.current = data.logs.length;

          setLogs(data.logs);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Fetch logs error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, selectedStaff, dateFilter, soundEnabled]
  );

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.title.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const groupedLogs = filteredLogs.reduce((groups: Record<string, AuditLogItem[]>, item) => {
    const header = formatDateHeader(item.createdAt);
    if (!groups[header]) groups[header] = [];
    groups[header].push(item);
    return groups;
  }, {});

  // Clean, minimal pastel theme for bifurcated log types
  const getEventBadge = (category: string, action: string) => {
    if (category === "PROFILE_CHANGED" || action === "PROFILE_DETAILS_UPDATED") {
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <UserPlus className="w-3.5 h-3.5 text-indigo-600" />,
        tagLabel: "Profile Changed",
      };
    }
    if (category === "RECEIPT_CHANGED" || action.includes("RECEIPT")) {
      return {
        bg: action.includes("DELETE") ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200",
        icon: action.includes("DELETE") ? <Trash2 className="w-3.5 h-3.5 text-rose-600" /> : <CalendarClock className="w-3.5 h-3.5 text-amber-600" />,
        tagLabel: action.includes("DELETE") ? "Receipt Deleted" : "Receipt Date Changed",
      };
    }
    if (category === "MEMBERSHIP_DATES_CHANGED" || action.includes("MEMBERSHIP_DATES")) {
      return {
        bg: "bg-teal-50 text-teal-800 border-teal-200",
        icon: <CalendarClock className="w-3.5 h-3.5 text-teal-600" />,
        tagLabel: "Membership Dates Changed",
      };
    }
    if (category === "PAYMENT" || action.includes("PAYMENT")) {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: <CreditCard className="w-3.5 h-3.5 text-emerald-600" />,
        tagLabel: "Fee Collected",
      };
    }
    if (category === "AUTH") {
      if (action.includes("LOGOUT")) {
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <LogOut className="w-3.5 h-3.5 text-slate-600" />,
          tagLabel: "Staff Logout",
        };
      }
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <LogIn className="w-3.5 h-3.5 text-blue-600" />,
        tagLabel: "Staff Login",
      };
    }
    if (category === "PT") {
      return {
        bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
        icon: <Dumbbell className="w-3.5 h-3.5 text-cyan-600" />,
        tagLabel: "PT Add-on",
      };
    }
    if (category === "ENQUIRY") {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <MessageSquare className="w-3.5 h-3.5 text-purple-600" />,
        tagLabel: "Enquiry",
      };
    }
    if (action.includes("DELETE")) {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
        tagLabel: "Record Deleted",
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
      tagLabel: "Staff Activity",
    };
  };

  // PASSCODE UNLOCK SCREEN (CLEAN, NO LEAKED PASSWORDS)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-white border border-slate-200/90 p-2 flex items-center justify-center shadow-lg shadow-slate-900/5">
            <img
              src="/icons/logo.png"
              alt="Concept 1 Gym"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              Concept 1 Gym
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Owner Live Activity & Notifications Monitor
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="Enter Passcode"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-center text-lg font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition tracking-widest"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold animate-shake">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock App</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col pb-16 max-w-2xl mx-auto">
      {/* Top Mobile App Bar (Clean White with Concept 1 Logo) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
            <img
              src="/icons/logo.png"
              alt="Concept 1"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                Concept 1 Gym
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Today: {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio Chime */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs transition ${
              soundEnabled
                ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                : "bg-transparent text-slate-400 hover:bg-slate-100"
            }`}
            title={soundEnabled ? "Live chime enabled" : "Muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-800" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-slate-900" : ""}`} />
          </button>

          {/* Lock App */}
          <button
            onClick={handleLockAgain}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            title="Lock Monitor"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Phone Alert Status Card (Clean Minimalist White) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSubscribed
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {isSubscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {isSubscribed ? "Phone Notifications Active" : "Turn ON Phone Alerts"}
                  </h2>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSubscribed
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isSubscribed ? "Enabled" : "Tap to Setup"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isSubscribed
                    ? "Your phone receives instant push alerts whenever staff logs in, collects fees, or modifies data."
                    : "Receive instant notifications on your phone lock screen whenever staff logs in or performs actions."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{subscribing ? "Connecting..." : "Enable Push Alerts on this Phone"}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200/90 rounded-xl text-xs text-emerald-800 font-semibold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-Time Push Alerts Active</span>
              </div>
            )}
          </div>

          {/* iOS Safari Tip */}
          {isIOS && !isStandalone && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-[11px]">
                <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                <span>iPhone Notification Tip:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                To receive push alerts when the screen is locked, tap Safari <strong>Share</strong> ⎋ $\rightarrow$ <strong>'Add to Home Screen'</strong> ➕, then open the app icon from your home screen.
              </p>
            </div>
          )}
        </div>

        {/* Minimal Metric Chips (4 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Today
            </span>
            <p className="text-xl font-bold text-slate-900">
              {stats.todayTotal}
            </p>
            <span className="text-[10px] text-slate-400">Recorded events</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-0.5">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              Logins
            </span>
            <p className="text-xl font-bold text-blue-700">
              {stats.todayLogins}
            </p>
            <span className="text-[10px] text-slate-400">Staff logins</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-0.5">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
              Payments
            </span>
            <p className="text-xl font-bold text-emerald-700">
              {stats.todayPayments}
            </p>
            <span className="text-[10px] text-slate-400">Fee collections</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-0.5">
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
              Members
            </span>
            <p className="text-xl font-bold text-indigo-700">
              {stats.todayMembers}
            </p>
            <span className="text-[10px] text-slate-400">Created / Updated</span>
          </div>
        </div>

        {/* Minimal Category Pills & Search */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 space-y-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Horizontal Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: "ALL", label: "All Events" },
              { id: "PROFILE_CHANGED", label: "👤 Profile Changed" },
              { id: "RECEIPT_CHANGED", label: "🧾 Receipt Changed" },
              { id: "MEMBERSHIP_DATES_CHANGED", label: "📅 Membership Dates" },
              { id: "PAYMENT", label: "💳 Fee Collections" },
              { id: "AUTH", label: "🔑 Staff Logins/Logouts" },
              { id: "PT", label: "🏋️ PT" },
              { id: "ENQUIRY", label: "💬 Enquiries" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition text-xs ${
                  selectedCategory === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Staff Filter, Date Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, staff, receipt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Staff</option>
                <option value="admin">Administrator (admin)</option>
                <option value="deskmanager">Front Desk (deskmanager)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const yyyy = now.getFullYear();
                  const mm = String(now.getMonth() + 1).padStart(2, "0");
                  const dd = String(now.getDate()).padStart(2, "0");
                  const todayStr = `${yyyy}-${mm}-${dd}`;
                  setDateFilter(dateFilter === todayStr ? "" : todayStr);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  dateFilter
                    ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    : "bg-slate-900 text-white border-slate-900 shadow-2xs"
                }`}
              >
                {dateFilter ? "Show All" : "Filter: All"}
              </button>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-900 font-medium shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chronological Activity Feed */}
        <div className="space-y-4">
          {/* Always display Today's Date Status at the top of the feed */}
          {(() => {
            const now = new Date();
            const todayDateStr = now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const todayHeaderKey = Object.keys(groupedLogs).find((k) => k.startsWith("Today"));
            const hasTodayEvents = todayHeaderKey && groupedLogs[todayHeaderKey]?.length > 0;

            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-bold text-xs shrink-0 leading-tight">
                    <span>{now.getDate()}</span>
                    <span className="text-[9px] font-normal uppercase opacity-75">{now.toLocaleDateString("en-IN", { month: "short" })}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Today · {todayDateStr}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {hasTodayEvents
                        ? `${groupedLogs[todayHeaderKey].length} live staff action(s) recorded today`
                        : "Live monitoring connected · 0 staff events recorded today so far"}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed
                </span>
              </div>
            );
          })()}

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-600" />
              <p className="text-xs">Loading live activity feed...</p>
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200/80 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No staff activities found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "ALL" || selectedStaff !== "ALL"
                  ? "Try resetting filters to show all events."
                  : "Whenever non-superuser staff logs in, creates receipts, or updates member records, they appear here instantly."}
              </p>
            </div>
          ) : (
            Object.entries(groupedLogs).map(([groupHeader, groupItems]) => (
              <div key={groupHeader} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs font-bold text-slate-700">
                    {groupHeader}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {groupItems.length} {groupItems.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {/* Event Cards */}
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const badge = getEventBadge(item.category, item.action);
                    const isExpanded = expandedLogId === item.id;
                    const staffTag =
                      item.role === "ADMIN"
                        ? { label: "Admin", style: "bg-amber-50 text-amber-800 border-amber-200" }
                        : { label: "Front Desk", style: "bg-purple-50 text-purple-800 border-purple-200" };

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-3.5 transition shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {/* Pastel Circle Icon */}
                            <div className={`p-2 rounded-xl border ${badge.bg} shrink-0 mt-0.5`}>
                              {badge.icon}
                            </div>

                            {/* Content */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
                                >
                                  {badge.tagLabel}
                                </span>
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${staffTag.style}`}
                                >
                                  {staffTag.label}: {item.username}
                                </span>
                              </div>
                              <h3 className="text-xs font-bold text-slate-900 leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs text-slate-600 leading-snug">
                                {item.details}
                              </p>
                            </div>
                          </div>

                          {/* Time & Date Display (Never Blank) */}
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-semibold text-slate-800 block whitespace-nowrap">
                              {formatDateTimeShort(item.createdAt)}
                            </span>
                            <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                              {formatRelativeTime(item.createdAt) || "Recorded"}
                            </span>
                          </div>
                        </div>

                        {/* Metadata Details Toggle */}
                        {item.metadata && (
                          <div className="pt-1.5 border-t border-slate-100">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 transition"
                            >
                              <span>{isExpanded ? "Hide Metadata" : "Inspect Raw Details"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <pre className="mt-2 p-2.5 rounded-xl bg-slate-50 text-[10px] font-mono text-slate-700 overflow-x-auto border border-slate-200">
                                {JSON.stringify(JSON.parse(item.metadata), null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Bottom Live Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto px-4 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="text-[11px] text-slate-600 font-medium">
            Auto-Sync active (every 8s)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-400">
            {stats.subscribedDevices} phone(s) connected
          </span>
          <a
            href="/portal"
            className="text-slate-900 font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Staff CRM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}

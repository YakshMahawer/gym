"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CreditCard,
  UserCheck,
  LogIn,
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

function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1 min ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function formatTime(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeader(dateString: string | Date): string {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today — ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday — ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
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
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertMessage, setTestAlertMessage] = useState("");

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

  // Handle Passcode Unlock
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.trim();
    // Default Owner PIN 2026 or superuser password
    if (clean === "2026" || clean === "YakshIsGod" || clean === "admin") {
      setIsUnlocked(true);
      setPinError("");
      localStorage.setItem("concept1_owner_unlocked", "true");
    } else {
      setPinError("Incorrect Owner Passcode. (Default PIN: 2026)");
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
      alert("Push notifications are not supported on this browser.");
      return;
    }

    try {
      setSubscribing(true);

      // Register dedicated audit service worker
      const reg = await navigator.serviceWorker.register("/sw-audit.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        alert(
          perm === "denied"
            ? "Notifications are blocked. Please enable notifications in your phone's browser / app settings."
            : "Notification permission was not granted."
        );
        return;
      }

      // Subscribe to PushManager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      // Send to server
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
      alert("🎉 Real-time alerts activated! Your device is now connected to live staff monitoring.");
    } catch (err: any) {
      console.error("Subscription error:", err);
      alert("Failed to activate notifications: " + err.message);
    } finally {
      setSubscribing(false);
    }
  };

  // Test Notification Trigger
  const handleSendTestAlert = async () => {
    try {
      setTestAlertSending(true);
      setTestAlertMessage("");
      const res = await fetch("/api/audit/test-notify", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTestAlertMessage(data.message || "Test alert sent to connected phone(s)!");
      } else {
        setTestAlertMessage("Error: " + (data.error || "Failed to trigger test push."));
      }
    } catch (err: any) {
      setTestAlertMessage("Failed: " + err.message);
    } finally {
      setTestAlertSending(false);
      setTimeout(() => setTestAlertMessage(""), 6000);
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
          // Play subtle beep if new logs appeared while app is open and sound is on
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

  // Initial load and polling every 8s
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
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Filter logs by search query
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

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((groups: Record<string, AuditLogItem[]>, item) => {
    const header = formatDateHeader(item.createdAt);
    if (!groups[header]) groups[header] = [];
    groups[header].push(item);
    return groups;
  }, {});

  // Category Pill Styler
  const getCategoryTheme = (category: string, action: string) => {
    if (action.includes("DELETE")) {
      return {
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
        dot: "bg-rose-500",
      };
    }
    if (action.includes("DATE_EDITED") || action.includes("EDIT")) {
      return {
        bg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        icon: <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        dot: "bg-amber-400",
      };
    }
    switch (category) {
      case "AUTH":
        return {
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          icon: <LogIn className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          dot: "bg-sky-400",
        };
      case "PAYMENT":
        return {
          bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
          icon: <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          dot: "bg-emerald-400",
        };
      case "MEMBER":
        return {
          bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
          icon: <UserPlus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />,
          dot: "bg-indigo-400",
        };
      case "PT":
        return {
          bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
          icon: <Dumbbell className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
          dot: "bg-cyan-400",
        };
      case "ENQUIRY":
        return {
          bg: "bg-violet-500/10 text-violet-300 border-violet-500/20",
          icon: <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />,
          dot: "bg-violet-400",
        };
      default:
        return {
          bg: "bg-slate-500/10 text-slate-300 border-slate-500/20",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
          dot: "bg-slate-400",
        };
    }
  };

  // PASSCODE UNLOCK SCREEN
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0B0F19] to-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-black text-rose-400 tracking-widest">
              Executive Companion App
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">
              Concept I Gym — Owner Monitor
            </h1>
            <p className="text-xs text-slate-400">
              Enter Owner Passcode to access live staff activity feed & phone notification controls.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="Enter Passcode (Default: 2026)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-rose-500 rounded-2xl px-4 py-3.5 text-center text-lg font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-semibold animate-shake">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-950/50 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Live Monitor</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500">
              Passcode: <code className="text-slate-400 font-bold">2026</code> or Root Password
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col pb-12 max-w-4xl mx-auto">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 p-0.5 shadow-md shadow-rose-950/40 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Concept I — Owner Monitor
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-time audit log of non-superuser actions & logins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition ${
              soundEnabled
                ? "bg-slate-800/80 border-slate-700 text-slate-200"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
            title={soundEnabled ? "Live sound chime ON" : "Sound MUTED"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 transition active:scale-95 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-rose-400" : ""}`} />
          </button>

          {/* Lock App */}
          <button
            onClick={handleLockAgain}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-rose-950/40 hover:border-rose-800 text-slate-300 hover:text-rose-400 transition"
            title="Lock Monitor"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* PWA Phone Alert Setup Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  isSubscribed
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                }`}
              >
                {isSubscribed ? <BellRing className="w-5 h-5 animate-bounce" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">
                    {isSubscribed ? "Phone Notifications Active" : "Enable Phone Push Notifications"}
                  </h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSubscribed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {isSubscribed ? "Connected" : "Action Required"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isSubscribed
                    ? `This device receives real-time alerts whenever front desk or admin logs in, collects payments, or edits records.`
                    : "Get instant vibration & sound alerts on your phone whenever staff logs in or alters gym data."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isSubscribed ? (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{subscribing ? "Activating..." : "Enable Push on This Phone"}</span>
                </button>
              ) : (
                <button
                  onClick={handleSendTestAlert}
                  disabled={testAlertSending}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{testAlertSending ? "Sending..." : "Send Test Notification"}</span>
                </button>
              )}
            </div>
          </div>

          {testAlertMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testAlertMessage}</span>
            </div>
          )}

          {/* iOS Specific 1-Minute Guidance */}
          {isIOS && !isStandalone && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iOS Setup (One-time)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                To receive native notifications on iOS 16.4+:
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-200 bg-slate-900/60 p-2 rounded-xl">
                <span>1. Tap Safari Share</span>
                <Share className="w-3 h-3 text-rose-400" />
                <span>&rarr;</span>
                <span>2. Tap <strong>'Add to Home Screen'</strong></span>
                <PlusSquare className="w-3 h-3 text-emerald-400" />
                <span>&rarr;</span>
                <span>3. Open from home screen & tap <strong>Enable Push</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Executive Today Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Today
            </span>
            <p className="text-xl sm:text-2xl font-black text-white">
              {stats.todayTotal}
            </p>
            <span className="text-[10px] text-slate-500">Staff operations</span>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
              Logins Today
            </span>
            <p className="text-xl sm:text-2xl font-black text-sky-400">
              {stats.todayLogins}
            </p>
            <span className="text-[10px] text-slate-500">Admin & Desk sessions</span>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Payments
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">
              {stats.todayPayments}
            </p>
            <span className="text-[10px] text-slate-500">Receipts issued</span>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Members
            </span>
            <p className="text-xl sm:text-2xl font-black text-indigo-400">
              {stats.todayMembers}
            </p>
            <span className="text-[10px] text-slate-500">Created / Updated</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3 space-y-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {[
              { id: "ALL", label: "All Activities" },
              { id: "AUTH", label: "🔑 Staff Logins" },
              { id: "PAYMENT", label: "💳 Payments & Receipts" },
              { id: "MEMBER", label: "👤 Members" },
              { id: "PT", label: "🏋️ PT Add-ons" },
              { id: "ENQUIRY", label: "💬 Enquiries" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-[11px] ${
                  selectedCategory === tab.id
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-950/40"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Staff Filter, Date Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, receipt, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Staff Members</option>
                <option value="admin">Administrator (admin)</option>
                <option value="deskmanager">Front Desk (deskmanager)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-rose-500/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Logs Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500" />
              <p className="text-xs">Loading live staff audit logs...</p>
            </div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="p-12 text-center bg-slate-900/30 border border-slate-800/50 rounded-3xl space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No staff activities found</p>
              <p className="text-xs text-slate-500">
                {searchQuery || selectedCategory !== "ALL" || selectedStaff !== "ALL"
                  ? "Try clearing filters to see all events."
                  : "Whenever non-superuser staff logs in or modifies records, events will appear here in real time."}
              </p>
            </div>
          ) : (
            Object.entries(groupedLogs).map(([groupHeader, groupItems]) => (
              <div key={groupHeader} className="space-y-2">
                {/* Date Header Separator */}
                <div className="flex items-center gap-2 px-1 pt-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    {groupHeader}
                  </span>
                  <div className="flex-1 h-px bg-slate-800/80" />
                  <span className="text-[10px] font-bold text-slate-500">
                    {groupItems.length} {groupItems.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {/* Log Event Cards */}
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const theme = getCategoryTheme(item.category, item.action);
                    const isExpanded = expandedLogId === item.id;
                    const staffBadge =
                      item.role === "ADMIN"
                        ? { label: "Admin", style: "bg-amber-500/20 text-amber-300 border-amber-500/30" }
                        : { label: "Front Desk", style: "bg-purple-500/20 text-purple-300 border-purple-500/30" };

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3.5 transition shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {/* Action Category Icon */}
                            <div className={`p-2 rounded-xl border ${theme.bg} shrink-0 mt-0.5`}>
                              {theme.icon}
                            </div>

                            {/* Title & Details */}
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-white">
                                  {item.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${staffBadge.style}`}
                                >
                                  {staffBadge.label}: {item.username}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-snug">
                                {item.details}
                              </p>
                            </div>
                          </div>

                          {/* Time & Expand */}
                          <div className="text-right shrink-0 space-y-1">
                            <span className="text-[11px] font-bold text-slate-300 block">
                              {formatTime(item.createdAt)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Optional Metadata Details Toggle */}
                        {item.metadata && (
                          <div className="pt-1.5 border-t border-slate-800/60">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition"
                            >
                              <span>{isExpanded ? "Hide Metadata" : "Inspect Raw Details"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <pre className="mt-2 p-2.5 rounded-xl bg-slate-950 text-[10px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
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

      {/* Floating Bottom Live Monitor Status */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 py-2.5 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[11px] font-medium text-slate-300">
            Auto-Sync active (every 8s)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-500">
            {stats.subscribedDevices} phone(s) receiving push
          </span>
          <a
            href="/portal"
            className="text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-0.5"
          >
            <span>Open Staff CRM</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}

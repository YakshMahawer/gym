/**
 * Utility functions for Gym CRM
 */

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function calculateDaysRemaining(endDate: Date | string | null | undefined): number {
  if (!endDate) return 0;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isUpcomingWithinDays(date: Date | string | null | undefined, days: number = 7): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // Compare month & day for birthdays / anniversaries
  const thisYearBirthday = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  const diffTime = thisYearBirthday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= days;
}

export function generateMemberId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${randomNum}`;
}

export function extractNumericId(memberId: string | null | undefined): number | null {
  if (!memberId) return null;
  const match = memberId.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function normalizeMemberId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return "1001";
  const trimmed = String(id).trim();
  const numeric = trimmed.replace(/\D/g, "");
  if (numeric) {
    return numeric;
  }
  return trimmed;
}

export function generateReceiptNo(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `REC-${dateStr}-${randomSuffix}`;
}

export function isValidPhoneNumber(phone: string | number | null | undefined): boolean {
  if (phone === null || phone === undefined) return false;
  const str = String(phone).trim();
  if (!str) return false;
  // Clean all whitespace, dashes, parentheses, dots
  const clean = str.replace(/[\s\-\(\)\.]/g, "");
  if (!clean) return false;

  // 1. Standard Indian mobile number (10 digits starting with 6, 7, 8, 9, with optional +91, 91, or 0)
  const indianRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  if (indianRegex.test(clean)) return true;

  // 2. International phone number (7 to 15 digits, optional +)
  const internationalRegex = /^\+?[1-9]\d{6,14}$/;
  if (internationalRegex.test(clean)) return true;

  return false;
}

export function cleanPhoneNumber(phone: string | number | null | undefined): string {
  if (phone === null || phone === undefined) return "";
  const str = String(phone).trim();
  if (!str) return "";
  const clean = str.replace(/[\s\-\(\)\.]/g, "");
  // If it's a 10-digit Indian number with +91, 91, or 0, return normalized 10 digits
  if (/^(?:\+91|91|0)[6-9]\d{9}$/.test(clean)) {
    return clean.slice(-10);
  }
  return clean;
}


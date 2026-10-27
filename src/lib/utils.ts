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

/**
 * Formats a currency amount with "Rs." prefix (e.g. "Rs. 5,000")
 * Specifically used for PDF receipts and plain text messages to prevent
 * the unicode Rupee symbol (₹) from corrupting into '¹' (superscript 1) in PDF viewers.
 */
export function formatRS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rs. 0";
  const num = Math.round(amount).toLocaleString("en-IN");
  return `Rs. ${num}`;
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

/**
 * Extracts only the first name from a member record or full name string.
 * Used for WhatsApp automation (receipts, birthday wishes, anniversary greetings)
 * so messages address members warmly by first name only (e.g. 'Rahul' instead of 'Rahul Sharma').
 */
export function getFirstName(
  member?: { firstName?: string | null; fullName?: string | null } | string | null
): string {
  if (!member) return "Member";
  if (typeof member === "string") {
    const clean = member.trim().split(/\s+/)[0];
    return clean || "Member";
  }
  const raw = member.firstName?.trim() || member.fullName?.trim() || "";
  const first = raw.split(/\s+/)[0];
  return first || member.fullName?.trim() || "Member";
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

export interface FiscalYearInfo {
  startYear: number;
  endYear: number;
  startDate: Date;
  endDate: Date;
  fyShort: string; // e.g. "26-27"
  fyDot: string;   // e.g. "26.27"
  fyFull: string;  // e.g. "2026-2027"
}

export function getFiscalYear(date?: Date | string | null): FiscalYearInfo {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const month = validDate.getMonth(); // 0-indexed: 0=Jan, 3=Apr
  const year = validDate.getFullYear();

  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;

  const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0); // April 1
  const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31

  const s2 = String(startYear).slice(-2);
  const e2 = String(endYear).slice(-2);

  return {
    startYear,
    endYear,
    startDate,
    endDate,
    fyShort: `${s2}-${e2}`,
    fyDot: `${s2}.${e2}`,
    fyFull: `${startYear}-${endYear}`,
  };
}

export function formatInvoiceNo(
  receiptNo: string | null | undefined,
  paymentDate?: Date | string | null
): string {
  if (!receiptNo) return "00001";
  const str = String(receiptNo).trim();
  if (str.startsWith("OLD-") || str.startsWith("REC-OLD-")) {
    return str;
  }

  const digits = str.replace(/\D/g, "");
  const padded = digits ? digits.padStart(5, "0") : str;

  if (paymentDate) {
    const { fyShort } = getFiscalYear(paymentDate);
    return `${fyShort}/${padded}`;
  }
  return padded;
}



import { formatINR, formatDate } from "@/lib/utils";

export interface ReceiptData {
  receiptNo: string;
  paymentDate: string | Date;
  amount: number;
  paymentMethod: string;
  paymentType?: string;
  notes?: string | null;
  subscription?: {
    planName?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    totalAmount?: number;
    dueAmount?: number;
  } | null;
  ptSubscription?: {
    planName?: string;
    trainerName?: string | null;
    totalSessions?: number | null;
    completedSessions?: number | null;
    startDate?: string | Date;
    endDate?: string | Date;
    totalAmount?: number;
    dueAmount?: number;
  } | null;
  member?: {
    fullName: string;
    memberId: string;
    phone: string;
    email?: string | null;
  };
  planName?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export function sanitizePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  return digits;
}

export function formatWhatsAppReceiptText(receipt: ReceiptData): string {
  const memberName = receipt.member?.fullName || "Valued Member";
  const memberId = receipt.member?.memberId || "N/A";
  const amount = formatINR(receipt.amount);
  const paymentDate = formatDate(receipt.paymentDate);
  const mode = receipt.paymentMethod || "UPI";

  const isPT =
    receipt.paymentType === "PERSONAL_TRAINING" ||
    receipt.ptSubscription ||
    Boolean(receipt.planName?.startsWith("PT") || receipt.planName?.includes("Personal Training"));

  const planName =
    receipt.planName ||
    (receipt.ptSubscription
      ? `PT: ${receipt.ptSubscription.planName}${receipt.ptSubscription.trainerName ? ` (${receipt.ptSubscription.trainerName})` : ""}`
      : receipt.subscription?.planName ||
        (receipt.paymentType ? receipt.paymentType.replace(/_/g, " ") : "Gym Membership"));

  const due =
    receipt.subscription?.dueAmount !== undefined
      ? formatINR(receipt.subscription.dueAmount)
      : receipt.ptSubscription?.dueAmount !== undefined
      ? formatINR(receipt.ptSubscription.dueAmount)
      : "₹0.00";

  const invoiceNo = receipt.receiptNo.startsWith("REC-")
    ? receipt.receiptNo.replace("REC-", "INV-")
    : receipt.receiptNo;

  // Construct origin URL
  let origin = "https://concept1gym.vercel.app";
  if (typeof window !== "undefined" && window.location.origin) {
    origin = window.location.origin;
  }

  const receiptUrl = `${origin}/receipt/${encodeURIComponent(receipt.receiptNo)}`;

  return (
    `*CONCEPT I GYM - PAYMENT RECEIPT* 🏋️‍♂️\n\n` +
    `Dear *${memberName}* (ID: #${memberId}),\n` +
    `Thank you for your payment! Here are your official payment details:\n\n` +
    `🧾 *Receipt No:* ${invoiceNo}\n` +
    `📅 *Date:* ${paymentDate}\n` +
    `💳 *Package / Plan:* ${planName}\n` +
    `💰 *Amount Paid:* ${amount}\n` +
    `💳 *Payment Mode:* ${mode}\n` +
    `⚖️ *Pending Balance:* ${due}\n\n` +
    `📄 *Official Digital Invoice Link:*\n${receiptUrl}\n\n` +
    `Thank you for choosing Concept I Gym! Stay fit & strong! 💪\n` +
    `_Sector 12, Main Central Road, Concept I Gym_`
  );
}

export function openWhatsAppReceipt(receipt: ReceiptData): void {
  const phone = sanitizePhone(receipt.member?.phone);
  const messageText = formatWhatsAppReceiptText(receipt);
  const encodedText = encodeURIComponent(messageText);

  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(waUrl, "_blank", "noopener,noreferrer");
}

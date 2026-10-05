import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

  return (
    `*CONCEPT I GYM - PAYMENT RECEIPT* 🏋️‍♂️\n\n` +
    `Dear *${memberName}* (ID: ${memberId}),\n` +
    `Thank you for your payment! Here are your official receipt details:\n\n` +
    `🧾 *Receipt / Invoice No:* ${invoiceNo}\n` +
    `📅 *Payment Date:* ${paymentDate}\n` +
    `💳 *Package / Plan:* ${planName}\n` +
    `💰 *Amount Paid:* ${amount}\n` +
    `💳 *Payment Mode:* ${mode}\n` +
    `⚖️ *Pending Balance:* ${due}\n\n` +
    `Your official PDF receipt is attached. Thank you for being a valued member of Concept I Gym! Stay fit & strong! 💪\n\n` +
    `_Sector 12, Main Central Road, Concept I Gym_`
  );
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

export async function downloadReceiptPdf(elementId: string, receiptNo: string): Promise<File | null> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return null;

    // Temporarily hide elements marked as print:hidden for clean capture
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.classList.contains("print:hidden"),
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, Math.min(pdfHeight, 280));

    const fileName = `Receipt_${receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    
    // Save to device
    pdf.save(fileName);

    // Also return File blob for Web Share API
    const blob = pdf.output("blob");
    return new File([blob], fileName, { type: "application/pdf" });
  } catch (err) {
    console.error("Failed to generate receipt PDF:", err);
    return null;
  }
}

export async function shareOnWhatsApp(
  receipt: ReceiptData,
  elementId?: string
): Promise<void> {
  const phone = sanitizePhone(receipt.member?.phone);
  const messageText = formatWhatsAppReceiptText(receipt);
  const encodedText = encodeURIComponent(messageText);

  // 1. If elementId is provided, generate and download PDF automatically
  let pdfFile: File | null = null;
  if (elementId) {
    pdfFile = await downloadReceiptPdf(elementId, receipt.receiptNo);
  }

  // 2. Try native Web Share API with files if on mobile browser that supports it
  if (
    pdfFile &&
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        title: `Receipt ${receipt.receiptNo}`,
        text: messageText,
        files: [pdfFile],
      });
      return;
    } catch (shareErr) {
      // User cancelled share or failed, fallback to standard WhatsApp Web URL
      console.log("Native share cancelled or failed, falling back to WhatsApp link", shareErr);
    }
  }

  // 3. Fallback / Standard Desktop WhatsApp Web URL
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(waUrl, "_blank", "noopener,noreferrer");
}

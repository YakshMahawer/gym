import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { formatDate, formatInvoiceNo } from "@/lib/utils";

export interface ReceiptPdfData {
  invoiceNo: string;
  receiptNo: string;
  invoiceDate: string;
  memberName: string;
  memberId: string;
  memberPhone: string;
  email?: string;
  planName: string;
  startDate?: string;
  endDate?: string;
  paymentMethod: string;
  totalAmount: number;
}

/**
 * Pure ASCII currency formatter for jsPDF
 * Strictly avoids any Unicode Rupee symbol (₹ / \u20B9) or non-breaking spaces
 * that corrupt into superscript '1' (¹) in Latin-1 / WinAnsi PDF engines.
 */
function toRs(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rs. 0";
  const formatted = Math.round(amount).toLocaleString("en-IN");
  return `Rs. ${formatted}`;
}

/**
 * Generates a clean, professional vector PDF receipt for Concept 1 Gym
 * With pure Rs. currency formatting and zero tax breakdown.
 */
export function buildReceiptPdfDocument(data: ReceiptPdfData): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Dark Top Header Band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, "F");

  // Gym Branded Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CONCEPT 1 GYM", 15, 17);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("1st floor, Dream Iconia, near Hans Party Plot, Manjalpur, Vadodara, Gujarat 390011", 15, 26);

  // 2. Receipt Meta Banner
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 42, 180, 18, 2, 2, "FD");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 20, 48);
  doc.text("RECEIPT DATE", 145, 48);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(data.invoiceNo, 20, 55);
  doc.text(data.invoiceDate, 145, 55);

  // 3. Member & Plan Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 65, 180, 42, 2, 2, "S");

  // Member Section (Left)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIVED FROM (MEMBER):", 20, 72);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.memberName, 20, 79);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${data.memberPhone || "N/A"}`, 20, 85.5);
  doc.text(`Member ID: ${data.memberId || "N/A"}`, 20, 91.5);
  if (data.email) {
    doc.text(`Email: ${data.email}`, 20, 97.5);
  }

  // Plan Section (Right)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text("PLAN & MEMBERSHIP DETAILS:", 110, 72);

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.planName.slice(0, 38), 110, 79);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (data.startDate && data.endDate) {
    doc.text(`Validity: ${data.startDate} to ${data.endDate}`, 110, 85.5);
  } else {
    doc.text(`Validity: Active`, 110, 85.5);
  }
  doc.text(`Payment Mode: ${data.paymentMethod || "UPI"}`, 110, 91.5);
  doc.text(`Receipt #: ${data.receiptNo}`, 110, 97.5);

  // 4. Line Items Table Header (No tax columns)
  doc.setFillColor(15, 23, 42);
  doc.rect(15, 113, 180, 8.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 20, 118.5);
  doc.text("AMOUNT (Rs.)", 155, 118.5);

  // Line Item Row
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.planName.slice(0, 50), 20, 129);
  doc.setFont("helvetica", "bold");
  doc.text(toRs(data.totalAmount), 155, 129);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 136, 195, 136);

  // 5. Clean Total Section (Direct amount, zero tax division)
  const y = 146;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Amount Paid:", 100, y);
  doc.text(toRs(data.totalAmount), 155, y);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(100, y + 3, 195, y + 3);

  // 6. Payment Status Confirmation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text(`Status: Payment Received & Accounted (${data.paymentMethod})`, 100, y + 10);

  // 7. Footer & Notes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This is an electronically generated payment receipt. No signature or physical stamp is required.",
    15,
    185
  );
  doc.text(
    "Thank you for being part of Concept 1 Gym! Stay dedicated, stay strong.",
    15,
    191
  );

  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

/**
 * Fetch payment from DB and generate PDF binary
 */
export async function getReceiptPdfBuffer(identifier: string): Promise<{
  buffer: Uint8Array;
  filename: string;
} | null> {
  const decoded = decodeURIComponent(identifier).trim();

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: decoded },
        { receiptNo: decoded },
        { receiptNo: decoded.padStart(5, "0") },
        { receiptNo: `REC-${decoded}` },
      ],
    },
    include: {
      member: true,
      subscription: true,
      ptSubscription: true,
    },
  });

  if (!payment) return null;

  const member = payment.member;
  const isPT = Boolean(
    payment.paymentType === "PERSONAL_TRAINING" || payment.ptSubscription
  );

  const ptTrainer = payment.ptSubscription?.trainerName;
  const planName =
    payment.ptSubscription
      ? `Personal Training - ${payment.ptSubscription.planName}${ptTrainer ? ` (Trainer: ${ptTrainer})` : ""}`
      : payment.subscription?.planName ||
        (payment.paymentType === "OTHER" && payment.notes
          ? `Other: ${payment.notes}`
          : payment.paymentType ? payment.paymentType.replace(/_/g, " ") : "Gym Membership");

  const startDate = payment.ptSubscription?.startDate || payment.subscription?.startDate;
  const endDate = payment.ptSubscription?.endDate || payment.subscription?.endDate;

  const totalAmount = Number(payment.amount) || 0;
  const invoiceNo = formatInvoiceNo(payment.receiptNo, payment.paymentDate);

  const pdfBuffer = buildReceiptPdfDocument({
    invoiceNo,
    receiptNo: payment.receiptNo,
    invoiceDate: formatDate(payment.paymentDate),
    memberName: member?.fullName || "Valued Member",
    memberId: member?.memberId || "N/A",
    memberPhone: member?.phone || "",
    email: member?.email || undefined,
    planName,
    startDate: startDate ? formatDate(startDate) : undefined,
    endDate: endDate ? formatDate(endDate) : undefined,
    paymentMethod: payment.paymentMethod || "UPI",
    totalAmount,
  });

  const cleanFilename = `Concept1Gym_Receipt_${payment.receiptNo}.pdf`;
  return { buffer: pdfBuffer, filename: cleanFilename };
}

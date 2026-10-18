import { jsPDF } from "jspdf";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate, formatInvoiceNo } from "@/lib/utils";

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
  taxableAmount: number;
  cgst: number;
  sgst: number;
}

/**
 * Generates a clean, professional vector PDF invoice for Concept 1 Gym
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

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("Sector 12, Main Central Road, Near City Plaza", 15, 23.5);
  doc.text("GSTIN: 07AAACA1234F1Z8 | CIN: U92412DL2026PTC10452", 15, 29);

  // 2. Invoice Meta Banner
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 42, 180, 18, 2, 2, "FD");

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL TAX INVOICE", 20, 48);
  doc.text("INVOICE DATE", 145, 48);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(data.invoiceNo, 20, 55);
  doc.text(data.invoiceDate, 145, 55);

  // 3. Member & Subscription Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 65, 180, 42, 2, 2, "S");

  // Member Section (Left)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO (MEMBER):", 20, 72);

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
  doc.text(data.planName.slice(0, 36), 110, 79);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Validity: ${data.startDate || "N/A"} to ${data.endDate || "N/A"}`, 110, 85.5);
  doc.text(`Payment Mode: ${data.paymentMethod || "UPI"}`, 110, 91.5);
  doc.text(`Receipt #: ${data.receiptNo}`, 110, 97.5);

  // 4. Line Items Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(15, 113, 180, 8.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 20, 118.5);
  doc.text("HSN / SAC", 100, 118.5);
  doc.text("RATE (INR)", 135, 118.5);
  doc.text("AMOUNT (INR)", 168, 118.5);

  // Line Item Row
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.planName.slice(0, 42), 20, 128);
  doc.text("999723", 100, 128);
  doc.text(formatINR(data.taxableAmount).replace("₹", "").trim(), 135, 128);
  doc.text(formatINR(data.taxableAmount).replace("₹", "").trim(), 168, 128);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 133, 195, 133);

  // 5. PAID IN FULL Seal / Badge
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.6);
  doc.roundedRect(20, 142, 48, 17, 2, 2, "FD");
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("✓ PAID IN FULL", 24, 153);

  // 6. Tax Breakdown & Totals (Right Column)
  let y = 143;
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Taxable Value:", 120, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.taxableAmount), 168, y);

  y += 6.5;
  doc.setTextColor(100, 116, 139);
  doc.text("CGST (9%):", 120, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.cgst), 168, y);

  y += 6.5;
  doc.setTextColor(100, 116, 139);
  doc.text("SGST (9%):", 120, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.sgst), 168, y);

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.line(120, y, 195, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid:", 120, y);
  doc.text(formatINR(data.totalAmount), 168, y);

  // 7. Footer & Legal Disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This is an electronically generated tax invoice. No signature or physical stamp is required.",
    15,
    192
  );
  doc.text(
    "Thank you for being part of Concept 1 Gym! Stay dedicated, stay strong.",
    15,
    197
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
        (payment.paymentType ? payment.paymentType.replace(/_/g, " ") : "Gym Membership");

  const startDate = payment.ptSubscription?.startDate || payment.subscription?.startDate;
  const endDate = payment.ptSubscription?.endDate || payment.subscription?.endDate;

  const totalAmount = Number(payment.amount) || 0;
  const taxableAmount = Math.round((totalAmount / 1.18) * 100) / 100;
  const totalGst = Math.round((totalAmount - taxableAmount) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst - cgst) * 100) / 100;

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
    taxableAmount,
    cgst,
    sgst,
  });

  const cleanFilename = `Concept1Gym_Invoice_${payment.receiptNo}.pdf`;
  return { buffer: pdfBuffer, filename: cleanFilename };
}

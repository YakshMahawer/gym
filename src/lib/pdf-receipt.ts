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
  sacCode?: string;
}

const TERMS_AND_CONDITIONS = [
  "1. The management reserves the right of admission, renewal, and termination of membership.",
  "2. The gymnasium is open to members of all communities, irrespective of caste or creed.",
  "3. All fees must be paid in advance. Once paid, fees are non-refundable, non-transferable, and no extension is given under any circumstances.",
  "4. Concept Gym holds the right to discontinue or restrict facilities without prior notice.",
  "5. Members must use all equipment and facilities with due care and return them to their proper place after use.",
  "6. Any loss or damage to equipment or facilities due to careless handling shall be borne by the member concerned.",
  "7. Valuables or electronic items kept in the gym premises are at the member's own risk. Management shall not be responsible for any loss or damage.",
  "8. Members shall use the facilities at their own risk. The gym shall not be liable for any accidents, injuries, or mishaps occurring during their presence in the premises.",
  "9. Members with a history of illness, injury, operations, or medical conditions shall enroll at their own risk.",
  "10. Members must provide accurate information regarding their medical history at the time of enrollment. Concept Gym is not responsible for any health issues that come back or increase.",
  "11. Any disputes arising out of this membership/services or any Concept Gym-related issues shall be subject to Vadodara jurisdiction only.",
  "12. The GST Number is under Composition Scheme.",
];

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
 * With pure Rs. currency formatting, zero tax breakdown, and Terms & Conditions.
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
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONCEPT 1 GYM", 15, 16);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("1st floor, Dream Iconia, near Hans Party Plot, Manjalpur, Vadodara, Gujarat 390011", 15, 23.5);
  doc.text("GSTIN: 24AALFC1929P1Z2  |  Composition Scheme (No tax collected on bill)", 15, 29);

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

  doc.setFontSize(10.5);
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

  doc.setFontSize(10);
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

  // 4. Line Items Table Header (with SAC code column)
  doc.setFillColor(15, 23, 42);
  doc.rect(15, 113, 180, 8.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 20, 118.5);
  doc.text("HSN / SAC", 115, 118.5);
  doc.text("AMOUNT (Rs.)", 155, 118.5);

  // Line Item Row
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.planName.slice(0, 48), 20, 127.5);
  doc.setFont("helvetica", "bold");
  doc.text(data.sacCode || "-", 115, 127.5);
  doc.text(toRs(data.totalAmount), 155, 127.5);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 134, 195, 134);

  // 5. Clean Total Section (Direct amount, zero tax division)
  const y = 143;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Amount Paid:", 95, y);
  doc.text(toRs(data.totalAmount), 155, y);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(95, y + 2.5, 195, y + 2.5);

  // 6. Payment Status Confirmation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text(`Status: Payment Received & Accounted (${data.paymentMethod})`, 95, y + 8.5);

  // 7. CONCEPT GYM - TERMS & CONDITIONS (Downside Section)
  const termsBoxY = 158;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, termsBoxY, 180, 116, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CONCEPT GYM - TERMS & CONDITIONS", 20, termsBoxY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);

  let curY = termsBoxY + 11;
  const maxTermsWidth = 170;

  for (const term of TERMS_AND_CONDITIONS) {
    const splitLines = doc.splitTextToSize(term, maxTermsWidth);
    doc.text(splitLines, 20, curY);
    curY += splitLines.length * 3.3 + 1.2;
  }

  // 8. Bottom Footer Signoff
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This is an electronically generated digital payment receipt. Valid without signature or stamp. Thank you for choosing Concept 1 Gym!",
    15,
    286
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
  const isOther = payment.paymentType === "OTHER";

  // SAC code: 999723 for Gym membership, 999729 for PT, blank for Others
  const sacCode = isPT ? "999729" : isOther ? "" : "999723";

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
    sacCode,
  });

  const cleanFilename = `Concept1Gym_Receipt_${payment.receiptNo}.pdf`;
  return { buffer: pdfBuffer, filename: cleanFilename };
}

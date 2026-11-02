import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR, formatRS, formatDate, formatInvoiceNo } from "@/lib/utils";
import { CheckCircle2, Dumbbell, Printer } from "lucide-react";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  params: {
    id: string;
  };
}

export default async function PublicReceiptPage({ params }: ReceiptPageProps) {
  const decodedId = decodeURIComponent(params.id).trim();

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: decodedId },
        { receiptNo: decodedId },
        { receiptNo: decodedId.padStart(5, "0") },
        { receiptNo: `REC-${decodedId}` },
      ],
    },
    include: {
      member: true,
      subscription: true,
      ptSubscription: true,
    },
  });

  if (!payment) {
    notFound();
  }

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

  const isOther = payment.paymentType === "OTHER";
  const sacCode = isPT ? "999729" : isOther ? "" : "999723";

  const totalAmount = Number(payment.amount) || 0;
  const invoiceNo = formatInvoiceNo(payment.receiptNo, payment.paymentDate);

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-6 flex flex-col items-center justify-start print:p-0 print:bg-white">
      {/* Top Floating Actions (Hidden in Print) */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 uppercase tracking-tight block">
              Concept 1 Gym
            </span>
            <span className="text-[10px] text-slate-500">Official Payment Receipt</span>
          </div>
        </div>

        <PrintButton receiptId={payment.receiptNo} />
      </div>

      {/* Main Printable Payment Receipt Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full">
        <div className="p-6 sm:p-8 space-y-5 text-slate-900 font-sans">
          
          {/* Gym Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-300">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Concept 1 Gym
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                1st floor, Dream Iconia, near Hans Party Plot, Manjalpur, Vadodara, Gujarat 390011
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                GSTIN: <span className="font-mono font-bold text-slate-800">24AALFC1929P1Z2</span> • <span className="text-slate-500">Composition Scheme</span>
              </p>
            </div>
          </div>

          {/* Receipt Meta Banner */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {isPT ? "Personal Training (PT) Receipt" : "Payment Receipt"}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {invoiceNo}
              </span>
              {payment.receiptNo && !payment.receiptNo.startsWith("OLD-") && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  Receipt #{payment.receiptNo.padStart(5, "0")}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Receipt Date
              </span>
              <span className="font-semibold text-slate-800">
                {formatDate(payment.paymentDate)}
              </span>
            </div>
          </div>

          {/* Member & Plan Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Member Name:</span>
                <span className="font-bold text-slate-900">{member.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Member ID:</span>
                <span className="font-mono text-slate-700">{member.memberId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Phone Number:</span>
                <span className="font-mono text-slate-700">{member.phone || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                  {isPT ? "PT Package Plan:" : "Membership Plan:"}
                </span>
                <span className="font-bold text-slate-900">{planName}</span>
              </div>
              {ptTrainer && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Trainer:</span>
                  <span className="font-semibold text-slate-800">{ptTrainer}</span>
                </div>
              )}
              {startDate && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    {isPT ? "PT Start Date:" : "Membership Start:"}
                  </span>
                  <span className="font-medium text-slate-700">{formatDate(startDate)}</span>
                </div>
              )}
              {endDate && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                    {isPT ? "PT Expiry Date:" : "Membership End:"}
                  </span>
                  <span className="font-bold text-emerald-700">{formatDate(endDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Item Bill Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-center">HSN / SAC</th>
                  <th className="py-2.5 px-4 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {planName}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                    {sacCode || "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatRS(totalAmount)}
                  </td>
                </tr>
                <tr className="bg-slate-100/80 font-bold text-slate-900 text-xs border-t-2 border-slate-300">
                  <td colSpan={2} className="py-3 px-4">Total Amount Paid</td>
                  <td className="py-3 px-4 text-right text-base text-emerald-800 font-black">
                    {formatRS(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Mode & Notes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Payment Mode:</span>
              <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                {payment.paymentMethod}
              </span>
            </div>

            {payment.notes && (
              <div className="text-[11px] text-slate-500 italic">
                Remark: {payment.notes}
              </div>
            )}
          </div>

          {/* Verification & Stamp */}
          <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-400">
            <div>
              <p className="font-semibold text-slate-600">Concept 1 Gym Management</p>
              <p>This is a computer-generated digital payment receipt.</p>
              <p className="mt-0.5 text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Payment Verified & Accounted</span>
              </p>
            </div>

            <div className="text-right">
              <div className="h-8"></div>
              <p className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                Authorized Signatory
              </p>
            </div>
          </div>

          {/* CONCEPT GYM – TERMS & CONDITIONS (Downside) */}
          <div className="pt-4 border-t border-slate-200 space-y-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
              Concept Gym – Terms & Conditions
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-600 leading-relaxed">
              <li>The management reserves the right of admission, renewal, and termination of membership.</li>
              <li>The gymnasium is open to members of all communities, irrespective of caste or creed.</li>
              <li>All fees must be paid in advance. Once paid, fees are non-refundable, non-transferable, and no extension is given under any circumstances.</li>
              <li>Concept Gym holds the right to discontinue or restrict facilities without prior notice.</li>
              <li>Members must use all equipment and facilities with due care and return them to their proper place after use.</li>
              <li>Any loss or damage to equipment or facilities due to careless handling shall be borne by the member concerned.</li>
              <li>Valuables or electronic items kept in the gym premises are at the member’s own risk. Management shall not be responsible for any loss or damage.</li>
              <li>Members shall use the facilities at their own risk. The gym shall not be liable for any accidents, injuries, or mishaps occurring during their presence in the premises.</li>
              <li>Members with a history of illness, injury, operations, or medical conditions shall enroll at their own risk.</li>
              <li>Members must provide accurate information regarding their medical history at the time of enrollment. Concept Gym is not responsible for any health issues that come back or increase.</li>
              <li>Any disputes arising out of this membership/services or any Concept Gym-related issues shall be subject to Vadodara jurisdiction only.</li>
              <li>The GST Number is under Composition Scheme.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

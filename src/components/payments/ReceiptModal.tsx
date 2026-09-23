"use client";

import React from "react";
import { X, Printer, CheckCircle2 } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

interface ReceiptModalProps {
  receipt: {
    id?: string;
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
    member?: {
      fullName: string;
      memberId: string;
      phone: string;
      email?: string | null;
      subscriptions?: Array<{
        planName?: string;
        startDate?: string | Date;
        endDate?: string | Date;
      }>;
    };
    planName?: string;
    startDate?: string | Date;
    endDate?: string | Date;
  } | null;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  const memberName = receipt.member?.fullName || "Member";
  const memberId = receipt.member?.memberId || "N/A";
  const memberPhone = receipt.member?.phone || "";

  // Exact plan name / description for this single payment
  const planName =
    receipt.planName ||
    receipt.subscription?.planName ||
    receipt.member?.subscriptions?.[0]?.planName ||
    (receipt.paymentType ? receipt.paymentType.replace(/_/g, " ") : "Gym Membership");

  const startDate = receipt.startDate || receipt.subscription?.startDate || receipt.member?.subscriptions?.[0]?.startDate;
  const endDate = receipt.endDate || receipt.subscription?.endDate || receipt.member?.subscriptions?.[0]?.endDate;

  // Single transaction tax calculations (18% GST Breakdown: 9% CGST + 9% SGST)
  const totalAmount = Number(receipt.amount) || 0;
  const taxableValue = Math.round((totalAmount / 1.18) * 100) / 100;
  const totalGst = Math.round((totalAmount - taxableValue) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst - cgst) * 100) / 100;

  // Professional Invoice Number
  const invoiceNo = receipt.receiptNo.startsWith("REC-")
    ? receipt.receiptNo.replace("REC-", "INV-")
    : receipt.receiptNo;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Targeted Printable Modal Container */}
      <div
        id="gym-receipt-modal"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 print:shadow-none print:border-none print:max-w-none print:w-full"
      >
        {/* Tax Invoice Content Body */}
        <div className="p-6 sm:p-8 space-y-5 text-slate-900 font-sans">
          
          {/* Top Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-300">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Concept I Gym
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Sector 12, Main Central Road, Near City Plaza
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                GSTIN: <span className="font-semibold text-slate-700">07AAACA1234F1Z8</span> • CIN: U92412DL2026PTC10452
              </p>
            </div>

            <div className="flex items-center gap-1 print:hidden">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Meta Banner */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Membership Invoice
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {invoiceNo}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Invoice Date
              </span>
              <span className="font-semibold text-slate-800">
                {formatDate(receipt.paymentDate)}
              </span>
            </div>
          </div>

          {/* Member & Plan Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Member Name:</span>
                <span className="font-bold text-slate-900">{memberName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Member ID:</span>
                <span className="font-mono text-slate-700">{memberId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Phone Number:</span>
                <span className="font-mono text-slate-700">{memberPhone || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Membership Plan:</span>
                <span className="font-bold text-slate-900">{planName}</span>
              </div>
              {startDate && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Membership Start:</span>
                  <span className="font-medium text-slate-700">{formatDate(startDate)}</span>
                </div>
              )}
              {endDate && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Membership End:</span>
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
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {planName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium">
                    {formatINR(totalAmount)}
                  </td>
                </tr>
                <tr className="bg-slate-50/50 text-slate-600 text-[11px]">
                  <td className="py-2 px-4">Taxable Value (Base)</td>
                  <td className="py-2 px-4 text-right font-mono">{formatINR(taxableValue)}</td>
                </tr>
                <tr className="bg-slate-50/50 text-slate-600 text-[11px]">
                  <td className="py-1.5 px-4">CGST @ 9%</td>
                  <td className="py-1.5 px-4 text-right font-mono">{formatINR(cgst)}</td>
                </tr>
                <tr className="bg-slate-50/50 text-slate-600 text-[11px]">
                  <td className="py-1.5 px-4">SGST @ 9%</td>
                  <td className="py-1.5 px-4 text-right font-mono">{formatINR(sgst)}</td>
                </tr>
                <tr className="bg-slate-100/80 font-bold text-slate-900 text-xs border-t-2 border-slate-300">
                  <td className="py-3 px-4">Total Amount Paid</td>
                  <td className="py-3 px-4 text-right text-base text-emerald-800 font-black">
                    {formatINR(totalAmount)}
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
                {receipt.paymentMethod}
              </span>
            </div>

            {receipt.notes && (
              <div className="text-[11px] text-slate-500 italic">
                Remark: {receipt.notes}
              </div>
            )}
          </div>

          {/* Verification & Stamp */}
          <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-[10px] text-slate-400">
            <div>
              <p className="font-semibold text-slate-600">Concept I Gym Management</p>
              <p>This is a computer-generated tax invoice.</p>
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
        </div>

        {/* Modal Actions (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}

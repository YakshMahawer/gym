"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MembershipStatus, SubscriptionStatus, PaymentMethod } from "@prisma/client";
import { isValidPhoneNumber, cleanPhoneNumber } from "@/lib/utils";

function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === "NULL" || isNaN(Number(serial))) return null;
  const num = Number(serial);
  const utcDays = num - 25569;
  return new Date(utcDays * 86400 * 1000);
}

function formatPlanName(months: any, amount: any, membershipId: any): string {
  const m = Number(months) || 0;
  if (m === 1) return "Monthly Standard (1 Month)";
  if (m === 3) return "Quarterly Pro (3 Months)";
  if (m === 6) return "Half Yearly Elite (6 Months)";
  if (m === 12) return "Annual Platinum (12 Months)";
  if (m === 14 || m === 15 || m === 16) return `Annual Plus (${m} Months)`;
  if (m > 0) return `${m} Months Membership`;
  return `Standard Plan (${membershipId || "General"})`;
}

export function mapPaymentType(typeVal: any): PaymentMethod {
  if (typeVal === undefined || typeVal === null) return PaymentMethod.UPI;
  const val = String(typeVal).trim().toUpperCase();
  if (val === "1" || val === "CASH") return PaymentMethod.CASH;
  if (val === "2" || val === "CHEQUE" || val === "CHECK") return PaymentMethod.CHEQUE;
  if (val === "3" || val === "CARD" || val === "CREDIT" || val === "DEBIT" || val === "POS") return PaymentMethod.CARD;
  if (
    val === "4" ||
    val === "BANK" ||
    val === "BANK_TRANSFER" ||
    val === "NETBANKING" ||
    val === "NEFT" ||
    val === "RTGS" ||
    val === "IMPS"
  ) {
    return PaymentMethod.BANK_TRANSFER;
  }
  if (val === "5" || val === "UPI" || val === "GPAY" || val === "PHONEPE" || val === "PAYTM") return PaymentMethod.UPI;
  return PaymentMethod.UPI;
}

function padReceiptNo(num: number): string {
  return `REC-${String(num).padStart(5, "0")}`;
}

export interface MigrationPreviewResult {
  success: boolean;
  message?: string;
  totalRows: number;
  validCustomersCount: number;
  skippedRowsCount: number;
  paymentBreakdown?: Record<string, number>;
  sampleValid: Array<{
    custCode: string;
    fullName: string;
    phone: string;
    email: string | null;
    gender: string;
    totalRecords: number;
    samplePlans: string[];
    latestEnd: string | null;
  }>;
  rejectedRows: Array<{
    rowNumber: number;
    custCode: string;
    name: string;
    phone: string;
    reason: string;
  }>;
}

/**
 * Parses and validates raw Excel JSON rows
 */
export async function validateMigrationData(rawRows: any[]): Promise<MigrationPreviewResult> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERUSER") {
    return {
      success: false,
      message: "Unauthorized: Superuser access required for data migration.",
      totalRows: 0,
      validCustomersCount: 0,
      skippedRowsCount: 0,
      sampleValid: [],
      rejectedRows: [],
    };
  }

  const rejectedRows: Array<{
    rowNumber: number;
    custCode: string;
    name: string;
    phone: string;
    reason: string;
  }> = [];

  const customerMap = new Map<string, any[]>();
  const paymentBreakdown: Record<string, number> = {
    CASH: 0,
    CHEQUE: 0,
    CARD: 0,
    BANK_TRANSFER: 0,
    UPI: 0,
  };
  const now = new Date();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Excel row index
    const custCode = String(row.CustomerCode || row.CustomerId || "").trim();
    const name = `${String(row.FirstName || "").trim()} ${String(row.LastName || "").trim()}`.trim();
    const rawPhone = String(row.PhoneNo || "").trim();

    if (row.IsDeleted === 1 || row.IsDeleted_1 === 1 || row.IsDeleted_2 === 1) {
      rejectedRows.push({
        rowNumber: rowNum,
        custCode,
        name: name || "Unknown",
        phone: rawPhone,
        reason: "Row marked as Deleted in old ERP (IsDeleted = 1)",
      });
      return;
    }

    if (!row.FirstName || row.FirstName === "NULL") {
      rejectedRows.push({
        rowNumber: rowNum,
        custCode,
        name: "Missing First Name",
        phone: rawPhone,
        reason: "Missing client first name",
      });
      return;
    }

    if (!custCode || custCode === "NULL") {
      rejectedRows.push({
        rowNumber: rowNum,
        custCode: "EMPTY",
        name,
        phone: rawPhone,
        reason: "Missing CustomerCode / CustomerId identifier",
      });
      return;
    }

    if (!customerMap.has(custCode)) {
      customerMap.set(custCode, []);
    }
    customerMap.get(custCode)!.push(row);

    const pMethod = mapPaymentType(row.Type ?? row.paymentMethod);
    paymentBreakdown[pMethod] = (paymentBreakdown[pMethod] || 0) + 1;
  });

  const sampleValid: any[] = [];
  let sampleCount = 0;

  for (const [custCode, custRows] of customerMap.entries()) {
    if (sampleCount >= 20) break;
    const first = custRows[0];
    const lastName = first.LastName && first.LastName !== "NULL" ? String(first.LastName).trim() : "";
    const fullName = lastName ? `${first.FirstName} ${lastName}` : first.FirstName;
    let phone = "-";
    const phoneRow = custRows.find((r) => {
      const p = cleanPhoneNumber(r.PhoneNo);
      return p && isValidPhoneNumber(p);
    });
    if (phoneRow) {
      phone = cleanPhoneNumber(phoneRow.PhoneNo);
    } else {
      const firstClean = cleanPhoneNumber(first.PhoneNo);
      phone = firstClean || (first.PhoneNo && first.PhoneNo !== "NULL" ? String(first.PhoneNo).trim() : "-");
    }
    const email = first.Email && first.Email !== "NULL" ? String(first.Email).trim() : null;
    const gender = first.Gender && first.Gender !== "NULL" ? String(first.Gender).trim() : "Male";

    let latestEnd: Date | null = null;
    const samplePlans: string[] = [];

    custRows.forEach((r) => {
      const e = excelSerialToDate(r.EndDate);
      if (e && (!latestEnd || e > latestEnd)) latestEnd = e;
      samplePlans.push(formatPlanName(r.Month, r.Amount, r.MembershipId));
    });

    sampleValid.push({
      custCode,
      fullName,
      phone: phone || "-",
      email,
      gender,
      totalRecords: custRows.length,
      samplePlans: samplePlans.slice(0, 3),
      latestEnd: latestEnd ? (latestEnd as Date).toISOString().split("T")[0] : null,
    });
    sampleCount++;
  }

  return {
    success: true,
    totalRows: rawRows.length,
    validCustomersCount: customerMap.size,
    skippedRowsCount: rejectedRows.length,
    paymentBreakdown,
    sampleValid,
    rejectedRows: rejectedRows.slice(0, 100), // Return top 100 rejected items for inspection
  };
}

/**
 * Executes the full database migration from raw rows
 */
export async function executeFullMigration(rawRows: any[], options?: { wipeExisting?: boolean }) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPERUSER") {
    return {
      success: false,
      message: "Unauthorized: Superuser access required.",
    };
  }

  const customerMap = new Map<string, any[]>();
  const now = new Date();

  // Filter valid rows
  for (const row of rawRows) {
    if (row.IsDeleted === 1 || row.IsDeleted_1 === 1 || row.IsDeleted_2 === 1) continue;
    const rawPhone = String(row.PhoneNo || "").trim();
    const isPhoneEmpty =
      !rawPhone ||
      rawPhone === "NULL" ||
      rawPhone.toLowerCase() === "null" ||
      rawPhone.toLowerCase() === "n/a" ||
      rawPhone.toLowerCase() === "none" ||
      rawPhone.toLowerCase() === "nil" ||
      rawPhone === "-" ||
      rawPhone.trim() === "";

    if (!isPhoneEmpty) {
      const phone = cleanPhoneNumber(row.PhoneNo);
      if (!phone || !isValidPhoneNumber(phone)) continue;
    }

    const custCode = String(row.CustomerCode || row.CustomerId || "").trim();
    if (!custCode || custCode === "NULL") continue;

    if (!customerMap.has(custCode)) {
      customerMap.set(custCode, []);
    }
    customerMap.get(custCode)!.push(row);
  }

  if (customerMap.size === 0) {
    return {
      success: false,
      message: "No valid member records found to migrate.",
    };
  }

  if (options?.wipeExisting) {
    await prisma.payment.deleteMany();
    await prisma.memberPT.deleteMany();
    await prisma.memberSubscription.deleteMany();
    await prisma.member.deleteMany();
    await prisma.enquiry.deleteMany();
  }

  let receiptCounter = 1;
  let membersMigrated = 0;
  let subsMigrated = 0;
  let ptMigrated = 0;

  let memberSeq = 1001;

  for (const [custCode, custRows] of customerMap.entries()) {
    const firstRow = custRows[0];
    const firstName = String(firstRow.FirstName || "").trim();
    const lastName = firstRow.LastName && firstRow.LastName !== "NULL" ? String(firstRow.LastName).trim() : "";
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    
    let phone = "-";
    const phoneRow = custRows.find((r) => {
      const p = cleanPhoneNumber(r.PhoneNo);
      return p && isValidPhoneNumber(p);
    });
    if (phoneRow) {
      phone = cleanPhoneNumber(phoneRow.PhoneNo);
    } else {
      const firstClean = cleanPhoneNumber(firstRow.PhoneNo);
      phone = firstClean || "-";
    }
    const email = firstRow.Email && firstRow.Email !== "NULL" ? String(firstRow.Email).trim() : null;
    const gender = firstRow.Gender && firstRow.Gender !== "NULL" ? String(firstRow.Gender).trim() : "Male";
    const address = firstRow.Address && firstRow.Address !== "NULL" ? String(firstRow.Address).trim() : null;
    const dob = excelSerialToDate(firstRow.DOB);
    const enrollDate = excelSerialToDate(firstRow.EnrollDate) || new Date();
    const representative =
      firstRow.Representative &&
      firstRow.Representative !== "NULL" &&
      firstRow.Representative !== "Coach Vikram" &&
      String(firstRow.Representative).trim() !== ""
        ? String(firstRow.Representative).trim()
        : "-";
    const referredBy = firstRow.ReferenceBy && firstRow.ReferenceBy !== "NULL" ? String(firstRow.ReferenceBy).trim() : null;

    let latestEnd: Date | null = null;
    for (const r of custRows) {
      const e = excelSerialToDate(r.EndDate);
      if (e && (!latestEnd || e > latestEnd)) {
        latestEnd = e;
      }
    }

    const isMemberActive = Boolean(latestEnd && latestEnd.getTime() >= now.getTime());
    const formattedMemberId = String(memberSeq++);

    const member = await prisma.member.create({
      data: {
        memberId: formattedMemberId,
        firstName,
        lastName: lastName || null,
        fullName,
        email,
        phone,
        gender,
        dob,
        address,
        enrollDate,
        representative,
        referredBy,
        membershipStatus: isMemberActive ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED,
        notes: `Migrated from Old ERP (CustomerCode: ${custCode}, CustomerId: ${firstRow.CustomerId})`,
      },
    });

    // Track subscriptions and PT packages by legacy membership ID to attach split payments correctly
    const createdSubs = new Map<string, string>(); // membershipKey -> subscriptionId
    const createdPTs = new Map<string, string>();  // membershipKey -> ptId

    for (let rIdx = 0; rIdx < custRows.length; rIdx++) {
      const r = custRows[rIdx];
      const sDate =
        excelSerialToDate(r.StartDate) ||
        excelSerialToDate(r.PaymentDate) ||
        excelSerialToDate(r.PaidDate) ||
        excelSerialToDate(r.SaleDate) ||
        excelSerialToDate(r.CreatedDate) ||
        enrollDate;

      const monthsCount = Number(r.Month) || 1;
      const eDate =
        excelSerialToDate(r.EndDate) ||
        new Date(sDate.getTime() + monthsCount * 30 * 86400 * 1000);

      const packageAmount = Number(r.Amount) || 0;
      const paidAmountVal =
        r.PaidAmount !== undefined && r.PaidAmount !== null && r.PaidAmount !== "" && r.PaidAmount !== "NULL"
          ? Number(r.PaidAmount)
          : packageAmount;
      const paymentAmount = !isNaN(paidAmountVal) ? paidAmountVal : packageAmount;

      const planName = formatPlanName(r.Month, r.Amount, r.MembershipId);
      const isSubActive = eDate.getTime() >= now.getTime();

      const payDate =
        excelSerialToDate(r.PaymentDate) ||
        excelSerialToDate(r.PaidDate) ||
        excelSerialToDate(r.SaleDate) ||
        excelSerialToDate(r.CreatedDate) ||
        sDate;

      const paymentMethod = mapPaymentType(r.Type ?? r.paymentMethod);

      const isPT =
        String(r.MembershipId) === "605" ||
        String(r.MembershipId) === "606" ||
        Number(r.Sessions) > 0;

      const recInfo =
        r.ReceiptNo && r.ReceiptNo !== "NULL"
          ? `Legacy Rec #${r.ReceiptNo}`
          : r.Id && r.Id !== "NULL"
          ? `Rec #${r.Id}`
          : "";
      const refInfo =
        r.ReferenceNumber && r.ReferenceNumber !== "NULL" && String(r.ReferenceNumber).trim() !== ""
          ? `Ref: ${String(r.ReferenceNumber).trim()}`
          : null;
      const noteInfo =
        r.Notes && r.Notes !== "NULL" && String(r.Notes).trim() !== ""
          ? `Note: ${String(r.Notes).trim()}`
          : null;
      const paymentNotes = [
        isPT ? `Old ERP PT Migration${recInfo ? ` (${recInfo})` : ""}` : `Old ERP Migration${recInfo ? ` (${recInfo})` : ""}`,
        refInfo,
        noteInfo,
      ]
        .filter(Boolean)
        .join(" | ");

      const membershipKey =
        r.CustomerMembershipId && r.CustomerMembershipId !== "NULL"
          ? String(r.CustomerMembershipId)
          : r.Id && r.Id !== "NULL"
          ? String(r.Id)
          : `row_${rIdx}`;

      if (isPT) {
        let ptId = createdPTs.get(membershipKey);

        if (!ptId) {
          const ptTrainer =
            r.TrainerName && r.TrainerName !== "NULL" && String(r.TrainerName).trim() !== ""
              ? String(r.TrainerName).trim()
              : representative !== "-"
              ? representative
              : "Trainer";

          const matchingRecords = custRows.filter(
            (x: any) =>
              (x.CustomerMembershipId && String(x.CustomerMembershipId) === membershipKey) ||
              (x.Id && String(x.Id) === membershipKey)
          );
          const totalPaidForPT =
            matchingRecords.length > 0
              ? matchingRecords.reduce((sum: number, x: any) => {
                  const pVal =
                    x.PaidAmount !== undefined && x.PaidAmount !== null && x.PaidAmount !== "" && x.PaidAmount !== "NULL"
                      ? Number(x.PaidAmount)
                      : Number(x.Amount) || 0;
                  return sum + (isNaN(pVal) ? 0 : pVal);
                }, 0)
              : paymentAmount;

          // In legacy ERP migration, historical records are settled (zero dues as approved by client)
          const finalPackageAmount = totalPaidForPT;

          const ptSub = await prisma.memberPT.create({
            data: {
              memberId: member.id,
              planName: `Personal Training (${r.Month || 1}M)`,
              trainerName: ptTrainer,
              totalSessions: Number(r.Sessions) || 12,
              completedSessions: isSubActive ? 4 : Number(r.Sessions) || 12,
              startDate: sDate,
              endDate: eDate,
              totalAmount: finalPackageAmount,
              paidAmount: totalPaidForPT,
              dueAmount: 0,
              status: isSubActive ? "ACTIVE" : "EXPIRED",
              notes: r.Note && r.Note !== "NULL" ? String(r.Note) : null,
              createdAt: sDate,
            },
          });

          ptId = ptSub.id;
          createdPTs.set(membershipKey, ptId);
          ptMigrated++;
        }

        await prisma.payment.create({
          data: {
            receiptNo: padReceiptNo(receiptCounter++),
            memberId: member.id,
            ptId,
            amount: paymentAmount,
            paymentDate: payDate,
            paymentMethod,
            paymentType: "PERSONAL_TRAINING",
            notes: paymentNotes,
            createdAt: payDate,
          },
        });
      } else {
        let subscriptionId = createdSubs.get(membershipKey);

        if (!subscriptionId) {
          const matchingRecords = custRows.filter(
            (x: any) =>
              (x.CustomerMembershipId && String(x.CustomerMembershipId) === membershipKey) ||
              (x.Id && String(x.Id) === membershipKey)
          );
          const totalPaidForSub =
            matchingRecords.length > 0
              ? matchingRecords.reduce((sum: number, x: any) => {
                  const pVal =
                    x.PaidAmount !== undefined && x.PaidAmount !== null && x.PaidAmount !== "" && x.PaidAmount !== "NULL"
                      ? Number(x.PaidAmount)
                      : Number(x.Amount) || 0;
                  return sum + (isNaN(pVal) ? 0 : pVal);
                }, 0)
              : paymentAmount;

          // In legacy ERP migration, historical records are settled (zero dues as approved by client)
          const finalPackageAmount = totalPaidForSub;

          const sub = await prisma.memberSubscription.create({
            data: {
              memberId: member.id,
              planName,
              startDate: sDate,
              endDate: eDate,
              totalAmount: finalPackageAmount,
              paidAmount: totalPaidForSub,
              dueAmount: 0,
              status: isSubActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
              createdAt: sDate,
            },
          });

          subscriptionId = sub.id;
          createdSubs.set(membershipKey, subscriptionId);
          subsMigrated++;
        }

        await prisma.payment.create({
          data: {
            receiptNo: padReceiptNo(receiptCounter++),
            memberId: member.id,
            subscriptionId,
            amount: paymentAmount,
            paymentDate: payDate,
            paymentMethod,
            paymentType: "MEMBERSHIP_FEE",
            notes: paymentNotes,
            createdAt: payDate,
          },
        });
      }
    }

    membersMigrated++;
  }

  return {
    success: true,
    membersMigrated,
    subsMigrated,
    ptMigrated,
    paymentsMigrated: receiptCounter - 1,
    message: `Migration completed: ${membersMigrated} members, ${subsMigrated + ptMigrated} packages, and ${receiptCounter - 1} receipts created.`,
  };
}

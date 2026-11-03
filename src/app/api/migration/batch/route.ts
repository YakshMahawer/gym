import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MembershipStatus, SubscriptionStatus, PaymentMethod } from "@prisma/client";

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

function mapPaymentType(typeVal: any): PaymentMethod {
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

function padCleanReceiptNo(num: number): string {
  return String(num).padStart(5, "0");
}

function padLegacyReceiptNo(num: number): string {
  return `OLD-${String(num).padStart(5, "0")}`;
}

const FY26_CUTOFF = new Date("2026-04-01T00:00:00.000Z");

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Unauthorized: Superuser required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      membersBatch,
      receiptStartIndex = 1,
      cleanReceiptStartIndex = 1,
      legacyReceiptStartIndex = 1,
    } = body;

    if (!Array.isArray(membersBatch) || membersBatch.length === 0) {
      return NextResponse.json({ error: "No members in batch" }, { status: 400 });
    }

    const now = new Date();
    let currentCleanIndex = cleanReceiptStartIndex || receiptStartIndex || 1;
    let currentLegacyIndex = legacyReceiptStartIndex || 1;
    let importedMembers = 0;
    let importedSubs = 0;
    let importedPT = 0;

    for (const memberItem of membersBatch) {
      const {
        memberId,
        firstName,
        lastName,
        fullName,
        email,
        phone,
        gender,
        dob,
        address,
        enrollDate,
        representative,
        referredBy,
        customerId,
        records = [],
      } = memberItem;

      // Clean representative - default to "-" if missing, empty, or placeholder
      const cleanRep =
        representative &&
        representative !== "NULL" &&
        representative !== "Coach Vikram" &&
        String(representative).trim() !== ""
          ? String(representative).trim()
          : "-";

      // Find earliest known date across all records for this member to avoid defaulting to today
      let earliestDate: Date | null = enrollDate ? excelSerialToDate(enrollDate) : null;
      let latestEnd: Date | null = null;

      for (const r of records) {
        const d =
          excelSerialToDate(r.EnrollDate) ||
          excelSerialToDate(r.CreatedDate) ||
          excelSerialToDate(r.StartDate) ||
          excelSerialToDate(r.PaymentDate) ||
          excelSerialToDate(r.PaidDate) ||
          excelSerialToDate(r.SaleDate);

        if (d && (!earliestDate || d < earliestDate)) {
          earliestDate = d;
        }

        const e = excelSerialToDate(r.EndDate);
        if (e && (!latestEnd || e > latestEnd)) {
          latestEnd = e;
        }
      }

      const parsedEnrollDate = earliestDate || new Date("2020-01-01");
      const isMemberActive = Boolean(latestEnd && latestEnd.getTime() >= now.getTime());
      const dobDate = dob ? excelSerialToDate(dob) : null;

      // Upsert or create member with historical createdAt
      const member = await prisma.member.upsert({
        where: { memberId: String(memberId) },
        update: {
          firstName,
          lastName: lastName || null,
          fullName,
          email: email || null,
          phone,
          gender: gender || "Male",
          dob: dobDate,
          address: address || null,
          enrollDate: parsedEnrollDate,
          representative: cleanRep,
          referredBy: referredBy || null,
          membershipStatus: isMemberActive ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED,
          notes: `Migrated from Old ERP (CustomerId: ${customerId})`,
        },
        create: {
          memberId: String(memberId),
          firstName,
          lastName: lastName || null,
          fullName,
          email: email || null,
          phone,
          gender: gender || "Male",
          dob: dobDate,
          address: address || null,
          enrollDate: parsedEnrollDate,
          representative: cleanRep,
          referredBy: referredBy || null,
          membershipStatus: isMemberActive ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED,
          notes: `Migrated from Old ERP (CustomerId: ${customerId})`,
          createdAt: parsedEnrollDate,
        },
      });

      // Track subscriptions and PT packages by legacy membership ID to attach split payments correctly
      const createdSubs = new Map<string, string>(); // membershipKey -> subscriptionId
      const createdPTs = new Map<string, string>();  // membershipKey -> ptId

      for (let rIdx = 0; rIdx < records.length; rIdx++) {
        const r = records[rIdx];
        const sDate =
          excelSerialToDate(r.StartDate) ||
          excelSerialToDate(r.PaymentDate) ||
          excelSerialToDate(r.PaidDate) ||
          excelSerialToDate(r.SaleDate) ||
          excelSerialToDate(r.CreatedDate) ||
          parsedEnrollDate;

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

        // Clean receipt number: receipts from April 1st 2026 start from 00001
        // receipts before April 1st 2026 get legacy OLD-00001 format
        const receiptNo =
          payDate >= FY26_CUTOFF
            ? padCleanReceiptNo(currentCleanIndex++)
            : padLegacyReceiptNo(currentLegacyIndex++);

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

        // Distinct key for membership if provided, otherwise fallback to row index
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
                : cleanRep !== "-"
                ? cleanRep
                : "-";

            // Total paid for this PT package across records
            const matchingRecords = records.filter(
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
            importedPT++;
          }

          await prisma.payment.create({
            data: {
              receiptNo,
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
            // Total paid for this subscription package across records
            const matchingRecords = records.filter(
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
            importedSubs++;
          }

          await prisma.payment.create({
            data: {
              receiptNo,
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

      importedMembers++;
    }

    return NextResponse.json({
      success: true,
      importedMembers,
      importedSubs,
      importedPT,
      nextCleanReceiptIndex: currentCleanIndex,
      nextLegacyReceiptIndex: currentLegacyIndex,
      nextReceiptIndex: currentCleanIndex,
    });
  } catch (error: any) {
    console.error("Batch migration error:", error);
    return NextResponse.json({ error: error.message || "Batch migration failed" }, { status: 500 });
  }
}

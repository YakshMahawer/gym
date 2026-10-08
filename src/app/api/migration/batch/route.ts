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

function padReceiptNo(num: number): string {
  return `REC-${String(num).padStart(5, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Unauthorized: Superuser required" }, { status: 403 });
    }

    const body = await request.json();
    const { membersBatch, receiptStartIndex = 1 } = body;

    if (!Array.isArray(membersBatch) || membersBatch.length === 0) {
      return NextResponse.json({ error: "No members in batch" }, { status: 400 });
    }

    const now = new Date();
    let currentReceiptIndex = receiptStartIndex;
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

      // Check latest end date across renewal records
      let latestEnd: Date | null = null;
      for (const r of records) {
        const e = excelSerialToDate(r.EndDate);
        if (e && (!latestEnd || e > latestEnd)) {
          latestEnd = e;
        }
      }

      const isMemberActive = Boolean(latestEnd && latestEnd.getTime() >= now.getTime());
      const dobDate = dob ? excelSerialToDate(dob) : null;
      const parsedEnrollDate = enrollDate ? excelSerialToDate(enrollDate) || new Date() : new Date();

      // Upsert or create member
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
          representative: representative || "Coach Vikram",
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
          representative: representative || "Coach Vikram",
          referredBy: referredBy || null,
          membershipStatus: isMemberActive ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED,
          notes: `Migrated from Old ERP (CustomerId: ${customerId})`,
        },
      });

      for (const r of records) {
        const sDate = excelSerialToDate(r.StartDate) || parsedEnrollDate;
        const eDate = excelSerialToDate(r.EndDate) || new Date(sDate.getTime() + 30 * 86400 * 1000);
        const amount = Number(r.Amount) || 0;
        const planName = formatPlanName(r.Month, r.Amount, r.MembershipId);
        const isSubActive = eDate.getTime() >= now.getTime();

        const isPT = String(r.MembershipId) === "605" || String(r.MembershipId) === "606" || Number(r.Sessions) > 0;

        if (isPT) {
          const ptSub = await prisma.memberPT.create({
            data: {
              memberId: member.id,
              planName: `Personal Training (${r.Month || 1}M)`,
              trainerName: representative || "Trainer",
              totalSessions: Number(r.Sessions) || 12,
              completedSessions: isSubActive ? 4 : (Number(r.Sessions) || 12),
              startDate: sDate,
              endDate: eDate,
              totalAmount: amount,
              paidAmount: amount,
              dueAmount: 0,
              status: isSubActive ? "ACTIVE" : "EXPIRED",
              notes: r.Note && r.Note !== "NULL" ? String(r.Note) : null,
            },
          });

          await prisma.payment.create({
            data: {
              receiptNo: padReceiptNo(currentReceiptIndex++),
              memberId: member.id,
              ptId: ptSub.id,
              amount: amount,
              paymentDate: excelSerialToDate(r.PaidDate) || excelSerialToDate(r.SaleDate) || sDate,
              paymentMethod: PaymentMethod.UPI,
              paymentType: "PERSONAL_TRAINING",
              notes: `Old ERP PT Migration (Rec #${r.Id})`,
            },
          });
          importedPT++;
        } else {
          const sub = await prisma.memberSubscription.create({
            data: {
              memberId: member.id,
              planName,
              startDate: sDate,
              endDate: eDate,
              totalAmount: amount,
              paidAmount: amount,
              dueAmount: 0,
              status: isSubActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
            },
          });

          await prisma.payment.create({
            data: {
              receiptNo: padReceiptNo(currentReceiptIndex++),
              memberId: member.id,
              subscriptionId: sub.id,
              amount: amount,
              paymentDate: excelSerialToDate(r.PaidDate) || excelSerialToDate(r.SaleDate) || sDate,
              paymentMethod: PaymentMethod.UPI,
              paymentType: "MEMBERSHIP_FEE",
              notes: `Old ERP Migration (Rec #${r.Id})`,
            },
          });
          importedSubs++;
        }
      }

      importedMembers++;
    }

    return NextResponse.json({
      success: true,
      importedMembers,
      importedSubs,
      importedPT,
      nextReceiptIndex: currentReceiptIndex,
    });
  } catch (error: any) {
    console.error("Batch migration error:", error);
    return NextResponse.json({ error: error.message || "Batch migration failed" }, { status: 500 });
  }
}

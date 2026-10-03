"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

export interface AddPaymentInput {
  memberId: string;
  subscriptionId?: string;
  ptId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  paymentType?: string;
  receiptNo?: string;
  notes?: string;
}

export async function getNextSequentialReceiptNo(paymentDate?: Date | string): Promise<string> {
  try {
    const d = paymentDate
      ? typeof paymentDate === "string"
        ? new Date(paymentDate.includes("T") ? paymentDate : `${paymentDate}T00:00:00.000Z`)
        : paymentDate
      : new Date();

    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const dateStr = validDate.toISOString().slice(2, 10).replace(/-/g, ""); // e.g. "261003"
    const prefix = `REC-${dateStr}-`;

    const existingPayments = await prisma.payment.findMany({
      where: {
        receiptNo: {
          startsWith: prefix,
        },
      },
      select: {
        receiptNo: true,
      },
    });

    let maxNum = 0;
    for (const p of existingPayments) {
      const suffix = p.receiptNo.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const formattedSuffix = nextNum.toString().padStart(3, "0");
    return `${prefix}${formattedSuffix}`;
  } catch (error) {
    console.error("Failed to generate sequential receipt number:", error);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    return `REC-${dateStr}-001`;
  }
}

export async function getPayments(filters?: {
  search?: string;
  method?: string;
  type?: string;
  limit?: number;
}) {
  try {
    const whereClause: any = {};

    if (filters?.search) {
      whereClause.OR = [
        { receiptNo: { contains: filters.search, mode: "insensitive" } },
        { member: { fullName: { contains: filters.search, mode: "insensitive" } } },
        { member: { phone: { contains: filters.search, mode: "insensitive" } } },
        { member: { memberId: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters?.method && filters.method !== "ALL") {
      whereClause.paymentMethod = filters.method as PaymentMethod;
    }

    if (filters?.type && filters.type !== "ALL") {
      whereClause.paymentType = filters.type;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
            subscriptions: {
              select: {
                id: true,
                planName: true,
                startDate: true,
                endDate: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
            ptSubscriptions: {
              select: {
                id: true,
                planName: true,
                trainerName: true,
                totalSessions: true,
                completedSessions: true,
                startDate: true,
                endDate: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            dueAmount: true,
            totalAmount: true,
            startDate: true,
            endDate: true,
          },
        },
        ptSubscription: {
          select: {
            id: true,
            planName: true,
            trainerName: true,
            totalSessions: true,
            completedSessions: true,
            dueAmount: true,
            totalAmount: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [
        { paymentDate: "desc" },
        { createdAt: "desc" },
      ],
      take: filters?.limit || 200,
    });

    return payments;
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return [];
  }
}

export async function addPayment(input: AddPaymentInput) {
  try {
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than 0" };
    }

    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
    const receiptNo = input.receiptNo?.trim() || (await getNextSequentialReceiptNo(paymentDate));

    let targetSubId = input.subscriptionId;
    let targetPtId = input.ptId;

    if (!targetSubId && !targetPtId) {
      // Find latest active subscription with due amount
      const subWithDue = await prisma.memberSubscription.findFirst({
        where: {
          memberId: input.memberId,
          dueAmount: { gt: 0 },
        },
        orderBy: { createdAt: "desc" },
      });
      if (subWithDue) {
        targetSubId = subWithDue.id;
      } else {
        // Check if PT has due
        const ptWithDue = await prisma.memberPT.findFirst({
          where: {
            memberId: input.memberId,
            dueAmount: { gt: 0 },
          },
          orderBy: { createdAt: "desc" },
        });
        if (ptWithDue) {
          targetPtId = ptWithDue.id;
        }
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        receiptNo,
        memberId: input.memberId,
        subscriptionId: targetSubId || null,
        ptId: targetPtId || null,
        amount,
        paymentDate,
        paymentMethod: input.paymentMethod,
        paymentType: input.paymentType || (targetPtId ? "PERSONAL_TRAINING" : "DUE_CLEARANCE"),
        notes: input.notes || null,
      },
    });

    // Update subscription due amount and paid amount if linked
    if (targetSubId) {
      const subscription = await prisma.memberSubscription.findUnique({
        where: { id: targetSubId },
      });

      if (subscription) {
        const newPaid = subscription.paidAmount + amount;
        const newDue = Math.max(0, subscription.dueAmount - amount);

        await prisma.memberSubscription.update({
          where: { id: targetSubId },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
          },
        });
      }
    }

    // Update PT due amount and paid amount if linked
    if (targetPtId) {
      const pt = await prisma.memberPT.findUnique({
        where: { id: targetPtId },
      });

      if (pt) {
        const newPaid = pt.paidAmount + amount;
        const newDue = Math.max(0, pt.dueAmount - amount);

        await prisma.memberPT.update({
          where: { id: targetPtId },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
          },
        });
      }
    }

    try {
      revalidatePath("/payments");
      revalidatePath(`/members/${input.memberId}`);
      revalidatePath("/members");
      revalidatePath("/reports");
      revalidatePath("/");
    } catch {
      // Ignore
    }

    return { success: true, payment };
  } catch (error: any) {
    console.error("Add payment error:", error);
    return { success: false, error: error.message || "Failed to add payment" };
  }
}

export async function updateReceiptNumber(input: {
  paymentId: string;
  newReceiptNo: string;
  resequenceSubsequent?: boolean;
}) {
  try {
    const targetPayment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: { member: true },
    });

    if (!targetPayment) {
      return { success: false, error: "Payment record not found" };
    }

    const desiredReceiptNo = input.newReceiptNo.trim();
    if (!desiredReceiptNo) {
      return { success: false, error: "Receipt number cannot be empty" };
    }

    if (targetPayment.receiptNo === desiredReceiptNo) {
      return { success: true, count: 0, payment: targetPayment };
    }

    const resequence = input.resequenceSubsequent ?? true;

    if (!resequence) {
      const existing = await prisma.payment.findUnique({
        where: { receiptNo: desiredReceiptNo },
      });
      if (existing && existing.id !== targetPayment.id) {
        return {
          success: false,
          error: `Receipt number "${desiredReceiptNo}" is already in use by another payment.`,
        };
      }

      const updated = await prisma.payment.update({
        where: { id: targetPayment.id },
        data: { receiptNo: desiredReceiptNo },
      });

      try {
        revalidatePath("/payments");
        revalidatePath(`/members/${targetPayment.memberId}`);
        revalidatePath("/members");
        revalidatePath("/reports");
        revalidatePath("/");
      } catch {}

      return { success: true, count: 1, payment: updated };
    }

    // Resequence subsequent payments chronologically
    // Match prefix and trailing number: e.g. "REC-261003-005" -> prefix "REC-261003-", number 5, padLength 3
    const match = desiredReceiptNo.match(/^(.*?)(\d+)$/);
    if (!match) {
      const existing = await prisma.payment.findUnique({
        where: { receiptNo: desiredReceiptNo },
      });
      if (existing && existing.id !== targetPayment.id) {
        return {
          success: false,
          error: `Receipt number "${desiredReceiptNo}" is already in use.`,
        };
      }
      const updated = await prisma.payment.update({
        where: { id: targetPayment.id },
        data: { receiptNo: desiredReceiptNo },
      });
      try {
        revalidatePath("/payments");
        revalidatePath(`/members/${targetPayment.memberId}`);
        revalidatePath("/members");
        revalidatePath("/reports");
        revalidatePath("/");
      } catch {}
      return { success: true, count: 1, payment: updated };
    }

    const prefix = match[1];
    const startingNumStr = match[2];
    const padLength = Math.max(3, startingNumStr.length);
    let currentNum = parseInt(startingNumStr, 10);

    // Get all payments that occurred on or after the target payment
    const allSubsequent = await prisma.payment.findMany({
      where: {
        OR: [
          { paymentDate: { gt: targetPayment.paymentDate } },
          {
            paymentDate: targetPayment.paymentDate,
            createdAt: { gte: targetPayment.createdAt },
          },
        ],
      },
      orderBy: [
        { paymentDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    const toUpdate: { id: string; oldReceiptNo: string; newReceiptNo: string }[] = [];

    // Target payment first
    toUpdate.push({
      id: targetPayment.id,
      oldReceiptNo: targetPayment.receiptNo,
      newReceiptNo: `${prefix}${currentNum.toString().padStart(padLength, "0")}`,
    });

    // Subsequent payments
    for (const p of allSubsequent) {
      if (p.id === targetPayment.id) continue;
      currentNum++;
      toUpdate.push({
        id: p.id,
        oldReceiptNo: p.receiptNo,
        newReceiptNo: `${prefix}${currentNum.toString().padStart(padLength, "0")}`,
      });
    }

    // Perform atomic batch transaction with temporary IDs to prevent unique constraint collisions
    const timestamp = Date.now();
    const phase1Updates = toUpdate.map((item, i) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: `__TEMP_RENUM_${timestamp}_${i}__` },
      })
    );

    const phase2Updates = toUpdate.map((item) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: item.newReceiptNo },
      })
    );

    await prisma.$transaction([...phase1Updates, ...phase2Updates]);

    try {
      revalidatePath("/payments");
      revalidatePath(`/members/${targetPayment.memberId}`);
      revalidatePath("/members");
      revalidatePath("/reports");
      revalidatePath("/");
    } catch {}

    return {
      success: true,
      count: toUpdate.length,
      updatedList: toUpdate,
    };
  } catch (error: any) {
    console.error("Update receipt number error:", error);
    return { success: false, error: error.message || "Failed to update receipt numbers" };
  }
}

export async function resequenceAllReceipts() {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: [
        { paymentDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    const dateCounters: Record<string, number> = {};
    const toUpdate: { id: string; oldReceiptNo: string; newReceiptNo: string }[] = [];

    for (const p of payments) {
      const d = p.paymentDate;
      const dateStr = d.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
      dateCounters[dateStr] = (dateCounters[dateStr] || 0) + 1;
      const seq = dateCounters[dateStr].toString().padStart(3, "0");
      toUpdate.push({
        id: p.id,
        oldReceiptNo: p.receiptNo,
        newReceiptNo: `REC-${dateStr}-${seq}`,
      });
    }

    const timestamp = Date.now();
    const phase1All = toUpdate.map((item, i) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: `__TEMP_ALL_${timestamp}_${i}__` },
      })
    );

    const phase2All = toUpdate.map((item) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: item.newReceiptNo },
      })
    );

    await prisma.$transaction([...phase1All, ...phase2All]);

    try {
      revalidatePath("/payments");
      revalidatePath("/members");
      revalidatePath("/reports");
      revalidatePath("/");
    } catch {}

    return { success: true, count: toUpdate.length, updatedList: toUpdate };
  } catch (error: any) {
    console.error("Resequence all receipts error:", error);
    return { success: false, error: error.message || "Failed to resequence receipts" };
  }
}

export async function getDueSubscriptions() {
  try {
    const [dueSubs, duePTs] = await Promise.all([
      prisma.memberSubscription.findMany({
        where: {
          dueAmount: { gt: 0 },
        },
        include: {
          member: {
            select: {
              id: true,
              memberId: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { dueAmount: "desc" },
      }),
      prisma.memberPT.findMany({
        where: {
          dueAmount: { gt: 0 },
        },
        include: {
          member: {
            select: {
              id: true,
              memberId: true,
              fullName: true,
              phone: true,
            },
          },
        },
        orderBy: { dueAmount: "desc" },
      }),
    ]);

    const formattedSubs = dueSubs.map((s) => ({
      id: s.id,
      type: "MEMBERSHIP" as const,
      memberId: s.memberId,
      planName: s.planName,
      totalAmount: s.totalAmount,
      paidAmount: s.paidAmount,
      dueAmount: s.dueAmount,
      startDate: s.startDate,
      endDate: s.endDate,
      member: s.member,
    }));

    const formattedPTs = duePTs.map((pt) => ({
      id: pt.id,
      type: "PT" as const,
      memberId: pt.memberId,
      planName: `PT: ${pt.planName} (${pt.trainerName || "Trainer"})`,
      totalAmount: pt.totalAmount,
      paidAmount: pt.paidAmount,
      dueAmount: pt.dueAmount,
      startDate: pt.startDate,
      endDate: pt.endDate,
      member: pt.member,
    }));

    return [...formattedSubs, ...formattedPTs].sort((a, b) => b.dueAmount - a.dueAmount);
  } catch (error) {
    console.error("Failed to fetch due subscriptions:", error);
    return [];
  }
}

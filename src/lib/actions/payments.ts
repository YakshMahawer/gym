"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateReceiptNo } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

export interface AddPaymentInput {
  memberId: string;
  subscriptionId?: string;
  ptId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  paymentType?: string;
  notes?: string;
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
      orderBy: { paymentDate: "desc" },
      take: filters?.limit || 100,
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

    const receiptNo = generateReceiptNo();
    const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

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

    revalidatePath("/payments");
    revalidatePath(`/members/${input.memberId}`);
    revalidatePath("/members");
    revalidatePath("/");
    return { success: true, payment };
  } catch (error: any) {
    console.error("Add payment error:", error);
    return { success: false, error: error.message || "Failed to add payment" };
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

    // Format all dues cleanly
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

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateReceiptNo } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

export interface AddPaymentInput {
  memberId: string;
  subscriptionId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  paymentType?: string;
  notes?: string;
}

export async function getPayments(filters?: {
  search?: string;
  method?: string;
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
      },
      orderBy: { paymentDate: "desc" },
      take: filters?.limit || 50,
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

    // If subscriptionId is provided or found, update due amount
    let targetSubId = input.subscriptionId;

    if (!targetSubId) {
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
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        receiptNo,
        memberId: input.memberId,
        subscriptionId: targetSubId || null,
        amount,
        paymentDate,
        paymentMethod: input.paymentMethod,
        paymentType: input.paymentType || "DUE_CLEARANCE",
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
    const dueSubs = await prisma.memberSubscription.findMany({
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
    });
    return dueSubs;
  } catch (error) {
    console.error("Failed to fetch due subscriptions:", error);
    return [];
  }
}

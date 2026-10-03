"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateReceiptNo } from "@/lib/utils";
import { PaymentMethod, PTStatus } from "@prisma/client";

export const STANDARD_PT_PLANS = [
  {
    name: "1 Month PT (12 Sessions)",
    price: 6000,
    durationInDays: 30,
    sessions: 12,
    description: "12 One-on-one personal training sessions in 1 month",
  },
  {
    name: "1 Month PT (24 Sessions)",
    price: 10000,
    durationInDays: 30,
    sessions: 24,
    description: "24 One-on-one personal training sessions in 1 month (Daily)",
  },
  {
    name: "3 Months PT (36 Sessions)",
    price: 16500,
    durationInDays: 90,
    sessions: 36,
    description: "36 One-on-one sessions across 3 months",
  },
  {
    name: "3 Months PT (72 Sessions)",
    price: 28500,
    durationInDays: 90,
    sessions: 72,
    description: "72 One-on-one sessions across 3 months",
  },
  {
    name: "6 Months PT (72 Sessions)",
    price: 30000,
    durationInDays: 180,
    sessions: 72,
    description: "72 One-on-one sessions across 6 months",
  },
  {
    name: "6 Months PT (144 Sessions)",
    price: 54000,
    durationInDays: 180,
    sessions: 144,
    description: "144 One-on-one sessions across 6 months",
  },
  {
    name: "12 Months PT (144 Sessions)",
    price: 54000,
    durationInDays: 365,
    sessions: 144,
    description: "144 One-on-one sessions across 1 year",
  },
  {
    name: "12 Months PT (288 Sessions)",
    price: 102000,
    durationInDays: 365,
    sessions: 288,
    description: "288 One-on-one sessions across 1 year",
  },
  {
    name: "Single PT Starter / Trial",
    price: 1000,
    durationInDays: 30,
    sessions: 1,
    description: "Starter PT trial session",
  },
  {
    name: "Group Training (3 Persons 12 Sessions)",
    price: 7500,
    durationInDays: 30,
    sessions: 12,
    description: "Small group training (3 athletes) 12 sessions",
  },
];

export interface AddMemberPTInput {
  memberId: string;
  planName: string;
  trainerName?: string;
  totalSessions?: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export async function addOrRenewMemberPT(input: AddMemberPTInput) {
  try {
    const total = Number(input.totalAmount);
    const paid = Number(input.paidAmount || 0);
    const due = Math.max(0, total - paid);
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const sessions = input.totalSessions ? Number(input.totalSessions) : 12;

    const pt = await prisma.memberPT.create({
      data: {
        memberId: input.memberId,
        planName: input.planName,
        trainerName: input.trainerName || "General Trainer",
        totalSessions: sessions,
        completedSessions: 0,
        startDate,
        endDate,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        status: "ACTIVE",
        notes: input.notes || null,
      },
    });

    let payment = null;
    if (paid > 0) {
      payment = await prisma.payment.create({
        data: {
          receiptNo: generateReceiptNo(),
          memberId: input.memberId,
          ptId: pt.id,
          amount: paid,
          paymentDate: new Date(),
          paymentMethod: input.paymentMethod || "UPI",
          paymentType: "PERSONAL_TRAINING",
          notes: input.notes
            ? `PT: ${input.planName} (${input.trainerName || "Trainer"}) - ${input.notes}`
            : `Personal Training Add-on: ${input.planName} with ${input.trainerName || "Trainer"}`,
        },
      });
    }

    revalidatePath(`/members/${input.memberId}`);
    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");

    return { success: true, pt, payment };
  } catch (error: any) {
    console.error("Add or renew PT error:", error);
    return { success: false, error: error.message || "Failed to save Personal Training add-on" };
  }
}

export async function updatePTSessions(ptId: string, completedSessions: number) {
  try {
    const pt = await prisma.memberPT.findUnique({
      where: { id: ptId },
    });

    if (!pt) {
      return { success: false, error: "PT record not found" };
    }

    const total = pt.totalSessions || 12;
    const newCount = Math.max(0, Math.min(total, completedSessions));
    const newStatus: PTStatus = newCount >= total ? "COMPLETED" : "ACTIVE";

    const updated = await prisma.memberPT.update({
      where: { id: ptId },
      data: {
        completedSessions: newCount,
        status: newStatus,
      },
    });

    revalidatePath(`/members/${pt.memberId}`);
    revalidatePath("/members");
    return { success: true, pt: updated };
  } catch (error: any) {
    console.error("Update PT sessions error:", error);
    return { success: false, error: error.message || "Failed to update sessions" };
  }
}

export async function getPTList() {
  try {
    const ptList = await prisma.memberPT.findMany({
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
            membershipStatus: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return ptList;
  } catch (error) {
    console.error("Failed to fetch PT list:", error);
    return [];
  }
}

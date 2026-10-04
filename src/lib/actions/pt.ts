"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PTStatus } from "@prisma/client";
import { getNextSequentialReceiptNo } from "@/lib/actions/payments";

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
  receiptNo?: string;
  notes?: string;
}

export async function addOrRenewMemberPT(input: AddMemberPTInput) {
  try {
    const total = Number(input.totalAmount);
    const paid = Number(input.paidAmount || 0);
    const due = Math.max(0, total - paid);
    
    // Parse dates safely
    const startDate = new Date(input.startDate.includes("T") ? input.startDate : `${input.startDate}T00:00:00.000Z`);
    const endDate = new Date(input.endDate.includes("T") ? input.endDate : `${input.endDate}T23:59:59.999Z`);
    const sessions = input.totalSessions ? Number(input.totalSessions) : 12;

    const pt = await prisma.memberPT.create({
      data: {
        memberId: input.memberId,
        planName: input.planName,
        trainerName: input.trainerName?.trim() || "Coach Vikram",
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
      const receiptNo = input.receiptNo?.trim() || (await getNextSequentialReceiptNo(new Date()));
      payment = await prisma.payment.create({
        data: {
          receiptNo,
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

    try {
      revalidatePath(`/admin/members/${input.memberId}`);
      revalidatePath("/admin/members");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/reports");
      revalidatePath("/admin");
    } catch {
      // Ignore revalidation outside request context
    }

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

    try {
      revalidatePath(`/admin/members/${pt.memberId}`);
      revalidatePath("/admin/members");
      revalidatePath("/admin");
    } catch {
      // Ignore
    }
    
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

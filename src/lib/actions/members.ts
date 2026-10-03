"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateReceiptNo, extractNumericId, normalizeMemberId } from "@/lib/utils";
import { PaymentMethod, MembershipStatus } from "@prisma/client";

export interface CreateMemberInput {
  memberId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  gender?: string;
  dob?: string;
  address?: string;
  enrollDate?: string;
  representative?: string;
  referredBy?: string;
  // Additional Info
  isMarried?: boolean;
  spouseName?: string;
  spouseBirthDate?: string;
  anniversaryDate?: string;
  occupation?: string;
  designation?: string;
  source?: string;
  phoneOffice?: string;
  phoneResidence?: string;
  programme?: string;
  notes?: string;
  // Medical questionnaire
  qFaintOrDizzy?: boolean;
  qChestPain?: boolean;
  qRecentChestPain?: boolean;
  qBloodPressureHeart?: boolean;
  qDiabetes?: boolean;
  qJointBoneProblem?: boolean;
  qPregnant?: boolean;
  qOver65?: boolean;
  qOtherHealthIssues?: string;
  // Initial Membership & Payment
  planId?: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentNotes?: string;
}

// Get the next natural sequential 4-digit Member ID (e.g. 1001, 1002...)
export async function getNextMemberId(): Promise<string> {
  try {
    const allMembers = await prisma.member.findMany({
      select: { memberId: true },
    });

    let maxNum = 1000;
    for (const m of allMembers) {
      const num = extractNumericId(m.memberId);
      if (num !== null && num > maxNum) {
        maxNum = num;
      }
    }

    return `${maxNum + 1}`;
  } catch (error) {
    console.error("Failed to calculate next member ID:", error);
    return "1001";
  }
}

export async function getMembers(filters?: {
  search?: string;
  status?: string;
  ptStatus?: string;
  hasDue?: boolean;
}) {
  try {
    const whereClause: any = {};

    if (filters?.search) {
      whereClause.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { memberId: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "ALL") {
      whereClause.membershipStatus = filters.status as MembershipStatus;
    }

    if (filters?.ptStatus && filters.ptStatus !== "ALL") {
      const now = new Date();
      if (filters.ptStatus === "ACTIVE_PT") {
        whereClause.ptSubscriptions = {
          some: {
            status: "ACTIVE",
            endDate: { gte: now },
          },
        };
      } else if (filters.ptStatus === "EXPIRED_PT") {
        whereClause.ptSubscriptions = {
          some: {
            OR: [
              { status: "EXPIRED" },
              { endDate: { lt: now } },
            ],
          },
        };
      } else if (filters.ptStatus === "NO_PT") {
        whereClause.ptSubscriptions = {
          none: {},
        };
      }
    }

    if (filters?.hasDue) {
      whereClause.OR = [
        { subscriptions: { some: { dueAmount: { gt: 0 } } } },
        { ptSubscriptions: { some: { dueAmount: { gt: 0 } } } },
      ];
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        ptSubscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 5,
        },
      },
    });

    // Auto-normalize any existing prefixed member IDs in DB on read
    for (const m of members) {
      if (m.memberId.includes("GYM-") || m.memberId.includes("gym-")) {
        const correctId = normalizeMemberId(m.memberId);
        prisma.member.update({
          where: { id: m.id },
          data: { memberId: correctId },
        }).catch(() => {});
        m.memberId = correctId;
      }
    }

    // Always sort based on ID highest to lowest (descending order)
    members.sort((a, b) => {
      const numA = extractNumericId(a.memberId) || 0;
      const numB = extractNumericId(b.memberId) || 0;
      return numB - numA;
    });

    return members;
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return [];
  }
}

export async function getMembersLookup() {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        memberId: true,
        fullName: true,
        phone: true,
      },
    });

    // Normalize IDs and sort highest to lowest
    for (const m of members) {
      if (m.memberId.includes("GYM-") || m.memberId.includes("gym-")) {
        m.memberId = normalizeMemberId(m.memberId);
      }
    }

    members.sort((a, b) => {
      const numA = extractNumericId(a.memberId) || 0;
      const numB = extractNumericId(b.memberId) || 0;
      return numB - numA;
    });

    return members;
  } catch (error) {
    console.error("Failed to fetch members lookup:", error);
    return [];
  }
}

export async function getMemberById(id: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        ptSubscriptions: {
          orderBy: { createdAt: "desc" },
          include: {
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          include: {
            subscription: true,
            ptSubscription: true,
          },
        },
      },
    });
    return member;
  } catch (error) {
    console.error("Failed to fetch member by id:", error);
    return null;
  }
}

export async function createMember(input: CreateMemberInput) {
  try {
    let desiredId = input.memberId?.trim();
    if (!desiredId) {
      desiredId = await getNextMemberId();
    } else {
      desiredId = normalizeMemberId(desiredId);
      // Validate uniqueness
      const existing = await prisma.member.findUnique({
        where: { memberId: desiredId },
      });
      if (existing) {
        return {
          success: false,
          error: `Member ID "${desiredId}" is already taken by ${existing.fullName}. Please choose a unique ID.`,
        };
      }
    }

    const finalMemberId = desiredId;

    const fullName = `${input.firstName.trim()} ${input.lastName ? input.lastName.trim() : ""}`.trim();

    const member = await prisma.member.create({
      data: {
        memberId: finalMemberId,
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
        fullName,
        email: input.email?.trim() || null,
        phone: input.phone.trim(),
        gender: input.gender || "Male",
        dob: input.dob ? new Date(input.dob) : null,
        address: input.address || null,
        enrollDate: input.enrollDate ? new Date(input.enrollDate) : new Date(),
        representative: input.representative || null,
        referredBy: input.referredBy || null,
        isMarried: Boolean(input.isMarried),
        spouseName: input.spouseName || null,
        spouseBirthDate: input.spouseBirthDate ? new Date(input.spouseBirthDate) : null,
        anniversaryDate: input.anniversaryDate ? new Date(input.anniversaryDate) : null,
        occupation: input.occupation || null,
        designation: input.designation || null,
        source: input.source || "Walk-in",
        phoneOffice: input.phoneOffice || null,
        phoneResidence: input.phoneResidence || null,
        programme: input.programme || "General Fitness",
        notes: input.notes || null,
        // Questionnaire
        qFaintOrDizzy: Boolean(input.qFaintOrDizzy),
        qChestPain: Boolean(input.qChestPain),
        qRecentChestPain: Boolean(input.qRecentChestPain),
        qBloodPressureHeart: Boolean(input.qBloodPressureHeart),
        qDiabetes: Boolean(input.qDiabetes),
        qJointBoneProblem: Boolean(input.qJointBoneProblem),
        qPregnant: Boolean(input.qPregnant),
        qOver65: Boolean(input.qOver65),
        qOtherHealthIssues: input.qOtherHealthIssues || null,
        membershipStatus: "ACTIVE",
      },
    });

    // Create initial subscription and payment if plan selected
    if (input.planName && input.totalAmount) {
      const totalAmount = Number(input.totalAmount);
      const paidAmount = Number(input.paidAmount || 0);
      const dueAmount = Math.max(0, totalAmount - paidAmount);
      const startDate = input.startDate ? new Date(input.startDate) : new Date();
      const endDate = input.endDate ? new Date(input.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.memberSubscription.create({
        data: {
          memberId: member.id,
          planId: input.planId || null,
          planName: input.planName,
          startDate,
          endDate,
          totalAmount,
          paidAmount,
          dueAmount,
          status: "ACTIVE",
        },
      });

      if (paidAmount > 0) {
        await prisma.payment.create({
          data: {
            receiptNo: generateReceiptNo(),
            memberId: member.id,
            subscriptionId: subscription.id,
            amount: paidAmount,
            paymentDate: new Date(),
            paymentMethod: input.paymentMethod || "UPI",
            paymentType: "MEMBERSHIP_FEE",
            notes: input.paymentNotes || "Initial enrollment payment",
          },
        });
      }
    }

    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true, member };
  } catch (error: any) {
    console.error("Create member error:", error);
    return { success: false, error: error.message || "Failed to create member" };
  }
}

export async function updateMember(id: string, input: Partial<CreateMemberInput>) {
  try {
    let finalMemberId: string | undefined = undefined;
    if (input.memberId) {
      const desiredId = normalizeMemberId(input.memberId.trim());
      const existing = await prisma.member.findFirst({
        where: {
          memberId: desiredId,
          id: { not: id },
        },
      });
      if (existing) {
        return {
          success: false,
          error: `Member ID "${desiredId}" is already taken by ${existing.fullName}. Please choose a unique ID.`,
        };
      }
      finalMemberId = desiredId;
    }

    const fullName = input.firstName
      ? `${input.firstName.trim()} ${input.lastName ? input.lastName.trim() : ""}`.trim()
      : undefined;

    const updateData: any = {
      ...(finalMemberId && { memberId: finalMemberId }),
      ...(input.firstName && { firstName: input.firstName.trim() }),
      ...(input.lastName !== undefined && { lastName: input.lastName?.trim() || null }),
      ...(fullName && { fullName }),
      ...(input.email !== undefined && { email: input.email?.trim() || null }),
      ...(input.phone && { phone: input.phone.trim() }),
      ...(input.gender && { gender: input.gender }),
      ...(input.dob !== undefined && { dob: input.dob ? new Date(input.dob) : null }),
      ...(input.address !== undefined && { address: input.address || null }),
      ...(input.representative !== undefined && { representative: input.representative || null }),
      ...(input.referredBy !== undefined && { referredBy: input.referredBy || null }),
      ...(input.isMarried !== undefined && { isMarried: Boolean(input.isMarried) }),
      ...(input.spouseName !== undefined && { spouseName: input.spouseName || null }),
      ...(input.spouseBirthDate !== undefined && {
        spouseBirthDate: input.spouseBirthDate ? new Date(input.spouseBirthDate) : null,
      }),
      ...(input.anniversaryDate !== undefined && {
        anniversaryDate: input.anniversaryDate ? new Date(input.anniversaryDate) : null,
      }),
      ...(input.occupation !== undefined && { occupation: input.occupation || null }),
      ...(input.designation !== undefined && { designation: input.designation || null }),
      ...(input.source !== undefined && { source: input.source || null }),
      ...(input.phoneOffice !== undefined && { phoneOffice: input.phoneOffice || null }),
      ...(input.phoneResidence !== undefined && { phoneResidence: input.phoneResidence || null }),
      ...(input.programme !== undefined && { programme: input.programme || null }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      ...(input.qFaintOrDizzy !== undefined && { qFaintOrDizzy: Boolean(input.qFaintOrDizzy) }),
      ...(input.qChestPain !== undefined && { qChestPain: Boolean(input.qChestPain) }),
      ...(input.qRecentChestPain !== undefined && { qRecentChestPain: Boolean(input.qRecentChestPain) }),
      ...(input.qBloodPressureHeart !== undefined && {
        qBloodPressureHeart: Boolean(input.qBloodPressureHeart),
      }),
      ...(input.qDiabetes !== undefined && { qDiabetes: Boolean(input.qDiabetes) }),
      ...(input.qJointBoneProblem !== undefined && { qJointBoneProblem: Boolean(input.qJointBoneProblem) }),
      ...(input.qPregnant !== undefined && { qPregnant: Boolean(input.qPregnant) }),
      ...(input.qOver65 !== undefined && { qOver65: Boolean(input.qOver65) }),
      ...(input.qOtherHealthIssues !== undefined && {
        qOtherHealthIssues: input.qOtherHealthIssues || null,
      }),
    };

    const updated = await prisma.member.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/members/${id}`);
    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true, member: updated };
  } catch (error: any) {
    console.error("Update member error:", error);
    return { success: false, error: error.message || "Failed to update member" };
  }
}

export async function deleteMember(id: string) {
  try {
    await prisma.member.delete({
      where: { id },
    });
    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Delete member error:", error);
    return { success: false, error: error.message || "Failed to delete member" };
  }
}

export async function renewSubscription(data: {
  memberId: string;
  planId?: string;
  planName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  try {
    const total = Number(data.totalAmount);
    const paid = Number(data.paidAmount);
    const due = Math.max(0, total - paid);

    const subscription = await prisma.memberSubscription.create({
      data: {
        memberId: data.memberId,
        planId: data.planId || null,
        planName: data.planName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        status: "ACTIVE",
      },
    });

    await prisma.member.update({
      where: { id: data.memberId },
      data: { membershipStatus: "ACTIVE" },
    });

    if (paid > 0) {
      await prisma.payment.create({
        data: {
          receiptNo: generateReceiptNo(),
          memberId: data.memberId,
          subscriptionId: subscription.id,
          amount: paid,
          paymentDate: new Date(),
          paymentMethod: data.paymentMethod || "UPI",
          paymentType: "MEMBERSHIP_FEE",
          notes: data.notes || "Subscription renewal payment",
        },
      });
    }

    revalidatePath(`/members/${data.memberId}`);
    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true, subscription };
  } catch (error: any) {
    console.error("Renew subscription error:", error);
    return { success: false, error: error.message || "Failed to renew subscription" };
  }
}

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

// Get the next natural sequential Member ID with GYM- prefix (e.g. GYM-1007)
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

    return `GYM-${maxNum + 1}`;
  } catch (error) {
    console.error("Failed to calculate next member ID:", error);
    return "GYM-1001";
  }
}

// Automatic Sequence Shift:
// When owner assigns a number (e.g. GYM-1003) and that ID already exists,
// shift all members with numeric ID >= 1003 up by 1 (+1) to maintain exact unbroken sequence with GYM- prefix!
async function resequenceShift(targetId: string, excludeMemberDbId?: string): Promise<string> {
  const normalizedTargetId = normalizeMemberId(targetId);
  const targetNum = extractNumericId(normalizedTargetId);
  if (targetNum === null) return normalizedTargetId;

  // Check if target ID is currently taken by another member
  const collision = await prisma.member.findFirst({
    where: {
      memberId: normalizedTargetId,
      ...(excludeMemberDbId ? { id: { not: excludeMemberDbId } } : {}),
    },
  });

  if (!collision) {
    return normalizedTargetId;
  }

  // Fetch all existing members that need to be shifted (numericId >= targetNum)
  const allMembers = await prisma.member.findMany({
    where: {
      ...(excludeMemberDbId ? { id: { not: excludeMemberDbId } } : {}),
    },
    select: { id: true, memberId: true },
  });

  const membersToShift: Array<{ id: string; oldNum: number; newId: string }> = [];

  for (const m of allMembers) {
    const num = extractNumericId(m.memberId);
    if (num !== null && num >= targetNum) {
      membersToShift.push({
        id: m.id,
        oldNum: num,
        newId: `GYM-${num + 1}`,
      });
    }
  }

  if (membersToShift.length > 0) {
    // Sort descending so highest numbers shift first
    membersToShift.sort((a, b) => b.oldNum - a.oldNum);

    // Two-phase safe transaction to prevent unique constraint collisions
    await prisma.$transaction(async (tx) => {
      // Phase 1: Assign temporary non-colliding IDs
      for (const item of membersToShift) {
        await tx.member.update({
          where: { id: item.id },
          data: { memberId: `__SHIFT_TEMP_${item.id}__` },
        });
      }

      // Phase 2: Assign final shifted sequential IDs with GYM- prefix
      for (const item of membersToShift) {
        await tx.member.update({
          where: { id: item.id },
          data: { memberId: item.newId },
        });
      }
    });
  }

  return normalizedTargetId;
}

// Bulk Re-sequence All Members:
// Cleanly renumbers all lifetime members starting from startNumber (default: 1001)
// ordered by enrollment date with GYM- prefix
export async function resequenceAllMembers(startNumber: number = 1001) {
  try {
    const allMembers = await prisma.member.findMany({
      orderBy: [{ enrollDate: "asc" }, { createdAt: "asc" }],
      select: { id: true, memberId: true, fullName: true },
    });

    if (allMembers.length === 0) {
      return { success: true, count: 0 };
    }

    const resequencePlan = allMembers.map((m, index) => ({
      id: m.id,
      oldMemberId: m.memberId,
      newMemberId: `GYM-${startNumber + index}`,
    }));

    // Safe two-phase batch transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Temporarily unbind all member IDs
      for (const item of resequencePlan) {
        await tx.member.update({
          where: { id: item.id },
          data: { memberId: `__RESEQ_TEMP_${item.id}__` },
        });
      }

      // Step 2: Assign strict clean sequence with GYM- prefix
      for (const item of resequencePlan) {
        await tx.member.update({
          where: { id: item.id },
          data: { memberId: item.newMemberId },
        });
      }
    });

    revalidatePath("/members");
    revalidatePath("/payments");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true, count: resequencePlan.length };
  } catch (error: any) {
    console.error("Bulk re-sequence error:", error);
    return { success: false, error: error.message || "Failed to re-sequence members" };
  }
}

export async function getMembers(filters?: {
  search?: string;
  status?: string;
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

    if (filters?.hasDue) {
      whereClause.subscriptions = {
        some: {
          dueAmount: { gt: 0 },
        },
      };
    }

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 5,
        },
      },
    });

    // Auto-normalize any existing non-prefixed member IDs in DB on read
    for (const m of members) {
      if (!m.memberId.startsWith("GYM-")) {
        const correctId = normalizeMemberId(m.memberId);
        // Non-blocking update
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
      if (!m.memberId.startsWith("GYM-")) {
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
        payments: {
          orderBy: { paymentDate: "desc" },
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
    }

    // Auto shift existing members if desiredId conflicts in sequence
    const finalMemberId = await resequenceShift(desiredId);

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
      const desiredId = input.memberId.trim();
      finalMemberId = await resequenceShift(desiredId, id);
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

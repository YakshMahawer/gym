"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

export type PlanCategory = "GYM" | "PT" | "OTHER";

const DEFAULT_PLANS: Array<{
  name: string;
  price: number;
  durationInDays: number;
  category: PlanCategory;
  sessions?: number;
  description: string;
}> = [
  // Gym Memberships
  { name: "1 Month", price: 4000, durationInDays: 30, category: "GYM", description: "1 Month regular gym access" },
  { name: "3 Months", price: 9000, durationInDays: 90, category: "GYM", description: "3 Months regular gym access" },
  { name: "6 Months (Regular)", price: 15000, durationInDays: 180, category: "GYM", description: "6 Months regular membership" },
  { name: "1 Year (Males)", price: 25000, durationInDays: 365, category: "GYM", description: "1 Year full membership (Males)" },
  { name: "Happy Hours Offer", price: 18000, durationInDays: 365, category: "GYM", description: "Special afternoon slot annual membership" },
  { name: "1 Year (Female)", price: 23000, durationInDays: 365, category: "GYM", description: "1 Year membership (Female concession)" },
  { name: "1 Year (Student)", price: 23000, durationInDays: 365, category: "GYM", description: "1 Year membership (Student concession)" },
  { name: "Group Training (3 Persons 12 Sessions)", price: 7500, durationInDays: 30, category: "GYM", sessions: 12, description: "Small group training for 3 persons" },

  // Personal Training (PT) - Official Concept 1 Gym PT Packages
  { name: "PT", price: 1000, durationInDays: 30, category: "PT", sessions: 1, description: "Personal Training starter / single session" },
  { name: "1 Month PT (12 Sessions)", price: 6000, durationInDays: 30, category: "PT", sessions: 12, description: "12 One-on-one sessions in 1 month" },
  { name: "3 Months PT (36 Sessions)", price: 16500, durationInDays: 90, category: "PT", sessions: 36, description: "36 PT sessions across 3 months" },
  { name: "6 Months PT (72 Sessions)", price: 30000, durationInDays: 180, category: "PT", sessions: 72, description: "72 PT sessions across 6 months" },
  { name: "12 Months PT (144 Sessions)", price: 54000, durationInDays: 365, category: "PT", sessions: 144, description: "144 PT sessions across 1 year" },
  { name: "1 Month PT (24 Sessions)", price: 10000, durationInDays: 30, category: "PT", sessions: 24, description: "24 PT sessions in 1 month" },
  { name: "3 Months PT (72 Sessions)", price: 28500, durationInDays: 90, category: "PT", sessions: 72, description: "72 PT sessions across 3 months" },
  { name: "6 Months PT (144 Sessions)", price: 54000, durationInDays: 180, category: "PT", sessions: 144, description: "144 PT sessions across 6 months" },
  { name: "12 Months PT (288 Sessions)", price: 102000, durationInDays: 365, category: "PT", sessions: 288, description: "288 PT sessions across 1 year" },

  // Others (Add-ons / Misc)
  { name: "Dietitian Nutrition Plan", price: 2500, durationInDays: 30, category: "OTHER", description: "Personalized sports nutrition and diet chart" },
  { name: "Locker Rental (Monthly)", price: 500, durationInDays: 30, category: "OTHER", description: "Dedicated private gym locker access" },
  { name: "Locker Rental (Annual)", price: 4000, durationInDays: 365, category: "OTHER", description: "Dedicated private gym locker for 12 months" },
];

/**
 * Seed initial default plans if the database has none
 */
async function ensureDefaultPlansSeeded() {
  const count = await prisma.membershipPlan.count();
  if (count < DEFAULT_PLANS.length) {
    for (const p of DEFAULT_PLANS) {
      const existing = await prisma.membershipPlan.findFirst({
        where: { name: p.name },
      });
      if (!existing) {
        await prisma.membershipPlan.create({
          data: {
            name: p.name,
            price: p.price,
            durationInDays: p.durationInDays,
            category: p.category,
            sessions: p.sessions || null,
            description: p.description,
            isActive: true,
          },
        });
      }
    }
  }
}

/**
 * Fetch active plans (optionally filtered by category: GYM | PT | OTHER)
 */
export async function getPlans(category?: string) {
  try {
    await ensureDefaultPlansSeeded();

    const where: any = { isActive: true };
    if (category && category !== "ALL") {
      where.category = category;
    }

    const plans = await prisma.membershipPlan.findMany({
      where,
      orderBy: [{ category: "asc" }, { price: "asc" }],
    });

    return plans;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return DEFAULT_PLANS.filter((p) => !category || category === "ALL" || p.category === category).map((p, idx) => ({
      id: `fallback-${idx}`,
      name: p.name,
      price: p.price,
      durationInDays: p.durationInDays,
      category: p.category,
      sessions: p.sessions || null,
      description: p.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

/**
 * Fetch all plans for Admin / Superadmin management
 */
export async function getAllPlansAdmin() {
  try {
    await ensureDefaultPlansSeeded();

    return await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { price: "asc" }],
    });
  } catch (error) {
    console.error("Failed to fetch admin plans:", error);
    return [];
  }
}

/**
 * Create a new plan (Admin & Superadmin only)
 */
export async function createPlan(data: {
  name: string;
  price: number;
  durationInDays: number;
  category: string;
  sessions?: number | null;
  description?: string;
}) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "SUPERUSER" && user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    if (!data.name?.trim()) {
      return { success: false, error: "Plan name is required." };
    }

    if (data.price === undefined || data.price < 0) {
      return { success: false, error: "Valid price is required." };
    }

    const validCategory = ["GYM", "PT", "OTHER"].includes(data.category)
      ? data.category
      : "GYM";

    const plan = await prisma.membershipPlan.create({
      data: {
        name: data.name.trim(),
        price: Number(data.price),
        durationInDays: Number(data.durationInDays) || 30,
        category: validCategory,
        sessions: data.sessions ? Number(data.sessions) : null,
        description: data.description?.trim() || null,
        isActive: true,
      },
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/reports");
    revalidatePath("/portal/members");

    return { success: true, plan };
  } catch (error: any) {
    console.error("Failed to create plan:", error);
    return { success: false, error: error.message || "Failed to create plan." };
  }
}

/**
 * Update an existing plan (Admin & Superadmin only)
 */
export async function updatePlan(
  id: string,
  data: {
    name?: string;
    price?: number;
    durationInDays?: number;
    category?: string;
    sessions?: number | null;
    description?: string;
    isActive?: boolean;
  }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "SUPERUSER" && user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.durationInDays !== undefined) updateData.durationInDays = Number(data.durationInDays);
    if (data.category !== undefined && ["GYM", "PT", "OTHER"].includes(data.category)) {
      updateData.category = data.category;
    }
    if (data.sessions !== undefined) {
      updateData.sessions = data.sessions ? Number(data.sessions) : null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = Boolean(data.isActive);
    }

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/reports");
    revalidatePath("/portal/members");

    return { success: true, plan: updated };
  } catch (error: any) {
    console.error("Failed to update plan:", error);
    return { success: false, error: error.message || "Failed to update plan." };
  }
}

/**
 * Remove / de-activate a plan (Admin & Superadmin only)
 */
export async function deletePlan(id: string) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "SUPERUSER" && user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    // Soft delete so historical subscriptions still reference the plan
    await prisma.membershipPlan.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/reports");
    revalidatePath("/portal/members");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete plan:", error);
    return { success: false, error: error.message || "Failed to delete plan." };
  }
}

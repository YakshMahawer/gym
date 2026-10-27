"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";

const DEFAULT_TRAINERS = [
  { name: "Coach Vikram", specialty: "Strength & Conditioning", phone: "" },
  { name: "Coach Rahul", specialty: "Hypertrophy & Fat Loss", phone: "" },
  { name: "Coach Priya", specialty: "Mobility & Functional Training", phone: "" },
  { name: "Coach Simran", specialty: "HIIT & Cardio Endurance", phone: "" },
  { name: "Coach Alex", specialty: "Powerlifting & Posture Correction", phone: "" },
  { name: "Head Coach Aman", specialty: "Master Trainer & Kinesiology", phone: "" },
];

/**
 * Seed default trainers if none exist
 */
async function ensureDefaultTrainersSeeded() {
  const count = await prisma.trainer.count();
  if (count === 0) {
    for (const t of DEFAULT_TRAINERS) {
      await prisma.trainer.create({
        data: {
          name: t.name,
          specialty: t.specialty,
          phone: t.phone || null,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Fetch all active trainers (for PT selectors and public view)
 */
export async function getTrainers() {
  try {
    await ensureDefaultTrainersSeeded();

    const trainers = await prisma.trainer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return trainers;
  } catch (error) {
    console.error("Failed to fetch trainers:", error);
    return DEFAULT_TRAINERS.map((t, idx) => ({
      id: `fallback-${idx}`,
      name: t.name,
      specialty: t.specialty,
      phone: t.phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

/**
 * Fetch all trainers for Admin/Superadmin management
 */
export async function getAllTrainersAdmin() {
  try {
    await ensureDefaultTrainersSeeded();

    return await prisma.trainer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch admin trainers:", error);
    return [];
  }
}

/**
 * Create a new trainer (Admin & Superadmin only)
 */
export async function createTrainer(data: {
  name: string;
  phone?: string;
  specialty?: string;
}) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "SUPERUSER" && user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    if (!data.name?.trim()) {
      return { success: false, error: "Trainer name is required." };
    }

    const trainer = await prisma.trainer.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        specialty: data.specialty?.trim() || null,
        isActive: true,
      },
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/members");
    revalidatePath("/portal/reports");

    return { success: true, trainer };
  } catch (error: any) {
    console.error("Failed to create trainer:", error);
    return { success: false, error: error.message || "Failed to create trainer." };
  }
}

/**
 * Update an existing trainer (Admin & Superadmin only)
 */
export async function updateTrainer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    specialty?: string;
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
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.specialty !== undefined) updateData.specialty = data.specialty?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    const updated = await prisma.trainer.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/members");
    revalidatePath("/portal/reports");

    return { success: true, trainer: updated };
  } catch (error: any) {
    console.error("Failed to update trainer:", error);
    return { success: false, error: error.message || "Failed to update trainer." };
  }
}

/**
 * Remove / de-activate a trainer (Admin & Superadmin only)
 */
export async function deleteTrainer(id: string) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "SUPERUSER" && user.role !== "ADMIN")) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await prisma.trainer.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/portal/settings");
    revalidatePath("/portal/members");
    revalidatePath("/portal/reports");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete trainer:", error);
    return { success: false, error: error.message || "Failed to delete trainer." };
  }
}

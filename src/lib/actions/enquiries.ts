"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EnquiryStatus } from "@prisma/client";

export interface CreateEnquiryInput {
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  source?: string;
  preferredPlan?: string;
  budget?: number;
  followUpDate?: string;
  status?: EnquiryStatus;
  notes?: string;
  assignedStaff?: string;
}

export async function getEnquiries(filters?: {
  search?: string;
  status?: string;
}) {
  try {
    const whereClause: any = {};

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status;
    }

    const enquiries = await prisma.enquiry.findMany({
      where: whereClause,
      orderBy: [{ followUpDate: "asc" }, { createdAt: "desc" }],
    });

    return enquiries;
  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
    return [];
  }
}

export async function createEnquiry(input: CreateEnquiryInput) {
  try {
    const enquiry = await prisma.enquiry.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        gender: input.gender || "Male",
        source: input.source || "Walk-in",
        preferredPlan: input.preferredPlan || null,
        budget: input.budget ? Number(input.budget) : null,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        status: input.status || "NEW",
        notes: input.notes || null,
        assignedStaff: input.assignedStaff || null,
      },
    });

    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
    return { success: true, enquiry };
  } catch (error: any) {
    console.error("Create enquiry error:", error);
    return { success: false, error: error.message || "Failed to create enquiry" };
  }
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus, notes?: string) {
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
    });

    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
    return { success: true, enquiry };
  } catch (error: any) {
    console.error("Update enquiry status error:", error);
    return { success: false, error: error.message || "Failed to update enquiry" };
  }
}

export async function deleteEnquiry(id: string) {
  try {
    await prisma.enquiry.delete({
      where: { id },
    });
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Delete enquiry error:", error);
    return { success: false, error: error.message || "Failed to delete enquiry" };
  }
}

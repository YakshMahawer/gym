"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const MembershipStatusEnum = z.enum(["ACTIVE", "INACTIVE", "FROZEN", "EXPIRED"]);

const memberSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required"),
  membershipStatus: MembershipStatusEnum,
  joinDate: z.string().trim().min(1, "Join date is required"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type MemberFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseForm(formData: FormData) {
  return memberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    membershipStatus: formData.get("membershipStatus"),
    joinDate: formData.get("joinDate"),
    notes: formData.get("notes"),
  });
}

export async function createMember(
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.member.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email ? parsed.data.email : null,
        phone: parsed.data.phone,
        membershipStatus: parsed.data.membershipStatus,
        joinDate: new Date(parsed.data.joinDate),
        notes: parsed.data.notes ? parsed.data.notes : null,
      },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { errors: { email: ["A member with this email already exists"] } };
    }
    return { message: "Something went wrong while saving the member." };
  }

  revalidatePath("/members");
  redirect("/members");
}

export async function updateMember(
  id: string,
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.member.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email ? parsed.data.email : null,
        phone: parsed.data.phone,
        membershipStatus: parsed.data.membershipStatus,
        joinDate: new Date(parsed.data.joinDate),
        notes: parsed.data.notes ? parsed.data.notes : null,
      },
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return { errors: { email: ["A member with this email already exists"] } };
    }
    return { message: "Something went wrong while saving the member." };
  }

  revalidatePath("/members");
  redirect("/members");
}

export async function deleteMember(id: string): Promise<void> {
  await prisma.member.delete({ where: { id } });
  revalidatePath("/members");
}

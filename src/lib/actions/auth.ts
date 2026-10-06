"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  authenticateCredentials,
  createSessionToken,
  getSessionUser,
  ensureDefaultAccounts,
  SessionUser,
} from "@/lib/auth";

const SESSION_COOKIE_NAME = "gym_session";

export async function loginUser(formData: {
  username: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: SessionUser }> {
  try {
    const { username, password } = formData;
    if (!username || !password) {
      return { success: false, error: "Please provide both username and password." };
    }

    const user = await authenticateCredentials(username, password);
    if (!user) {
      return { success: false, error: "Invalid username or password." };
    }

    const token = await createSessionToken(user);
    const cookieStore = cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    try {
      revalidatePath("/portal");
      revalidatePath("/login");
    } catch {}

    return { success: true, user };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Failed to log in." };
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}

export async function changeUserPassword(input: {
  targetUsername: string; // 'admin' or 'deskmanager'
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const caller = await getSessionUser();
    if (!caller) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // Only Admin and Superuser can change passwords
    if (caller.role !== "SUPERUSER" && caller.role !== "ADMIN") {
      return {
        success: false,
        error: "Access Denied: Only Admin and Superuser are permitted to change account passwords.",
      };
    }

    const target = input.targetUsername.trim().toLowerCase();

    // Superuser password cannot be changed
    if (target === "superuser") {
      return {
        success: false,
        error: "Superuser credentials are root-protected and cannot be modified.",
      };
    }

    if (target !== "admin" && target !== "deskmanager") {
      return {
        success: false,
        error: "Invalid target user. Passwords can only be changed for 'admin' or 'deskmanager'.",
      };
    }

    if (!input.oldPassword || !input.newPassword || !input.confirmPassword) {
      return { success: false, error: "Please fill in all password fields." };
    }

    if (input.newPassword !== input.confirmPassword) {
      return { success: false, error: "New password and confirmation do not match." };
    }

    if (input.newPassword.length < 5) {
      return { success: false, error: "New password must be at least 5 characters long." };
    }

    await ensureDefaultAccounts();

    const targetUser = await prisma.appUser.findUnique({
      where: { username: target },
    });

    if (!targetUser) {
      return { success: false, error: `Account '${target}' not found in database.` };
    }

    // Verify old password
    if (targetUser.password !== input.oldPassword.trim()) {
      return {
        success: false,
        error: `Incorrect current password for ${targetUser.name} (${target}).`,
      };
    }

    // Update password
    await prisma.appUser.update({
      where: { username: target },
      data: { password: input.newPassword.trim() },
    });

    try {
      revalidatePath("/portal/settings");
    } catch {}

    return {
      success: true,
      message: `Password for ${targetUser.name} (${target}) has been successfully updated!`,
    };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { success: false, error: error.message || "Failed to change password." };
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}

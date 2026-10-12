import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

async function logAndClearSession() {
  try {
    const user = await getSessionUser();
    if (user && user.role !== "SUPERUSER") {
      await recordAuditLog({
        username: user.username,
        role: user.role,
        userId: user.id,
        action: "STAFF_LOGOUT",
        category: "AUTH",
        title: "Staff Logged Out",
        details: `${user.name} (${user.username}) logged out of Gym CRM portal.`,
      });
    }
  } catch (err) {
    console.warn("Logout audit warning:", err);
  }

  const cookieStore = cookies();
  cookieStore.set("gym_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete("gym_session");
}

export async function GET(request: Request) {
  await logAndClearSession();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST() {
  await logAndClearSession();
  return NextResponse.json({ success: true });
}

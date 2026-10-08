import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPERUSER") {
      return NextResponse.json({ error: "Unauthorized: Superuser required" }, { status: 403 });
    }

    // Wipe tables for clean migration
    await prisma.payment.deleteMany();
    await prisma.memberPT.deleteMany();
    await prisma.memberSubscription.deleteMany();
    await prisma.member.deleteMany();
    await prisma.enquiry.deleteMany();

    return NextResponse.json({ success: true, message: "Database wiped successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reset database" }, { status: 500 });
  }
}

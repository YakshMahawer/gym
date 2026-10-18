import { NextResponse } from "next/server";
import { runDailyExpiryWhatsAppAutomation } from "@/lib/actions/whatsapp-automation";

export const dynamic = "force-dynamic";

/**
 * Daily Cron Endpoint for WhatsApp Expiry Reminders (Runs around afternoon)
 * Can be triggered via Vercel Cron, external cron service, or internal scheduler.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const secret = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secret === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await runDailyExpiryWhatsAppAutomation();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in /api/cron/whatsapp-expiry:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

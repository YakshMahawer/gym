import { NextRequest, NextResponse } from "next/server";
import { broadcastPushNotification } from "@/lib/webpush";

export async function POST(request: NextRequest) {
  try {
    const result = await broadcastPushNotification({
      title: "🔔 Concept I Live Alert: Test Alert",
      body: "Live notifications are fully connected to your device! You will receive instant alerts whenever staff logs in or performs actions.",
      url: "/audit",
      tag: "test-alert",
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Test alert sent to ${result.sent} active device(s). (${result.failed} failed/unregistered)`,
      result,
    });
  } catch (error: any) {
    console.error("Test notification error:", error);
    return NextResponse.json({ error: error.message || "Failed to send test push" }, { status: 500 });
  }
}

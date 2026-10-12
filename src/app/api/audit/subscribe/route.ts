import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription, removePushSubscription } from "@/lib/webpush";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, userAgent, deviceName } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Invalid subscription payload: missing keys or endpoint" },
        { status: 400 }
      );
    }

    const saved = await savePushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || request.headers.get("user-agent") || undefined,
      deviceName: deviceName || "Owner Device",
    });

    return NextResponse.json({ success: true, subscriptionId: saved.id });
  } catch (error: any) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: error.message || "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete push subscription:", error);
    return NextResponse.json({ error: error.message || "Failed to unsubscribe" }, { status: 500 });
  }
}

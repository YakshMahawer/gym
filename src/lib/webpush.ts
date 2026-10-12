import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BD-_ASVqkJTw0NmlB1xsPmlUNh_YMsqd4FYhzud-7o3FaCcPNBSg0zWnvXKNQcKhl3_WdJk0QP6INM6sD3mos0Q";

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "SviGC4Lmv3ETQfkJ3xj5hzrUTESBwPTPNAoNjL_nBJE";

const vapidSubject = process.env.VAPID_SUBJECT || "mailto:owner@concept1gym.com";

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.error("Failed to set VAPID details:", err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  timestamp?: number;
  data?: any;
}

/**
 * Register or update a Web Push subscription for the owner's device
 */
export async function savePushSubscription({
  endpoint,
  p256dh,
  auth,
  userAgent,
  deviceName,
}: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  deviceName?: string;
}) {
  return await prisma.pushSubscriptionRecord.upsert({
    where: { endpoint },
    update: {
      p256dh,
      auth,
      userAgent: userAgent || null,
      deviceName: deviceName || null,
    },
    create: {
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent || null,
      deviceName: deviceName || null,
    },
  });
}

/**
 * Remove an endpoint when unsubscribed
 */
export async function removePushSubscription(endpoint: string) {
  try {
    await prisma.pushSubscriptionRecord.deleteMany({
      where: { endpoint },
    });
  } catch (err) {
    console.warn("Failed to remove push subscription:", err);
  }
}

/**
 * Broadcasts a push notification to all owner registered devices
 */
export async function broadcastPushNotification(payload: PushNotificationPayload) {
  try {
    const subscriptions = await prisma.pushSubscriptionRecord.findMany();
    if (subscriptions.length === 0) {
      console.log("[Push Notification] No subscribed devices found to notify.");
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      url: payload.url || "/audit",
      tag: payload.tag || "audit-alert",
      timestamp: payload.timestamp || Date.now(),
      data: payload.data || {},
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload,
            {
              urgency: "high",
              TTL: 60 * 60 * 24, // 24 hours
            }
          );
          sent++;
        } catch (error: any) {
          failed++;
          // If the subscription has expired or unsubscribed, queue for deletion
          if (error.statusCode === 404 || error.statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    if (expiredEndpoints.length > 0) {
      await prisma.pushSubscriptionRecord.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
    }

    return { sent, failed };
  } catch (error) {
    console.error("Error in broadcastPushNotification:", error);
    return { sent: 0, failed: 0 };
  }
}

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { broadcastPushNotification } from "@/lib/webpush";

export interface RecordAuditParams {
  username: string;
  role: Role | string;
  userId?: string;
  action: string;
  category: "AUTH" | "PAYMENT" | "MEMBER" | "ENQUIRY" | "PT" | "SETTINGS" | "GENERAL";
  title: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Central Audit Recording Engine
 * Rule: Anyone other than Superuser doing ANY action or login triggers an audit log and real-time push alert to the client.
 */
export async function recordAuditLog(params: RecordAuditParams) {
  try {
    const isSuperuser =
      params.role === Role.SUPERUSER ||
      params.role === "SUPERUSER" ||
      params.username.toLowerCase() === "superuser";

    // If superuser, we don't alert the client as per requirements
    if (isSuperuser) {
      return null;
    }

    const roleEnum = (params.role in Role ? params.role : Role.FRONTDESK) as Role;

    // 1. Save to AuditLog in database
    const log = await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        username: params.username,
        role: roleEnum,
        action: params.action,
        category: params.category,
        title: params.title,
        details: params.details,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
      },
    });

    // 2. Trigger real-time mobile push notification to the owner's phone
    const roleLabel = roleEnum === Role.ADMIN ? "Admin" : "Front Desk";
    const pushTitle = `🔔 ${roleLabel} (${params.username}): ${params.title}`;
    const pushBody = params.details;

    // Dispatch async without blocking
    broadcastPushNotification({
      title: pushTitle,
      body: pushBody,
      url: "/audit",
      tag: params.action,
      data: {
        auditId: log.id,
        category: params.category,
        timestamp: log.createdAt.getTime(),
      },
    }).catch((err) => {
      console.error("Failed to broadcast push notification:", err);
    });

    return log;
  } catch (error) {
    console.error("Error recording audit log:", error);
    return null;
  }
}

/**
 * Fetch audit logs grouped/filtered for the Owner Audit PWA
 */
export async function getAuditLogs({
  date,
  category,
  username,
  limit = 100,
  skip = 0,
}: {
  date?: string; // YYYY-MM-DD
  category?: string;
  username?: string;
  limit?: number;
  skip?: number;
}) {
  const where: any = {};

  if (category && category !== "ALL") {
    where.category = category;
  }

  if (username && username !== "ALL") {
    where.username = username;
  }

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    where.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get summary stats for today's logs
 */
export async function getAuditSummaryStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayTotal, todayLogins, todayPayments, todayMembers, recentSubscribersCount] =
    await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: startOfToday },
          category: "AUTH",
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: startOfToday },
          category: "PAYMENT",
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: startOfToday },
          category: "MEMBER",
        },
      }),
      prisma.pushSubscriptionRecord.count(),
    ]);

  return {
    todayTotal,
    todayLogins,
    todayPayments,
    todayMembers,
    subscribedDevices: recentSubscribersCount,
  };
}

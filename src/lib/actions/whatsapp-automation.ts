"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import {
  isWhatsAppAutomationEnabled,
  setWhatsAppAutomationEnabled,
  getWhatsAppConfig,
  sendWhatsAppTemplate,
  sanitizeWhatsAppPhone,
} from "@/lib/whatsapp";
import { formatDate, formatINR, formatInvoiceNo } from "@/lib/utils";

/**
 * Helper to check if a date's Month & Day match Today in Indian Standard Time (Asia/Kolkata).
 * Also gracefully handles leap year birthdays (Feb 29 on non-leap years celebrated Feb 28).
 */
export function isSameDayAndMonth(
  targetDate?: Date | string | null,
  referenceDate: Date = new Date()
): boolean {
  if (!targetDate) return false;
  const d = new Date(targetDate);
  if (isNaN(d.getTime())) return false;

  // Comparison in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    day: "numeric",
  });
  const partsTarget = formatter.formatToParts(d);
  const partsRef = formatter.formatToParts(referenceDate);

  const tMonth = partsTarget.find((p) => p.type === "month")?.value;
  const tDay = partsTarget.find((p) => p.type === "day")?.value;
  const rMonth = partsRef.find((p) => p.type === "month")?.value;
  const rDay = partsRef.find((p) => p.type === "day")?.value;

  if (tMonth === rMonth && tDay === rDay) return true;

  // Handle Feb 29 leap birthdays in non-leap years
  if (tMonth === "2" && tDay === "29") {
    const refYear = referenceDate.getFullYear();
    const isLeap = (refYear % 4 === 0 && refYear % 100 !== 0) || refYear % 400 === 0;
    if (!isLeap && rMonth === "2" && rDay === "28") {
      return true;
    }
  }

  // Fallback check against UTC day & month in case date was stored as UTC calendar date
  const tUtcMonth = d.getUTCMonth();
  const tUtcDay = d.getUTCDate();
  const rUtcMonth = referenceDate.getUTCMonth();
  const rUtcDay = referenceDate.getUTCDate();

  return tUtcMonth === rUtcMonth && tUtcDay === rUtcDay;
}

/**
 * 1. Toggle master WhatsApp automation switch
 * Restricted to ADMIN and SUPERUSER only.
 */
export async function toggleWhatsAppAutomationAction(enabled: boolean) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERUSER")) {
    return { success: false, error: "Unauthorized. Admin or Superuser access required." };
  }

  const success = await setWhatsAppAutomationEnabled(enabled);
  if (!success) {
    return { success: false, error: "Failed to update automation state in database." };
  }

  await recordAuditLog({
    userId: session.id,
    username: session.username,
    role: session.role,
    action: "WHATSAPP_AUTOMATION_TOGGLED",
    category: "GENERAL",
    title: enabled ? "🟢 WhatsApp Automation Turned ON" : "🔴 WhatsApp Automation Turned OFF",
    details: `${session.username} (${session.role}) set automated WhatsApp expiry alerts to ${enabled ? "ACTIVE" : "INACTIVE"}.`,
  });

  return {
    success: true,
    enabled,
    message: enabled
      ? "WhatsApp automation is now ACTIVE. Expiry messages will send daily in the afternoon."
      : "WhatsApp automation is now OFF. No automated messages will be dispatched.",
  };
}

/**
 * 2. Save Fast2SMS API Configuration and Template IDs
 * Restricted to ADMIN and SUPERUSER only.
 */
export async function saveWhatsAppApiSettingsAction(data: {
  apiKey?: string;
  phoneNumberId?: string;
  wabaId?: string;
  senderNumber?: string;
  tplBirthdayWish?: string;
  tplAnniversaryWish?: string;
  tplExpiryMessage?: string;
  tplTodayExpiry?: string;
  tplWelcomeReceipt?: string;
  tplNameBirthday?: string;
  tplNameAnniversary?: string;
}) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERUSER")) {
    return { success: false, error: "Unauthorized." };
  }

  if (data.apiKey !== undefined && data.apiKey.trim()) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_api_key" },
      update: { value: data.apiKey.trim() },
      create: { key: "fast2sms_api_key", value: data.apiKey.trim() },
    });
  }

  if (data.phoneNumberId !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_phone_number_id" },
      update: { value: data.phoneNumberId.trim() },
      create: { key: "fast2sms_phone_number_id", value: data.phoneNumberId.trim() },
    });
  }

  if (data.wabaId !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_waba_id" },
      update: { value: data.wabaId.trim() },
      create: { key: "fast2sms_waba_id", value: data.wabaId.trim() },
    });
  }

  if (data.senderNumber !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_sender_number" },
      update: { value: data.senderNumber.trim() },
      create: { key: "fast2sms_sender_number", value: data.senderNumber.trim() },
    });
  }

  // Template message IDs
  if (data.tplBirthdayWish !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_birthday_wish" },
      update: { value: data.tplBirthdayWish.trim() },
      create: { key: "fast2sms_tpl_birthday_wish", value: data.tplBirthdayWish.trim() },
    });
  }

  if (data.tplAnniversaryWish !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_anniversary_wish" },
      update: { value: data.tplAnniversaryWish.trim() },
      create: { key: "fast2sms_tpl_anniversary_wish", value: data.tplAnniversaryWish.trim() },
    });
  }

  if (data.tplExpiryMessage !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_expiry_message" },
      update: { value: data.tplExpiryMessage.trim() },
      create: { key: "fast2sms_tpl_expiry_message", value: data.tplExpiryMessage.trim() },
    });
  }

  if (data.tplTodayExpiry !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_today_expiry" },
      update: { value: data.tplTodayExpiry.trim() },
      create: { key: "fast2sms_tpl_today_expiry", value: data.tplTodayExpiry.trim() },
    });
  }

  if (data.tplWelcomeReceipt !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_welcome_and_receipt" },
      update: { value: data.tplWelcomeReceipt.trim() },
      create: { key: "fast2sms_tpl_welcome_and_receipt", value: data.tplWelcomeReceipt.trim() },
    });
  }

  if (data.tplNameBirthday !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_name_birthday_wish" },
      update: { value: data.tplNameBirthday.trim() },
      create: { key: "fast2sms_tpl_name_birthday_wish", value: data.tplNameBirthday.trim() },
    });
  }

  if (data.tplNameAnniversary !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "fast2sms_tpl_name_anniversary_wish" },
      update: { value: data.tplNameAnniversary.trim() },
      create: { key: "fast2sms_tpl_name_anniversary_wish", value: data.tplNameAnniversary.trim() },
    });
  }

  return { success: true, message: "Fast2SMS WhatsApp settings and template configurations saved successfully." };
}

/**
 * 3. Fetch WhatsApp Automation Status & Recent Message Logs
 */
export async function getWhatsAppStatusAction() {
  const config = await getWhatsAppConfig();

  const recentLogs = await prisma.whatsAppMessageLog.findMany({
    take: 25,
    orderBy: { createdAt: "desc" },
  });

  return {
    config,
    recentLogs: recentLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

/**
 * 4. MANUAL TRIGGER: Send Welcome & Receipt template for a payment
 * STRICT REQUIREMENT: Only Admin and Superuser can trigger this! Desk Manager is forbidden.
 */
export async function sendReceiptWhatsAppAction(paymentId: string) {
  const session = await getSessionUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERUSER")) {
    return {
      success: false,
      error: "Access Denied: Only Admin and Superuser accounts can send WhatsApp receipts.",
    };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      member: true,
      subscription: true,
      ptSubscription: true,
    },
  });

  if (!payment) {
    return { success: false, error: "Payment record not found." };
  }

  const member = payment.member;
  if (!member || !member.phone) {
    return { success: false, error: "Member does not have a registered phone number." };
  }

  // Fast2SMS template: welcome_and_receipt
  // Approved template takes 1 variable: {{1}} = Member Name
  // And requires the official PDF document URL in mediaUrl
  const origin =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.concept1gym.com";
  const pdfUrl = `${origin}/api/receipt/${encodeURIComponent(payment.receiptNo)}/pdf`;
  const variables = [member.fullName];

  const result = await sendWhatsAppTemplate({
    to: member.phone,
    templateName: "welcome_and_receipt",
    variables,
    mediaUrl: pdfUrl,
    triggerType: "MANUAL_RECEIPT",
    sentBy: `${session.username} (${session.role})`,
    memberId: member.id,
    paymentId: payment.id,
  });

  if (result.success) {
    await recordAuditLog({
      userId: session.id,
      username: session.username,
      role: session.role,
      action: "WHATSAPP_RECEIPT_SENT",
      category: "RECEIPT_CHANGED",
      title: `🧾 Receipt WhatsApp Sent: ${member.fullName}`,
      details: `${session.username} sent receipt #${payment.receiptNo} (${formatINR(payment.amount)}) via Fast2SMS to ${member.phone}.`,
    });

    return {
      success: true,
      sentAt: new Date().toISOString(),
      message: `Receipt successfully sent on WhatsApp to ${member.fullName} (${member.phone})!`,
    };
  } else {
    return {
      success: false,
      error: result.error || "Failed to deliver WhatsApp message via Fast2SMS.",
    };
  }
}

/**
 * 5. MANUAL TRIGGER: Send Expiry Message from Members Section
 * Admin, Superuser, and Deskmanager can trigger manual individual reminders.
 */
export async function sendManualExpiryWhatsAppAction(data: {
  memberId: string;
  templateType: "expiry_message" | "today_expiry";
}) {
  const session = await getSessionUser();
  if (!session) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const member = await prisma.member.findUnique({
    where: { id: data.memberId },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });

  if (!member) {
    return { success: false, error: "Member not found." };
  }

  if (!member.phone) {
    return { success: false, error: "Member does not have a registered phone number." };
  }

  const latestSub = member.subscriptions[0];
  const lastGymDate = latestSub ? formatDate(latestSub.endDate) : formatDate(new Date());

  // Fast2SMS Approved Template variables:
  // 1) expiry_message: 2 vars [Name, Last Gym Date]
  // 2) today_expiry: 1 var [Name]
  const variables =
    data.templateType === "expiry_message"
      ? [member.fullName, lastGymDate]
      : [member.fullName];

  const result = await sendWhatsAppTemplate({
    to: member.phone,
    templateName: data.templateType,
    variables,
    triggerType: "MANUAL_EXPIRY",
    sentBy: `${session.username} (${session.role})`,
    memberId: member.id,
  });

  if (result.success) {
    await recordAuditLog({
      userId: session.id,
      username: session.username,
      role: session.role,
      action: "WHATSAPP_EXPIRY_SENT",
      category: "MEMBERSHIP_DATES_CHANGED",
      title: `🔔 Expiry WhatsApp Sent: ${member.fullName}`,
      details: `${session.username} manually sent ${data.templateType} template to ${member.fullName} (${member.phone}). Expiry Date: ${lastGymDate}.`,
    });

    return {
      success: true,
      message: `Expiry reminder (${data.templateType}) successfully sent to ${member.fullName}!`,
    };
  } else {
    return {
      success: false,
      error: result.error || "Failed to send expiry message via Fast2SMS.",
    };
  }
}

/**
 * 6. AUTOMATED JOB: Daily Expiry, Birthday & Anniversary Automation (Run in afternoon)
 *
 * CRITICAL CONDITIONS:
 * A) Check master automation toggle: If OFF, abort immediately!
 * B) Case 1: 7 days before expiry -> 'expiry_message' template (only if not renewed)
 * C) Case 2: Today of expiry -> 'today_expiry' template (only if not renewed)
 * D) Case 3: Birthday wish -> 'birthday_wish' (STRICT: ONLY for users who have active membership on their birthday!)
 * E) Case 4: Anniversary wish -> 'anniversary_wish' (STRICT: ONLY for users who have active membership on their anniversary!)
 * F) Avoid sending duplicate reminders on the same calendar day.
 */
export async function runDailyExpiryWhatsAppAutomation() {
  // CRITICAL SAFETY CHECK #1: Master toggle in Settings
  const isEnabled = await isWhatsAppAutomationEnabled();
  if (!isEnabled) {
    return {
      success: false,
      skipped: true,
      message: "WhatsApp automation is currently turned OFF in Settings. No messages sent.",
      sentCount: 0,
    };
  }

  const now = new Date();

  // Define date windows in local day bounds
  // 1) Today's window: 00:00:00 to 23:59:59
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // 2) 7 Days from now window
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const day7Start = new Date(in7Days.getFullYear(), in7Days.getMonth(), in7Days.getDate(), 0, 0, 0);
  const day7End = new Date(in7Days.getFullYear(), in7Days.getMonth(), in7Days.getDate(), 23, 59, 59);

  let sentExpiry7Count = 0;
  let sentExpiryTodayCount = 0;
  let sentBirthdayCount = 0;
  let sentAnniversaryCount = 0;
  let skippedRenewed = 0;
  let skippedDuplicate = 0;
  let skippedInactiveCount = 0;

  // ==========================================
  // CASE 1: 7-DAY EXPIRY REMINDER (expiry_message)
  // ==========================================
  const subsExpiringIn7Days = await prisma.memberSubscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: day7Start,
        lte: day7End,
      },
    },
    include: {
      member: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { endDate: "desc" },
          },
        },
      },
    },
  });

  for (const sub of subsExpiringIn7Days) {
    const member = sub.member;
    if (!member || !member.phone) continue;

    // RULE: Only send if the user has NOT renewed yet!
    // If member has another active subscription with endDate further in future, they already renewed!
    const hasRenewed = member.subscriptions.some(
      (s) => s.id !== sub.id && s.endDate > sub.endDate
    );
    if (hasRenewed) {
      skippedRenewed++;
      continue;
    }

    // Check if already sent today
    const alreadySentToday = await prisma.whatsAppMessageLog.findFirst({
      where: {
        memberId: member.id,
        templateName: "expiry_message",
        createdAt: { gte: todayStart },
      },
    });
    if (alreadySentToday) {
      skippedDuplicate++;
      continue;
    }

    // Dispatch expiry_message template
    const lastGymDate = formatDate(sub.endDate);
    const variables = [member.fullName, lastGymDate];

    await sendWhatsAppTemplate({
      to: member.phone,
      templateName: "expiry_message",
      variables,
      triggerType: "AUTOMATED_7_DAYS",
      sentBy: "SYSTEM_AUTOMATION",
      memberId: member.id,
    });
    sentExpiry7Count++;
  }

  // ==========================================
  // CASE 2: TODAY EXPIRY REMINDER (today_expiry)
  // ==========================================
  const subsExpiringToday = await prisma.memberSubscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: {
      member: {
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { endDate: "desc" },
          },
        },
      },
    },
  });

  for (const sub of subsExpiringToday) {
    const member = sub.member;
    if (!member || !member.phone) continue;

    // RULE: Only send if the user has NOT renewed yet!
    const hasRenewed = member.subscriptions.some(
      (s) => s.id !== sub.id && s.endDate > sub.endDate
    );
    if (hasRenewed) {
      skippedRenewed++;
      continue;
    }

    // Check if already sent today
    const alreadySentToday = await prisma.whatsAppMessageLog.findFirst({
      where: {
        memberId: member.id,
        templateName: "today_expiry",
        createdAt: { gte: todayStart },
      },
    });
    if (alreadySentToday) {
      skippedDuplicate++;
      continue;
    }

    // Dispatch today_expiry template (1 var: member.fullName)
    const variables = [member.fullName];

    await sendWhatsAppTemplate({
      to: member.phone,
      templateName: "today_expiry",
      variables,
      triggerType: "AUTOMATED_TODAY",
      sentBy: "SYSTEM_AUTOMATION",
      memberId: member.id,
    });
    sentExpiryTodayCount++;
  }

  // ==========================================
  // CASE 3: BIRTHDAY WISHES (birthday_wish)
  // STRICT RULE: ONLY wish to ACTIVE users who have an ACTIVE membership at their birthday!
  // ==========================================
  const activeMembersWithDob = await prisma.member.findMany({
    where: {
      membershipStatus: "ACTIVE",
      dob: { not: null },
      subscriptions: {
        some: {
          status: "ACTIVE",
          endDate: { gte: todayStart },
        },
      },
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          endDate: { gte: todayStart },
        },
        orderBy: { endDate: "desc" },
      },
    },
  });

  for (const member of activeMembersWithDob) {
    if (!member.phone || !member.dob) continue;

    // 1. Must match today's Month & Day (in IST & UTC)
    if (!isSameDayAndMonth(member.dob, now)) continue;

    // 2. STRICT CHECK: Must have active membership status AND at least one active subscription valid today
    const hasActiveSubscription = member.subscriptions.length > 0;
    if (member.membershipStatus !== "ACTIVE" || !hasActiveSubscription) {
      skippedInactiveCount++;
      continue;
    }

    // 3. Avoid duplicate birthday wishes on the same calendar day
    const alreadySentToday = await prisma.whatsAppMessageLog.findFirst({
      where: {
        memberId: member.id,
        templateName: "birthday_wish",
        createdAt: { gte: todayStart },
      },
    });
    if (alreadySentToday) {
      skippedDuplicate++;
      continue;
    }

    // 4. Dispatch birthday_wish template (1 var: member.fullName)
    const variables = [member.fullName];

    await sendWhatsAppTemplate({
      to: member.phone,
      templateName: "birthday_wish",
      variables,
      triggerType: "AUTOMATED_BIRTHDAY",
      sentBy: "SYSTEM_AUTOMATION",
      memberId: member.id,
    });
    sentBirthdayCount++;
  }

  // ==========================================
  // CASE 4: ANNIVERSARY WISHES (anniversary_wish)
  // STRICT RULE: ONLY wish to ACTIVE users who have an ACTIVE membership at their anniversary!
  // ==========================================
  const activeMembersWithAnniversary = await prisma.member.findMany({
    where: {
      membershipStatus: "ACTIVE",
      isMarried: true,
      anniversaryDate: { not: null },
      subscriptions: {
        some: {
          status: "ACTIVE",
          endDate: { gte: todayStart },
        },
      },
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          endDate: { gte: todayStart },
        },
        orderBy: { endDate: "desc" },
      },
    },
  });

  for (const member of activeMembersWithAnniversary) {
    if (!member.phone || !member.anniversaryDate) continue;

    // 1. Must match today's Month & Day (in IST & UTC)
    if (!isSameDayAndMonth(member.anniversaryDate, now)) continue;

    // 2. STRICT CHECK: Must have active membership status AND at least one active subscription valid today
    const hasActiveSubscription = member.subscriptions.length > 0;
    if (member.membershipStatus !== "ACTIVE" || !hasActiveSubscription) {
      skippedInactiveCount++;
      continue;
    }

    // 3. Avoid duplicate anniversary wishes on the same calendar day
    const alreadySentToday = await prisma.whatsAppMessageLog.findFirst({
      where: {
        memberId: member.id,
        templateName: "anniversary_wish",
        createdAt: { gte: todayStart },
      },
    });
    if (alreadySentToday) {
      skippedDuplicate++;
      continue;
    }

    // 4. Dispatch anniversary_wish template (1 var: member.fullName)
    const variables = [member.fullName];

    await sendWhatsAppTemplate({
      to: member.phone,
      templateName: "anniversary_wish",
      variables,
      triggerType: "AUTOMATED_ANNIVERSARY",
      sentBy: "SYSTEM_AUTOMATION",
      memberId: member.id,
    });
    sentAnniversaryCount++;
  }

  const totalSent = sentExpiry7Count + sentExpiryTodayCount + sentBirthdayCount + sentAnniversaryCount;

  return {
    success: true,
    sentCount: totalSent,
    sentExpiry7Count,
    sentExpiryTodayCount,
    sentBirthdayCount,
    sentAnniversaryCount,
    skippedRenewed,
    skippedDuplicate,
    skippedInactiveCount,
    message: `Automated run finished. Sent: ${totalSent} (7-Day Expiry: ${sentExpiry7Count}, Today Expiry: ${sentExpiryTodayCount}, Birthdays: ${sentBirthdayCount}, Anniversaries: ${sentAnniversaryCount}). Skipped (Renewed): ${skippedRenewed}, Skipped (Already sent): ${skippedDuplicate}, Skipped (Inactive/Expired): ${skippedInactiveCount}.`,
  };
}

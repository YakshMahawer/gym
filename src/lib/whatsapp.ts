import { prisma } from "@/lib/prisma";

export interface SendWhatsAppTemplateOptions {
  to: string; // Recipient phone number (e.g. "9876543210" or "919876543210")
  templateName:
    | "expiry_message"
    | "today_expiry"
    | "welcome_and_receipt"
    | "birthday_wish"
    | "anniversary_wish"
    | string;
  variables?: (string | number)[]; // [var1, var2, ...]
  mediaUrl?: string | null;
  messageId?: string | number | null; // Fast2SMS simple template message_id if available
  triggerType:
    | "AUTOMATED_7_DAYS"
    | "AUTOMATED_TODAY"
    | "AUTOMATED_BIRTHDAY"
    | "AUTOMATED_ANNIVERSARY"
    | "MANUAL_EXPIRY"
    | "MANUAL_RECEIPT"
    | "MANUAL_BIRTHDAY"
    | "MANUAL_ANNIVERSARY";
  sentBy?: string; // username e.g. "admin", "superuser", or "SYSTEM_AUTOMATION"
  memberId?: string | null;
  paymentId?: string | null;
}

export interface SendWhatsAppResult {
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

export const FAST2SMS_TEMPLATES = {
  expiry_message: {
    messageId: 36849,
    templateId: "1655511262641362",
    name: "expiry_message",
    varCount: 2,
    hasHeaderMedia: false,
    exampleVars: ["Member Name", "29 November 2026"],
    description: "Sent 7 days before expiry around afternoon",
  },
  today_expiry: {
    messageId: 37428,
    templateId: "1810491073631154",
    name: "today_expiry",
    varCount: 1,
    hasHeaderMedia: false,
    exampleVars: ["Member Name"],
    description: "Sent on the last gym date around afternoon",
  },
  welcome_and_receipt: {
    messageId: 36850,
    templateId: "868930349570934",
    name: "welcome_and_receipt",
    varCount: 1,
    hasHeaderMedia: true,
    exampleVars: ["Member Name"],
    description: "Manual receipt share triggered by Admin/Superuser with PDF receipt",
  },
  birthday_wish: {
    messageId: null as number | null,
    templateId: "",
    name: "birthday_wish",
    varCount: 1,
    hasHeaderMedia: false,
    exampleVars: ["Member Name"],
    description: "Automated birthday greeting sent to active members",
  },
  anniversary_wish: {
    messageId: null as number | null,
    templateId: "",
    name: "anniversary_wish",
    varCount: 1,
    hasHeaderMedia: false,
    exampleVars: ["Member Name"],
    description: "Automated wedding anniversary greeting sent to active members",
  },
  weekly_report: {
    messageId: 37430,
    templateId: "1075672591907615",
    name: "weekly_report",
    varCount: 1,
    hasHeaderMedia: true,
    exampleVars: ["8–14 October 2026"],
    description: "Weekly membership and business report PDF",
  },
} as const;

/**
 * Clean phone number to 12 digits (with Indian country code 91)
 */
export function sanitizeWhatsAppPhone(phone?: string | number | null): string {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Retrieve master automation switch from Database
 * CRITICAL SAFETY: Returns false by default if not explicitly 'true'
 */
export async function isWhatsAppAutomationEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "whatsapp_automation_enabled" },
    });
    return setting?.value === "true";
  } catch (error) {
    console.error("Failed to read whatsapp_automation_enabled setting:", error);
    return false; // Safe fallback: OFF
  }
}

/**
 * Update master automation switch
 */
export async function setWhatsAppAutomationEnabled(enabled: boolean): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { key: "whatsapp_automation_enabled" },
      update: { value: enabled ? "true" : "false" },
      create: { key: "whatsapp_automation_enabled", value: enabled ? "true" : "false" },
    });
    return true;
  } catch (error) {
    console.error("Failed to update whatsapp_automation_enabled setting:", error);
    return false;
  }
}

/**
 * Retrieve Fast2SMS credentials & template configuration
 */
export async function getWhatsAppConfig() {
  const isEnabled = await isWhatsAppAutomationEnabled();

  // Allow DB overrides or fallback to process.env
  const dbApiKey = await prisma.systemSetting.findUnique({ where: { key: "fast2sms_api_key" } });
  const dbPhoneId = await prisma.systemSetting.findUnique({ where: { key: "fast2sms_phone_number_id" } });
  const dbWabaId = await prisma.systemSetting.findUnique({ where: { key: "fast2sms_waba_id" } });
  const dbSenderNumber = await prisma.systemSetting.findUnique({ where: { key: "fast2sms_sender_number" } });

  // Template message_id / name settings from DB
  const [
    dbTplBirthday,
    dbTplAnniversary,
    dbTplExpiry7,
    dbTplExpiryToday,
    dbTplReceipt,
    dbTplNameBirthday,
    dbTplNameAnniversary,
  ] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_birthday_wish" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_anniversary_wish" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_expiry_message" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_today_expiry" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_welcome_and_receipt" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_name_birthday_wish" } }),
    prisma.systemSetting.findUnique({ where: { key: "fast2sms_tpl_name_anniversary_wish" } }),
  ]);

  const apiKey = dbApiKey?.value || process.env.FAST2SMS_API_KEY || "";
  const phoneNumberId = dbPhoneId?.value || process.env.FAST2SMS_PHONE_NUMBER_ID || "1291098734095226";
  const wabaId = dbWabaId?.value || process.env.FAST2SMS_WABA_ID || "1114633681106778";
  const senderNumber = dbSenderNumber?.value || process.env.FAST2SMS_SENDER_NUMBER || "+1555-382-0648";

  return {
    isAutomationEnabled: isEnabled,
    hasApiKey: Boolean(apiKey),
    hasPhoneNumberId: Boolean(phoneNumberId),
    apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "Not configured",
    phoneNumberId: phoneNumberId || "Not configured",
    wabaId: wabaId || "Not configured",
    senderNumber: senderNumber || "+1555-382-0648",
    verifiedName: "Concept Gym",
    qualityRating: "GREEN",
    connectionStatus: "CONNECTED",
    apiKey,
    templates: {
      birthdayWish: dbTplBirthday?.value || "",
      anniversaryWish: dbTplAnniversary?.value || "",
      expiryMessage: dbTplExpiry7?.value || "36849",
      todayExpiry: dbTplExpiryToday?.value || "37428",
      welcomeAndReceipt: dbTplReceipt?.value || "36850",
      nameBirthday: dbTplNameBirthday?.value || "birthday_wish",
      nameAnniversary: dbTplNameAnniversary?.value || "anniversary_wish",
    },
  };
}

/**
 * Core dispatch function to send WhatsApp Template via Fast2SMS
 */
export async function sendWhatsAppTemplate(
  options: SendWhatsAppTemplateOptions
): Promise<SendWhatsAppResult> {
  const {
    to,
    templateName,
    variables = [],
    mediaUrl,
    messageId,
    triggerType,
    sentBy = "SYSTEM",
    memberId,
    paymentId,
  } = options;

  const phone = sanitizeWhatsAppPhone(to);
  if (!phone || phone.length < 10) {
    const errorMsg = `Invalid recipient phone number: '${to}'`;
    await recordLog({
      memberId,
      phone: to || "unknown",
      templateName,
      variables: JSON.stringify(variables),
      status: "FAILED",
      response: errorMsg,
      triggerType,
      sentBy,
    });
    return { success: false, error: errorMsg };
  }

  // 1. SAFETY CHECK FOR AUTOMATED TRIGGERS
  const isAutomated = triggerType.startsWith("AUTOMATED_");
  if (isAutomated) {
    const enabled = await isWhatsAppAutomationEnabled();
    if (!enabled) {
      console.log(`[WhatsApp] Automated message skipped for ${phone}: Automation is OFF.`);
      await recordLog({
        memberId,
        phone,
        templateName,
        variables: JSON.stringify(variables),
        status: "SKIPPED",
        response: "Automated dispatch skipped: WhatsApp automation is disabled in Settings.",
        triggerType,
        sentBy,
      });
      return {
        success: false,
        skipped: true,
        error: "WhatsApp automation is currently disabled in Settings.",
      };
    }
  }

  // 2. RETRIEVE FAST2SMS CREDENTIALS
  const config = await getWhatsAppConfig();
  const apiKey = config.apiKey;
  const phoneNumberId = config.phoneNumberId !== "Not configured" ? config.phoneNumberId : "";

  if (!apiKey) {
    const errorMsg = "Fast2SMS API Key is not set in environment or Settings.";
    console.warn(`[WhatsApp] ${errorMsg}`);
    await recordLog({
      memberId,
      phone,
      templateName,
      variables: JSON.stringify(variables),
      status: "FAILED",
      response: errorMsg,
      triggerType,
      sentBy,
    });
    return { success: false, error: errorMsg };
  }

  try {
    let resultPayload: any = null;

    const mapped = FAST2SMS_TEMPLATES[templateName as keyof typeof FAST2SMS_TEMPLATES] as
      | {
          messageId?: number | string | null;
          templateId?: string;
          name: string;
          varCount: number;
          hasHeaderMedia: boolean;
        }
      | undefined;

    // Check DB for template message_id and custom template name overrides
    let dbMessageId: string | number | null = null;
    let customTemplateName: string | null = null;
    try {
      const [dbTpl, dbTplName] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: `fast2sms_tpl_${templateName}` } }),
        prisma.systemSetting.findUnique({ where: { key: `fast2sms_tpl_name_${templateName}` } }),
      ]);
      if (dbTpl?.value) {
        dbMessageId = dbTpl.value;
      }
      if (dbTplName?.value) {
        customTemplateName = dbTplName.value;
      }
    } catch (e) {
      // safe fallback if db lookup fails
    }

    const effectiveMessageId = messageId || dbMessageId || mapped?.messageId;
    const effectiveVars = mapped && mapped.varCount ? variables.slice(0, mapped.varCount) : variables;

    // Fast2SMS provides 2 main modes for sending templates:
    // Mode A: Simple Format endpoint (if message_id is provided)
    // Mode B: Meta-compatible WABA endpoint (standard template format)

    if (effectiveMessageId) {
      // MODE A: Fast2SMS Simple Format
      const params = new URLSearchParams({
        message_id: String(effectiveMessageId),
        phone_number_id: phoneNumberId,
        numbers: phone,
        variables_values: effectiveVars.map(String).join("|"),
      });
      if (mediaUrl) {
        params.append("media_url", mediaUrl);
      }

      const response = await fetch(`https://www.fast2sms.com/dev/whatsapp?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: apiKey,
          accept: "application/json",
        },
      });

      resultPayload = await response.json();
    } else {
      // MODE B: Fast2SMS Meta Format (Template by name)
      // Endpoint: https://www.fast2sms.com/dev/whatsapp/v21.0/{phone_number_id}/messages
      const targetPhoneId = phoneNumberId || "default";
      const url = `https://www.fast2sms.com/dev/whatsapp/v21.0/${targetPhoneId}/messages`;

      const components: any[] = [];
      if (effectiveVars.length > 0) {
        components.push({
          type: "body",
          parameters: effectiveVars.map((v) => ({
            type: "text",
            text: String(v),
          })),
        });
      }

      if (mediaUrl) {
        components.push({
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: mediaUrl,
                filename: `Receipt_${Date.now()}.pdf`,
              },
            },
          ],
        });
      }

      const bodyData = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "template",
        template: {
          name: customTemplateName || (mapped as any)?.name || templateName,
          language: {
            code: "en",
          },
          ...(components.length > 0 ? { components } : {}),
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      resultPayload = await response.json();
    }

    // Check response status
    const isSuccess =
      resultPayload?.return === true ||
      resultPayload?.status === "success" ||
      resultPayload?.messages?.length > 0 ||
      resultPayload?.message_id;

    const returnedId =
      resultPayload?.messages?.[0]?.id ||
      resultPayload?.message_id ||
      resultPayload?.request_id ||
      null;

    await recordLog({
      memberId,
      phone,
      templateName,
      variables: JSON.stringify(variables),
      status: isSuccess ? "SUCCESS" : "FAILED",
      response: JSON.stringify(resultPayload),
      triggerType,
      sentBy,
    });

    // If paymentId was passed and dispatch succeeded, update payment record
    if (paymentId && isSuccess) {
      await prisma.payment
        .update({
          where: { id: paymentId },
          data: {
            whatsappSentAt: new Date(),
            whatsappMessageId: returnedId ? String(returnedId) : "SENT_SUCCESS",
          },
        })
        .catch((err) => console.error("Failed to update payment.whatsappSentAt:", err));
    }

    if (!isSuccess) {
      return {
        success: false,
        error: resultPayload?.message || resultPayload?.error?.message || "Fast2SMS dispatch failed",
        rawResponse: resultPayload,
      };
    }

    return {
      success: true,
      messageId: returnedId ? String(returnedId) : undefined,
      rawResponse: resultPayload,
    };
  } catch (err: any) {
    console.error(`[WhatsApp] Error dispatching to Fast2SMS:`, err);
    await recordLog({
      memberId,
      phone,
      templateName,
      variables: JSON.stringify(variables),
      status: "FAILED",
      response: err.message || "Network error",
      triggerType,
      sentBy,
    });
    return {
      success: false,
      error: err.message || "Network error while calling Fast2SMS",
    };
  }
}

/**
 * Helper to record WhatsApp log in DB
 */
async function recordLog(data: {
  memberId?: string | null;
  phone: string;
  templateName: string;
  variables?: string | null;
  status: string;
  response?: string | null;
  triggerType: string;
  sentBy?: string | null;
}) {
  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        memberId: data.memberId || null,
        phone: data.phone,
        templateName: data.templateName,
        variables: data.variables || null,
        status: data.status,
        response: data.response || null,
        triggerType: data.triggerType,
        sentBy: data.sentBy || "SYSTEM",
      },
    });
  } catch (err) {
    console.error("Failed to write to WhatsAppMessageLog:", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, getAuditSummaryStats } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;
    const category = searchParams.get("category") || undefined;
    const username = searchParams.get("username") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;
    const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!, 10) : 0;

    const [logsData, stats] = await Promise.all([
      getAuditLogs({ date, category, username, limit, skip }),
      getAuditSummaryStats(),
    ]);

    return NextResponse.json({
      success: true,
      logs: logsData.logs,
      total: logsData.total,
      stats,
    });
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";

export type Timeframe = "today" | "week" | "month";

export async function getDashboardData() {
  const now = new Date();

  // Date ranges
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Concurrently execute all dashboard queries in parallel for maximum speed
  const [
    subSoldToday,
    subSoldWeek,
    subSoldMonth,
    ptSoldToday,
    ptSoldWeek,
    ptSoldMonth,
    paymentsToday,
    paymentsWeek,
    paymentsMonth,
    enquiriesToday,
    enquiriesWeek,
    enquiriesMonth,
    subDueAgg,
    ptDueAgg,
    dueSubsList,
    duePTsList,
    pendingFollowUps,
    recentMembers,
    expiringSubs,
    expiringPTs,
    allMembers,
  ] = await Promise.all([
    // 1. Memberships & PT Sold
    prisma.memberSubscription.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.memberSubscription.count({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.memberSubscription.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.memberPT.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.memberPT.count({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.memberPT.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
    }),

    // 2. Sales Aggregate (Payments table includes Membership, PT, and Due Clearances)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: monthStart, lte: monthEnd } },
    }),

    // 3. Enquiries Count
    prisma.enquiry.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.enquiry.count({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.enquiry.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
    }),

    // 4. Total Outstanding Due (Membership + PT)
    prisma.memberSubscription.aggregate({
      _sum: { dueAmount: true },
      where: { dueAmount: { gt: 0 } },
    }),
    prisma.memberPT.aggregate({
      _sum: { dueAmount: true },
      where: { dueAmount: { gt: 0 } },
    }),

    // Due Subscriptions & Due PTs List
    prisma.memberSubscription.findMany({
      where: { dueAmount: { gt: 0 } },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { dueAmount: "desc" },
    }),
    prisma.memberPT.findMany({
      where: { dueAmount: { gt: 0 } },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { dueAmount: "desc" },
    }),

    // 5. Follow-ups needed
    prisma.enquiry.findMany({
      where: {
        status: { in: ["NEW", "FOLLOW_UP"] },
        followUpDate: { lte: endOfDay(addDays(now, 1)) },
      },
      orderBy: { followUpDate: "asc" },
      take: 10,
    }),

    // 6. Recent Members
    prisma.member.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        ptSubscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),

    // 7. Expiring Soon (Next 7 days for both Membership and PT)
    prisma.memberSubscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: todayStart, lte: addDays(now, 7) },
      },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    }),
    prisma.memberPT.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: todayStart, lte: addDays(now, 7) },
      },
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    }),

    // 8. Birthday & Anniversary Candidates
    prisma.member.findMany({
      where: {
        OR: [{ dob: { not: null } }, { anniversaryDate: { not: null } }],
      },
      select: {
        id: true,
        memberId: true,
        fullName: true,
        phone: true,
        dob: true,
        anniversaryDate: true,
        spouseName: true,
      },
    }),
  ]);

  // Calculate upcoming birthdays & anniversaries within 7 days
  const upcomingEvents: Array<{
    id: string;
    memberId: string;
    fullName: string;
    phone: string;
    type: "Birthday" | "Anniversary";
    date: Date;
    isToday: boolean;
    daysUntil: number;
    detail?: string;
  }> = [];

  const currentYear = now.getFullYear();
  const todayNormalized = new Date(currentYear, now.getMonth(), now.getDate()).getTime();

  allMembers.forEach((m) => {
    if (m.dob) {
      const bday = new Date(m.dob);
      const bdayThisYear = new Date(currentYear, bday.getMonth(), bday.getDate());
      let diffDays = Math.ceil((bdayThisYear.getTime() - todayNormalized) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        upcomingEvents.push({
          id: `${m.id}-bday`,
          memberId: m.memberId,
          fullName: m.fullName,
          phone: m.phone,
          type: "Birthday",
          date: bdayThisYear,
          isToday: diffDays === 0,
          daysUntil: diffDays,
          detail: `Turning ${currentYear - bday.getFullYear()} yrs`,
        });
      }
    }

    if (m.anniversaryDate) {
      const anni = new Date(m.anniversaryDate);
      const anniThisYear = new Date(currentYear, anni.getMonth(), anni.getDate());
      let diffDays = Math.ceil((anniThisYear.getTime() - todayNormalized) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        upcomingEvents.push({
          id: `${m.id}-anni`,
          memberId: m.memberId,
          fullName: m.fullName,
          phone: m.phone,
          type: "Anniversary",
          date: anniThisYear,
          isToday: diffDays === 0,
          daysUntil: diffDays,
          detail: m.spouseName ? `with ${m.spouseName}` : undefined,
        });
      }
    }
  });

  upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);

  // Combine Due Subscriptions and Due PTs
  const combinedDueItems = [
    ...dueSubsList.map((s) => ({
      id: s.id,
      planName: s.planName,
      totalAmount: s.totalAmount,
      dueAmount: s.dueAmount,
      startDate: s.startDate,
      endDate: s.endDate,
      member: s.member,
      type: "MEMBERSHIP" as const,
    })),
    ...duePTsList.map((pt) => ({
      id: pt.id,
      planName: `PT: ${pt.planName} (${pt.trainerName || "Trainer"})`,
      totalAmount: pt.totalAmount,
      dueAmount: pt.dueAmount,
      startDate: pt.startDate,
      endDate: pt.endDate,
      member: pt.member,
      type: "PT" as const,
    })),
  ].sort((a, b) => b.dueAmount - a.dueAmount);

  // Combine Expiring Soon (Membership + PT)
  const combinedExpiringSoon = [
    ...expiringSubs.map((s) => ({
      id: s.id,
      planName: s.planName,
      endDate: s.endDate,
      member: s.member,
      type: "MEMBERSHIP" as const,
    })),
    ...expiringPTs.map((pt) => ({
      id: pt.id,
      planName: `PT: ${pt.planName} (${pt.trainerName || "Trainer"})`,
      endDate: pt.endDate,
      member: pt.member,
      type: "PT" as const,
    })),
  ].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const totalOutstandingDue = (subDueAgg._sum.dueAmount || 0) + (ptDueAgg._sum.dueAmount || 0);

  return {
    metrics: {
      sold: {
        today: subSoldToday + ptSoldToday,
        week: subSoldWeek + ptSoldWeek,
        month: subSoldMonth + ptSoldMonth,
      },
      sales: {
        today: paymentsToday._sum.amount || 0,
        week: paymentsWeek._sum.amount || 0,
        month: paymentsMonth._sum.amount || 0,
      },
      enquiries: {
        today: enquiriesToday,
        week: enquiriesWeek,
        month: enquiriesMonth,
      },
      totalDue: totalOutstandingDue,
    },
    dueSubscriptions: combinedDueItems,
    pendingFollowUps,
    recentMembers,
    expiringSoon: combinedExpiringSoon,
    upcomingEvents,
  };
}

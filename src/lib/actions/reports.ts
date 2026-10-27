"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import { getPlans } from "./plans";
import { formatInvoiceNo } from "@/lib/utils";

export interface PTPackageDistribution {
  name: string;
  count: number;
  activeCount: number;
  revenue: number;
  sessions: number;
}

export interface PTTrainerDistribution {
  trainer: string;
  clientCount: number;
  activeClients: number;
  totalSessions: number;
  completedSessions: number;
  revenue: number;
}

export interface OtherPaymentItem {
  id: string;
  receiptNo: string;
  invoiceNo: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  notes: string;
  memberName: string;
  memberId: string;
  phone: string;
}

export async function getReportsData() {
  const now = new Date();

  // 1. Prepare 6 months date ranges for parallel execution
  const monthRanges = [5, 4, 3, 2, 1, 0].map((i) => {
    const targetMonth = subMonths(now, i);
    return {
      targetMonth,
      monthLabel: format(targetMonth, "MMM yyyy"),
      start: startOfMonth(targetMonth),
      end: endOfMonth(targetMonth),
    };
  });

  // Concurrently fetch all reports data in parallel
  const [
    monthAggregates,
    allDbPlans,
    subscriptionsGrouped,
    allMemberPT,
    totalEnquiries,
    convertedEnquiries,
    paymentMethods,
    activeMembers,
    expiredMembers,
    frozenMembers,
    totalMembers,
    allPayments,
  ] = await Promise.all([
    // Parallel 6-month revenue aggregates
    Promise.all(
      monthRanges.map((mr) =>
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: {
            paymentDate: {
              gte: mr.start,
              lte: mr.end,
            },
          },
        })
      )
    ),

    // All gym plans
    getPlans("ALL"),

    // Subscriptions grouped by planName
    prisma.memberSubscription.groupBy({
      by: ["planName"],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),

    // All PT Subscriptions
    prisma.memberPT.findMany({
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
      orderBy: { createdAt: "desc" },
    }),

    // Enquiry counts
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "CONVERTED" } }),

    // Payment methods
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Member status counts
    prisma.member.count({ where: { membershipStatus: "ACTIVE" } }),
    prisma.member.count({ where: { membershipStatus: "EXPIRED" } }),
    prisma.member.count({ where: { membershipStatus: "FROZEN" } }),
    prisma.member.count(),

    // All Payments with related member, sub, and PT info
    prisma.payment.findMany({
      include: {
        member: {
          select: {
            id: true,
            memberId: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        subscription: {
          select: {
            id: true,
            planName: true,
            startDate: true,
            endDate: true,
          },
        },
        ptSubscription: {
          select: {
            id: true,
            planName: true,
            trainerName: true,
            totalSessions: true,
            completedSessions: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const monthlyRevenue = monthRanges.map((mr, index) => ({
    month: mr.monthLabel,
    amount: monthAggregates[index]._sum.amount || 0,
    count: monthAggregates[index]._count.id || 0,
  }));

  // 1. Regular Membership Package Analytics Distribution
  const knownNames = new Set<string>();
  const plansDistribution: Array<{
    id: string;
    name: string;
    price: number;
    durationInDays: number;
    count: number;
    revenue: number;
    category: "General" | "Personal Training" | "Special Offer";
  }> = [];

  const getCategory = (name: string): "General" | "Personal Training" | "Special Offer" => {
    if (name.includes("PT") || name.includes("Personal Training") || name.includes("Sessions") || name.includes("Group Training")) {
      return "Personal Training";
    }
    if (name.includes("Offer") || name.includes("Student") || name.includes("Female") || name.includes("Happy")) {
      return "Special Offer";
    }
    return "General";
  };

  for (const p of allDbPlans) {
    if (p.category === "PT") continue; // Handled separately in PT Analytics
    knownNames.add(p.name.toLowerCase());
    const match = subscriptionsGrouped.find(
      (g) => g.planName.toLowerCase() === p.name.toLowerCase()
    );
    plansDistribution.push({
      id: p.id,
      name: p.name,
      price: p.price,
      durationInDays: p.durationInDays,
      count: match?._count.id || 0,
      revenue: match?._sum.totalAmount || 0,
      category: getCategory(p.name),
    });
  }

  for (const g of subscriptionsGrouped) {
    if (!knownNames.has(g.planName.toLowerCase())) {
      plansDistribution.push({
        id: g.planName,
        name: g.planName,
        price: (g._sum.totalAmount || 0) / (g._count.id || 1),
        durationInDays: 30,
        count: g._count.id,
        revenue: g._sum.totalAmount || 0,
        category: getCategory(g.planName),
      });
    }
  }

  plansDistribution.sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  // 2. Personal Training (PT) Packages & Trainer Performance Analytics (Requirement 4)
  const ptPackageMap = new Map<string, { count: number; activeCount: number; revenue: number; sessions: number }>();
  const ptTrainerMap = new Map<string, { clientCount: number; activeClients: number; totalSessions: number; completedSessions: number; revenue: number }>();

  let totalPTRevenue = 0;
  let activePTCount = 0;
  let totalSessionsCompleted = 0;

  for (const pt of allMemberPT) {
    const isOngoing = pt.status === "ACTIVE" && new Date(pt.endDate) >= now;
    if (isOngoing) activePTCount++;
    totalPTRevenue += Number(pt.totalAmount) || 0;
    totalSessionsCompleted += Number(pt.completedSessions) || 0;

    // Plan grouping
    const planKey = pt.planName || "General PT";
    const currentPlan = ptPackageMap.get(planKey) || { count: 0, activeCount: 0, revenue: 0, sessions: pt.totalSessions || 12 };
    currentPlan.count += 1;
    if (isOngoing) currentPlan.activeCount += 1;
    currentPlan.revenue += Number(pt.totalAmount) || 0;
    ptPackageMap.set(planKey, currentPlan);

    // Trainer grouping
    const trainerKey = pt.trainerName?.trim() && pt.trainerName !== "-" ? pt.trainerName : "Unassigned / General";
    const currentTrainer = ptTrainerMap.get(trainerKey) || {
      clientCount: 0,
      activeClients: 0,
      totalSessions: 0,
      completedSessions: 0,
      revenue: 0,
    };
    currentTrainer.clientCount += 1;
    if (isOngoing) currentTrainer.activeClients += 1;
    currentTrainer.totalSessions += Number(pt.totalSessions) || 0;
    currentTrainer.completedSessions += Number(pt.completedSessions) || 0;
    currentTrainer.revenue += Number(pt.totalAmount) || 0;
    ptTrainerMap.set(trainerKey, currentTrainer);
  }

  const ptPackagesDistribution: PTPackageDistribution[] = Array.from(ptPackageMap.entries()).map(
    ([name, stats]) => ({
      name,
      count: stats.count,
      activeCount: stats.activeCount,
      revenue: stats.revenue,
      sessions: stats.sessions,
    })
  ).sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  const ptTrainerDistribution: PTTrainerDistribution[] = Array.from(ptTrainerMap.entries()).map(
    ([trainer, stats]) => ({
      trainer,
      clientCount: stats.clientCount,
      activeClients: stats.activeClients,
      totalSessions: stats.totalSessions,
      completedSessions: stats.completedSessions,
      revenue: stats.revenue,
    })
  ).sort((a, b) => b.activeClients - a.activeClients || b.revenue - a.revenue);

  // 3. Other Collections Breakdown (Requirement 6)
  const otherPayments: OtherPaymentItem[] = [];
  let otherTotalRevenue = 0;

  for (const p of allPayments) {
    if (p.paymentType === "OTHER") {
      const amt = Number(p.amount) || 0;
      otherTotalRevenue += amt;
      otherPayments.push({
        id: p.id,
        receiptNo: p.receiptNo,
        invoiceNo: formatInvoiceNo(p.receiptNo, p.paymentDate),
        paymentDate: p.paymentDate,
        amount: amt,
        paymentMethod: p.paymentMethod,
        notes: p.notes?.trim() || "Miscellaneous / Add-on",
        memberName: p.member.fullName,
        memberId: p.member.memberId,
        phone: p.member.phone,
      });
    }
  }

  // 4. Complete Payment / Collections Ledger (Requirement 2: NO tax division)
  const collectionsLedger = allPayments.map((p) => {
    const totalAmount = Number(p.amount) || 0;

    const planName =
      p.ptSubscription
        ? `PT: ${p.ptSubscription.planName}${p.ptSubscription.trainerName ? ` (${p.ptSubscription.trainerName})` : ""}`
        : p.subscription?.planName ||
          (p.paymentType === "OTHER" && p.notes
            ? `Other: ${p.notes}`
            : p.paymentType ? p.paymentType.replace(/_/g, " ") : "Gym Membership");

    return {
      id: p.id,
      receiptNo: p.receiptNo,
      invoiceNo: formatInvoiceNo(p.receiptNo, p.paymentDate),
      paymentDate: p.paymentDate,
      amount: totalAmount,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      notes: p.notes,
      member: p.member,
      subscription: p.subscription,
      ptSubscription: p.ptSubscription,
      planName,
      startDate: p.ptSubscription?.startDate || p.subscription?.startDate || p.paymentDate,
      endDate: p.ptSubscription?.endDate || p.subscription?.endDate || null,
    };
  });

  return {
    monthlyRevenue,
    plansDistribution,
    ptPackagesDistribution,
    ptTrainerDistribution,
    ptSummary: {
      totalClients: allMemberPT.length,
      activeClients: activePTCount,
      totalRevenue: totalPTRevenue,
      completedSessions: totalSessionsCompleted,
    },
    otherCollections: {
      totalRevenue: otherTotalRevenue,
      count: otherPayments.length,
      items: otherPayments,
    },
    collectionsLedger,
    // Alias for existing references
    taxLedger: collectionsLedger,
    enquiryStats: {
      total: totalEnquiries,
      converted: convertedEnquiries,
      rate: totalEnquiries > 0 ? Math.round((convertedEnquiries / totalEnquiries) * 100) : 0,
    },
    paymentMethods: paymentMethods.map((pm) => ({
      method: pm.paymentMethod,
      amount: pm._sum.amount || 0,
      count: pm._count.id,
    })),
    memberStats: {
      active: activeMembers,
      expired: expiredMembers,
      frozen: frozenMembers,
      total: totalMembers,
    },
  };
}

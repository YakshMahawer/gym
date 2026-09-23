"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import { getPlans } from "./plans";

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
    getPlans(),

    // Subscriptions grouped by planName
    prisma.memberSubscription.groupBy({
      by: ["planName"],
      _count: { id: true },
      _sum: { totalAmount: true },
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

    // Tax transactions
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
      },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const monthlyRevenue = monthRanges.map((mr, index) => ({
    month: mr.monthLabel,
    amount: monthAggregates[index]._sum.amount || 0,
    count: monthAggregates[index]._count.id || 0,
  }));

  // Map package analytics distribution
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

  const taxLedger = allPayments.map((p) => {
    const totalAmount = Number(p.amount) || 0;
    const taxableValue = Math.round((totalAmount / 1.18) * 100) / 100;
    const totalGst = Math.round((totalAmount - taxableValue) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    return {
      id: p.id,
      receiptNo: p.receiptNo,
      invoiceNo: p.receiptNo.startsWith("REC-") ? p.receiptNo.replace("REC-", "INV-") : p.receiptNo,
      paymentDate: p.paymentDate,
      amount: totalAmount,
      taxableValue,
      totalGst,
      cgst,
      sgst,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      notes: p.notes,
      member: p.member,
      subscription: p.subscription,
      planName: p.subscription?.planName || p.paymentType?.replace(/_/g, " ") || "Gym Membership",
      startDate: p.subscription?.startDate || p.paymentDate,
      endDate: p.subscription?.endDate || null,
    };
  });

  return {
    monthlyRevenue,
    plansDistribution,
    taxLedger,
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

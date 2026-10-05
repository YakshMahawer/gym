"use server";

import { prisma } from "@/lib/prisma";

const MEMBERSHIP_PLANS = [
  { name: "1 Month", price: 4000, durationInDays: 30, description: "1 Month regular gym access" },
  { name: "3 Months", price: 9000, durationInDays: 90, description: "3 Months regular gym access" },
  { name: "6 Months (Regular)", price: 15000, durationInDays: 180, description: "6 Months regular membership" },
  { name: "1 Year (Males)", price: 25000, durationInDays: 365, description: "1 Year full membership (Males)" },
  { name: "Happy Hours Offer", price: 18000, durationInDays: 365, description: "Special afternoon slot annual membership" },
  { name: "1 Year (Female)", price: 23000, durationInDays: 365, description: "1 Year membership (Female discount)" },
  { name: "1 Year (Student)", price: 23000, durationInDays: 365, description: "1 Year membership (Student concession)" },
  { name: "Group Training (3 Persons 12 Sessions)", price: 7500, durationInDays: 30, description: "Small group training for 3 persons" },
];

export async function getPlans() {
  try {
    const validPlanNames = MEMBERSHIP_PLANS.map((p) => p.name);

    // Sync defined plans
    for (const p of MEMBERSHIP_PLANS) {
      const existing = await prisma.membershipPlan.findFirst({
        where: { name: p.name },
      });
      if (!existing) {
        await prisma.membershipPlan.create({
          data: {
            name: p.name,
            price: p.price,
            durationInDays: p.durationInDays,
            description: p.description,
            isActive: true,
          },
        });
      } else if (!existing.isActive || existing.price !== p.price || existing.durationInDays !== p.durationInDays) {
        await prisma.membershipPlan.update({
          where: { id: existing.id },
          data: {
            price: p.price,
            durationInDays: p.durationInDays,
            description: p.description,
            isActive: true,
          },
        });
      }
    }

    // Deactivate any legacy/other plans not in the standard membership list
    await prisma.membershipPlan.updateMany({
      where: {
        name: { notIn: validPlanNames },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    const activePlans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
    });

    // Return in the exact specified order
    const orderedPlans = MEMBERSHIP_PLANS.map((def) => {
      const match = activePlans.find((p) => p.name === def.name);
      return (
        match || {
          id: def.name,
          name: def.name,
          price: def.price,
          durationInDays: def.durationInDays,
          description: def.description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
    });

    return orderedPlans;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return MEMBERSHIP_PLANS.map((p, idx) => ({
      id: `fallback-${idx}`,
      name: p.name,
      price: p.price,
      durationInDays: p.durationInDays,
      description: p.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

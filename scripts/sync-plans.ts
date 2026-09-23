import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PLANS = [
  { name: "PT", price: 1000, durationInDays: 30, description: "Personal Training single/starter" },
  { name: "1 Month", price: 4000, durationInDays: 30, description: "1 Month regular gym access" },
  { name: "3 Months", price: 9000, durationInDays: 90, description: "3 Months regular gym access" },
  { name: "6 Months (Regular)", price: 15000, durationInDays: 180, description: "6 Months regular membership" },
  { name: "1 Year (Males)", price: 25000, durationInDays: 365, description: "1 Year full membership (Males)" },
  { name: "1 Month PT (12 Sessions)", price: 6000, durationInDays: 30, description: "12 One-on-one sessions in 1 month" },
  { name: "3 Months PT (36 Sessions)", price: 16500, durationInDays: 90, description: "36 PT sessions across 3 months" },
  { name: "6 Months PT (72 Sessions)", price: 30000, durationInDays: 180, description: "72 PT sessions across 6 months" },
  { name: "12 Months PT (144 Sessions)", price: 54000, durationInDays: 365, description: "144 PT sessions across 1 year" },
  { name: "1 Month PT (24 Sessions)", price: 10000, durationInDays: 30, description: "24 PT sessions in 1 month" },
  { name: "3 Months PT (72 Sessions)", price: 28500, durationInDays: 90, description: "72 PT sessions across 3 months" },
  { name: "6 Months PT (144 Sessions)", price: 54000, durationInDays: 180, description: "144 PT sessions across 6 months" },
  { name: "12 Months PT (288 Sessions)", price: 102000, durationInDays: 365, description: "288 PT sessions across 1 year" },
  { name: "Happy Hours Offer", price: 18000, durationInDays: 365, description: "Special afternoon slot annual membership" },
  { name: "1 Year (Female)", price: 23000, durationInDays: 365, description: "1 Year membership (Female discount)" },
  { name: "1 Year (Student)", price: 23000, durationInDays: 365, description: "1 Year membership (Student concession)" },
  { name: "Group Training (3 Persons 12 Sessions)", price: 7500, durationInDays: 30, description: "Small group training for 3 persons" },
];

async function main() {
  console.log("Upserting 17 membership plans...");
  for (const p of DEFAULT_PLANS) {
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
      console.log(`Created plan: ${p.name} (₹${p.price})`);
    } else {
      await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: {
          price: p.price,
          durationInDays: p.durationInDays,
          description: p.description,
          isActive: true,
        },
      });
      console.log(`Updated plan: ${p.name} (₹${p.price})`);
    }
  }
  console.log("All 17 plans synchronized successfully!");
}

main()
  .catch((e) => {
    console.error("Error syncing plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

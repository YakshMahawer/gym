import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Erasing all existing data from database...");
  await prisma.payment.deleteMany();
  await prisma.memberSubscription.deleteMany();
  await prisma.member.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.membershipPlan.deleteMany();

  console.log("Seeding membership plans...");
  const plans = await Promise.all([
    prisma.membershipPlan.create({
      data: {
        name: "Monthly Standard",
        durationInDays: 30,
        price: 2000,
        description: "Full gym floor & cardio access for 1 month",
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Quarterly Pro (3 Months)",
        durationInDays: 90,
        price: 5000,
        description: "3 Months full access + 1 free fitness assessment",
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Half Yearly Elite (6 Months)",
        durationInDays: 180,
        price: 9000,
        description: "6 Months access + diet chart consultation",
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Annual Platinum (12 Months)",
        durationInDays: 365,
        price: 15000,
        description: "1 Year unlimited gym access + locker & spa",
      },
    }),
    prisma.membershipPlan.create({
      data: {
        name: "Personal Training (1 Month)",
        durationInDays: 30,
        price: 6000,
        description: "12 One-on-one sessions with certified trainer",
      },
    }),
  ]);

  const [monthly, quarterly, halfYearly, annual, pt] = plans;

  console.log("Seeding 7 dummy members with 4-digit IDs (1001-1007)...");
  const now = new Date();

  // 1. Rahul Sharma (1001) - Active Annual
  const m1 = await prisma.member.create({
    data: {
      memberId: "1001",
      firstName: "Rahul",
      lastName: "Sharma",
      fullName: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "9876543210",
      gender: "Male",
      dob: new Date("1994-05-15"),
      address: "A-42, Shanti Nagar, Sector 14",
      enrollDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Walk-in",
      isMarried: true,
      spouseName: "Pooja Sharma",
      anniversaryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
      occupation: "Software Engineer",
      designation: "Tech Lead",
      programme: "Muscle Gain",
      membershipStatus: "ACTIVE",
    },
  });
  const sub1 = await prisma.memberSubscription.create({
    data: {
      memberId: m1.id,
      planId: annual.id,
      planName: annual.name,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 350 * 24 * 60 * 60 * 1000),
      totalAmount: 15000,
      paidAmount: 15000,
      dueAmount: 0,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-001",
      memberId: m1.id,
      subscriptionId: sub1.id,
      amount: 15000,
      paymentDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Full payment received via GPay",
    },
  });

  // 2. Priya Patel (1002) - Active Quarterly (Has ₹2,500 due)
  const m2 = await prisma.member.create({
    data: {
      memberId: "1002",
      firstName: "Priya",
      lastName: "Patel",
      fullName: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "9823456789",
      gender: "Female",
      dob: new Date(now.getFullYear() - 25, now.getMonth(), now.getDate() + 1),
      address: "Flat 302, Green Heights, Phase 2",
      enrollDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      representative: "Coach Ananya",
      source: "Instagram",
      occupation: "Fashion Designer",
      programme: "Weight Loss",
      membershipStatus: "ACTIVE",
    },
  });
  const sub2 = await prisma.memberSubscription.create({
    data: {
      memberId: m2.id,
      planId: quarterly.id,
      planName: quarterly.name,
      startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 87 * 24 * 60 * 60 * 1000),
      totalAmount: 5000,
      paidAmount: 2500,
      dueAmount: 2500,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-002",
      memberId: m2.id,
      subscriptionId: sub2.id,
      amount: 2500,
      paymentDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      paymentMethod: "CASH",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Advance 50% paid in cash, balance due next week",
    },
  });

  // 3. Amit Verma (1003) - Expiring in 2 days
  const m3 = await prisma.member.create({
    data: {
      memberId: "1003",
      firstName: "Amit",
      lastName: "Verma",
      fullName: "Amit Verma",
      email: "amit.verma@example.com",
      phone: "9811223344",
      gender: "Male",
      dob: new Date("1990-10-12"),
      address: "House 12, Civil Lines",
      enrollDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Referral",
      referredBy: "Rahul Sharma (1001)",
      programme: "General Fitness",
      membershipStatus: "ACTIVE",
    },
  });
  const sub3 = await prisma.memberSubscription.create({
    data: {
      memberId: m3.id,
      planId: monthly.id,
      planName: monthly.name,
      startDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      totalAmount: 2000,
      paidAmount: 2000,
      dueAmount: 0,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-003",
      memberId: m3.id,
      subscriptionId: sub3.id,
      amount: 2000,
      paymentDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      paymentMethod: "CARD",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Swiped POS card",
    },
  });

  // 4. Simran Kaur (1004) - Half Yearly (Enrolled today, Birthday today!)
  const m4 = await prisma.member.create({
    data: {
      memberId: "1004",
      firstName: "Simran",
      lastName: "Kaur",
      fullName: "Simran Kaur",
      email: "simran.k@example.com",
      phone: "9712345678",
      gender: "Female",
      dob: new Date(now.getFullYear() - 28, now.getMonth(), now.getDate()),
      address: "B-7, Urban Estate",
      enrollDate: new Date(),
      representative: "Coach Ananya",
      source: "Google",
      programme: "Weight Loss",
      membershipStatus: "ACTIVE",
    },
  });
  const sub4 = await prisma.memberSubscription.create({
    data: {
      memberId: m4.id,
      planId: halfYearly.id,
      planName: halfYearly.name,
      startDate: new Date(),
      endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      totalAmount: 9000,
      paidAmount: 6000,
      dueAmount: 3000,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-004",
      memberId: m4.id,
      subscriptionId: sub4.id,
      amount: 6000,
      paymentDate: new Date(),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "PhonePe initial installment",
    },
  });

  // 5. Vikram Rathore (1005) - Expired subscription
  const m5 = await prisma.member.create({
    data: {
      memberId: "1005",
      firstName: "Vikram",
      lastName: "Rathore",
      fullName: "Vikram Rathore",
      email: "vikram.r@example.com",
      phone: "9900112233",
      gender: "Male",
      dob: new Date("1985-02-18"),
      address: "Flat 101, Lakeview Residency",
      enrollDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Walk-in",
      programme: "Muscle Gain",
      membershipStatus: "EXPIRED",
    },
  });
  const sub5 = await prisma.memberSubscription.create({
    data: {
      memberId: m5.id,
      planId: monthly.id,
      planName: monthly.name,
      startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      totalAmount: 2000,
      paidAmount: 2000,
      dueAmount: 0,
      status: "EXPIRED",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-005",
      memberId: m5.id,
      subscriptionId: sub5.id,
      amount: 2000,
      paymentDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      paymentMethod: "CASH",
      paymentType: "MEMBERSHIP_FEE",
    },
  });

  // 6. Ananya Deshmukh (1006) - Personal Training Client
  const m6 = await prisma.member.create({
    data: {
      memberId: "1006",
      firstName: "Ananya",
      lastName: "Deshmukh",
      fullName: "Ananya Deshmukh",
      email: "ananya.d@example.com",
      phone: "9833445566",
      gender: "Female",
      dob: new Date("1996-08-22"),
      address: "C-104, Sunrise Towers",
      enrollDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      representative: "Coach Ananya",
      source: "Instagram",
      occupation: "Marketing Consultant",
      programme: "Personal Training",
      membershipStatus: "ACTIVE",
    },
  });
  const sub6 = await prisma.memberSubscription.create({
    data: {
      memberId: m6.id,
      planId: pt.id,
      planName: pt.name,
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      totalAmount: 6000,
      paidAmount: 6000,
      dueAmount: 0,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-006",
      memberId: m6.id,
      subscriptionId: sub6.id,
      amount: 6000,
      paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Paid in full via Paytm",
    },
  });

  // 7. Rohan Mehta (1007) - Quarterly Pro, Active
  const m7 = await prisma.member.create({
    data: {
      memberId: "1007",
      firstName: "Rohan",
      lastName: "Mehta",
      fullName: "Rohan Mehta",
      email: "rohan.mehta@example.com",
      phone: "9866778899",
      gender: "Male",
      dob: new Date("1992-12-05"),
      address: "Plot 88, Model Town",
      enrollDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Referral",
      referredBy: "Priya Patel (1002)",
      programme: "Endurance & Cardio",
      membershipStatus: "ACTIVE",
    },
  });
  const sub7 = await prisma.memberSubscription.create({
    data: {
      memberId: m7.id,
      planId: quarterly.id,
      planName: quarterly.name,
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 89 * 24 * 60 * 60 * 1000),
      totalAmount: 5000,
      paidAmount: 5000,
      dueAmount: 0,
      status: "ACTIVE",
    },
  });
  await prisma.payment.create({
    data: {
      receiptNo: "REC-2026-007",
      memberId: m7.id,
      subscriptionId: sub7.id,
      amount: 5000,
      paymentDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      paymentMethod: "CARD",
      paymentType: "MEMBERSHIP_FEE",
      notes: "HDFC Debit card payment",
    },
  });

  console.log("Seeding enquiries...");
  await prisma.enquiry.createMany({
    data: [
      {
        name: "Deepak Choudhary",
        phone: "9899001122",
        email: "deepak.c@gmail.com",
        gender: "Male",
        source: "Google",
        preferredPlan: "Monthly Standard",
        budget: 2000,
        status: "TRIAL_SCHEDULED",
        followUpDate: new Date(),
        notes: "Scheduled free trial workout today at 6 PM.",
        assignedStaff: "Coach Vikram",
      },
      {
        name: "Neha Gupta",
        phone: "9871122334",
        email: "neha.gupta@gmail.com",
        gender: "Female",
        source: "Instagram",
        preferredPlan: "Annual Platinum (12 Months)",
        budget: 15000,
        status: "FOLLOW_UP",
        followUpDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        notes: "Inquired via Instagram DM regarding ladies timings & group classes.",
        assignedStaff: "Coach Ananya",
      },
      {
        name: "Kavita Rao",
        phone: "9845012345",
        email: "kavita.rao@example.com",
        gender: "Female",
        source: "Referral",
        preferredPlan: "Personal Training (1 Month)",
        budget: 6000,
        status: "NEW",
        followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        notes: "Referred by Simran Kaur (1004). Interested in posture correction.",
        assignedStaff: "Coach Ananya",
      },
      {
        name: "Tanmay Bhatia",
        phone: "9812998877",
        email: "tanmay.b@gmail.com",
        gender: "Male",
        source: "Walk-in",
        preferredPlan: "Quarterly Pro (3 Months)",
        budget: 5000,
        status: "LOST",
        notes: "Looking for morning 5 AM batch which is not available currently.",
        assignedStaff: "Coach Vikram",
      },
    ],
  });

  console.log("All 7 dummy members (1001-1007), plans, payments & enquiries seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

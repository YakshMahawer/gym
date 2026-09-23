import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  console.log("Seeding members & subscriptions...");
  const now = new Date();

  // Member 1: Rahul Sharma (Active, Fully Paid)
  const m1 = await prisma.member.create({
    data: {
      memberId: "GYM-1001",
      firstName: "Rahul",
      lastName: "Sharma",
      fullName: "Rahul Sharma",
      email: "rahul.sharma@example.com",
      phone: "9876543210",
      gender: "Male",
      dob: new Date("1994-05-15"),
      address: "A-42, Shanti Nagar, Sector 14",
      enrollDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Walk-in",
      isMarried: true,
      spouseName: "Pooja Sharma",
      anniversaryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4), // Upcoming anniversary!
      occupation: "Software Engineer",
      designation: "Tech Lead",
      programme: "Muscle Gain",
      membershipStatus: "ACTIVE",
      subscriptions: {
        create: {
          planId: annual.id,
          planName: annual.name,
          startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 355 * 24 * 60 * 60 * 1000),
          totalAmount: 15000,
          paidAmount: 15000,
          dueAmount: 0,
          status: "ACTIVE",
          payments: {
            create: {
              receiptNo: "REC-2026-001",
              amount: 15000,
              paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              paymentMethod: "UPI",
              paymentType: "MEMBERSHIP_FEE",
              notes: "Full payment received via GPay",
              member: { connect: { memberId: "GYM-1001" } },
            },
          },
        },
      },
    },
  });

  // Member 2: Priya Patel (Has pending due)
  const m2 = await prisma.member.create({
    data: {
      memberId: "GYM-1002",
      firstName: "Priya",
      lastName: "Patel",
      fullName: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "9823456789",
      gender: "Female",
      dob: new Date(now.getFullYear() - 25, now.getMonth(), now.getDate() + 1), // Birthday tomorrow!
      address: "Flat 302, Green Heights, Phase 2",
      enrollDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      representative: "Coach Ananya",
      source: "Instagram",
      occupation: "Fashion Designer",
      programme: "Weight Loss",
      membershipStatus: "ACTIVE",
      subscriptions: {
        create: {
          planId: quarterly.id,
          planName: quarterly.name,
          startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 88 * 24 * 60 * 60 * 1000),
          totalAmount: 5000,
          paidAmount: 2500,
          dueAmount: 2500,
          status: "ACTIVE",
          payments: {
            create: {
              receiptNo: "REC-2026-002",
              amount: 2500,
              paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
              paymentMethod: "CASH",
              paymentType: "MEMBERSHIP_FEE",
              notes: "Advance 50% paid in cash",
              member: { connect: { memberId: "GYM-1002" } },
            },
          },
        },
      },
    },
  });

  // Member 3: Amit Verma (Due payment & expiring soon)
  const m3 = await prisma.member.create({
    data: {
      memberId: "GYM-1003",
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
      referredBy: "Rahul Sharma",
      programme: "General Fitness",
      membershipStatus: "ACTIVE",
      subscriptions: {
        create: {
          planId: monthly.id,
          planName: monthly.name,
          startDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Expiring in 2 days
          totalAmount: 2000,
          paidAmount: 2000,
          dueAmount: 0,
          status: "ACTIVE",
          payments: {
            create: {
              receiptNo: "REC-2026-003",
              amount: 2000,
              paymentDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
              paymentMethod: "CARD",
              paymentType: "MEMBERSHIP_FEE",
              notes: "Swiped POS card",
              member: { connect: { memberId: "GYM-1003" } },
            },
          },
        },
      },
    },
  });

  // Member 4: Simran Kaur (New member enrolled today)
  const m4 = await prisma.member.create({
    data: {
      memberId: "GYM-1004",
      firstName: "Simran",
      lastName: "Kaur",
      fullName: "Simran Kaur",
      email: "simran.k@example.com",
      phone: "9712345678",
      gender: "Female",
      dob: new Date(now.getFullYear() - 28, now.getMonth(), now.getDate()), // Birthday today!
      address: "B-7, Urban Estate",
      enrollDate: new Date(),
      representative: "Coach Ananya",
      source: "Google",
      programme: "Weight Loss",
      membershipStatus: "ACTIVE",
      subscriptions: {
        create: {
          planId: halfYearly.id,
          planName: halfYearly.name,
          startDate: new Date(),
          endDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
          totalAmount: 9000,
          paidAmount: 6000,
          dueAmount: 3000,
          status: "ACTIVE",
          payments: {
            create: {
              receiptNo: "REC-2026-004",
              amount: 6000,
              paymentDate: new Date(),
              paymentMethod: "UPI",
              paymentType: "MEMBERSHIP_FEE",
              notes: "PhonePe payment",
              member: { connect: { memberId: "GYM-1004" } },
            },
          },
        },
      },
    },
  });

  // Member 5: Vikram Rathore (Expired subscription)
  const m5 = await prisma.member.create({
    data: {
      memberId: "GYM-1005",
      firstName: "Vikram",
      lastName: "Rathore",
      fullName: "Vikram Rathore",
      email: "vikram.r@example.com",
      phone: "9900112233",
      gender: "Male",
      dob: new Date("1985-02-18"),
      address: "Flat 101, Lakeview",
      enrollDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      representative: "Coach Vikram",
      source: "Walk-in",
      programme: "Muscle Gain",
      membershipStatus: "EXPIRED",
      subscriptions: {
        create: {
          planId: monthly.id,
          planName: monthly.name,
          startDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          totalAmount: 2000,
          paidAmount: 2000,
          dueAmount: 0,
          status: "EXPIRED",
          payments: {
            create: {
              receiptNo: "REC-2026-005",
              amount: 2000,
              paymentDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
              paymentMethod: "CASH",
              paymentType: "MEMBERSHIP_FEE",
              member: { connect: { memberId: "GYM-1005" } },
            },
          },
        },
      },
    },
  });

  console.log("Seeding enquiries...");
  await prisma.enquiry.createMany({
    data: [
      {
        name: "Rohan Kapoor",
        phone: "9988776655",
        email: "rohan.k@gmail.com",
        gender: "Male",
        source: "Walk-in",
        preferredPlan: "Quarterly Pro (3 Months)",
        budget: 5000,
        status: "FOLLOW_UP",
        followUpDate: new Date(),
        notes: "Visited morning, wants morning 6 AM batch with trainer.",
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
        status: "NEW",
        followUpDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        notes: "Inquired via Instagram DM regarding ladies timings & group classes.",
        assignedStaff: "Coach Ananya",
      },
      {
        name: "Deepak Choudhary",
        phone: "9899001122",
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
        name: "Kavita Rao",
        phone: "9845012345",
        gender: "Female",
        source: "Referral",
        preferredPlan: "Personal Training (1 Month)",
        budget: 6000,
        status: "FOLLOW_UP",
        followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        notes: "Referred by Simran Kaur. Interested in posture correction.",
        assignedStaff: "Coach Ananya",
      },
    ],
  });

  console.log("Seed data completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

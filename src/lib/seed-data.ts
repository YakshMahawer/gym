import { prisma } from "./prisma";

export async function seedInitialGymData() {
  const plansCount = await prisma.membershipPlan.count();
  if (plansCount === 0) {
    console.log("Seeding membership plans...");
    await prisma.membershipPlan.createMany({
      data: [
        { name: "Monthly Standard", durationInDays: 30, price: 2000, description: "Full gym floor & cardio access for 1 month" },
        { name: "Quarterly Pro (3 Months)", durationInDays: 90, price: 5000, description: "3 Months full access + 1 free fitness assessment" },
        { name: "Half Yearly Elite (6 Months)", durationInDays: 180, price: 9000, description: "6 Months access + diet chart consultation" },
        { name: "Annual Platinum (12 Months)", durationInDays: 365, price: 15000, description: "1 Year unlimited gym access + locker & spa" },
        { name: "Personal Training (1 Month)", durationInDays: 30, price: 6000, description: "12 One-on-one sessions with certified trainer" },
      ],
    });
  }

  const memberCount = await prisma.member.count();
  if (memberCount === 0) {
    console.log("Seeding demo members and transactions...");
    const plans = await prisma.membershipPlan.findMany();
    const annualPlan = plans.find((p) => p.name.includes("Annual")) || plans[0];
    const quarterlyPlan = plans.find((p) => p.name.includes("Quarterly")) || plans[0];
    const monthlyPlan = plans.find((p) => p.name.includes("Monthly")) || plans[0];

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
        enrollDate: new Date(),
        representative: "Coach Vikram",
        source: "Walk-in",
        isMarried: true,
        spouseName: "Pooja Sharma",
        anniversaryDate: new Date("2020-11-22"),
        occupation: "Software Engineer",
        designation: "Tech Lead",
        programme: "Muscle Gain",
        membershipStatus: "ACTIVE",
      },
    });

    const sub1 = await prisma.memberSubscription.create({
      data: {
        memberId: m1.id,
        planId: annualPlan.id,
        planName: annualPlan.name,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
        paymentMethod: "UPI",
        paymentType: "MEMBERSHIP_FEE",
        notes: "GPay payment received",
      },
    });

    // Member 2: Priya Patel (Has Due Payment)
    const m2 = await prisma.member.create({
      data: {
        memberId: "GYM-1002",
        firstName: "Priya",
        lastName: "Patel",
        fullName: "Priya Patel",
        email: "priya.patel@example.com",
        phone: "9823456789",
        gender: "Female",
        dob: new Date(new Date().getFullYear() - 26, new Date().getMonth(), new Date().getDate() + 2), // Birthday upcoming in 2 days!
        address: "Flat 302, Green Heights",
        enrollDate: new Date(),
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
        planId: quarterlyPlan.id,
        planName: quarterlyPlan.name,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
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
        paymentMethod: "CASH",
        paymentType: "MEMBERSHIP_FEE",
        notes: "Advance 50% paid in cash, balance promised next week",
      },
    });

    // Member 3: Amit Verma (Membership Expiring Soon)
    const m3 = await prisma.member.create({
      data: {
        memberId: "GYM-1003",
        firstName: "Amit",
        lastName: "Verma",
        fullName: "Amit Verma",
        email: "amit.v@example.com",
        phone: "9811223344",
        gender: "Male",
        dob: new Date("1988-08-10"),
        address: "B-12, Civil Lines",
        enrollDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
        representative: "Coach Vikram",
        source: "Referral",
        referredBy: "Rahul Sharma",
        programme: "General Fitness",
        membershipStatus: "ACTIVE",
      },
    });

    await prisma.memberSubscription.create({
      data: {
        memberId: m3.id,
        planId: monthlyPlan.id,
        planName: monthlyPlan.name,
        startDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days left
        totalAmount: 2000,
        paidAmount: 2000,
        dueAmount: 0,
        status: "ACTIVE",
      },
    });

    // Seed Enquiries
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
          notes: "Visited morning, wants morning slot batch with trainer.",
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
          followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          notes: "Inquired via Instagram DM regarding ladies timing and yoga.",
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
          notes: "Scheduled 1-day free trial workout today at 6 PM.",
          assignedStaff: "Coach Vikram",
        },
      ],
    });
  }
}

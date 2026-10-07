import { PrismaClient, EnquiryStatus, PaymentMethod, MembershipStatus, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES_MALE = [
  "Rahul", "Amit", "Vikram", "Rohan", "Aditya", "Karan", "Suresh", "Manish", "Deepak", "Gaurav",
  "Nikhil", "Sachin", "Vishal", "Akash", "Varun", "Abhishek", "Harsh", "Pankaj", "Mohit", "Tarun",
  "Sanjay", "Anil", "Rajesh", "Kunal", "Rajat", "Sumit", "Mayank", "Rishi", "Kartik", "Naveen",
  "Prateek", "Ayush", "Dev", "Alok", "Sameer", "Vivek", "Ashish", "Chirag", "Dinesh", "Manoj"
];

const FIRST_NAMES_FEMALE = [
  "Priya", "Simran", "Ananya", "Neha", "Kavita", "Pooja", "Shreya", "Divya", "Sneha", "Ritu",
  "Tanvi", "Megha", "Sunita", "Aarti", "Komal", "Swati", "Rashmi", "Palak", "Isha", "Bhavna",
  "Anita", "Nisha", "Preeti", "Suman", "Vandana", "Deepika", "Payal", "Geeta", "Jyoti", "Kiran"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Kaur", "Rathore", "Deshmukh", "Mehta", "Gupta", "Choudhary", "Rao",
  "Bhatia", "Malhotra", "Singh", "Joshi", "Bansal", "Saxena", "Agarwal", "Mishra", "Pandey", "Nair",
  "Reddy", "Kapoor", "Chawla", "Bhardwaj", "Tiwari", "Yadav", "Dutta", "Goswami", "Thakur", "Soni"
];

const LOCALITIES = [
  "Sector 14", "Model Town", "Green Park", "Civil Lines", "Urban Estate", "Phase 2",
  "Lakeview Residency", "Sunrise Towers", "Shanti Nagar", "Vasant Kunj", "Mayur Vihar",
  "DLF Phase 4", "South City", "Indirapuram", "Koramangala", "Bandra West", "Jubilee Hills"
];

const OCCUPATIONS = [
  "Software Engineer", "Business Owner", "Chartered Accountant", "Doctor", "Graphic Designer",
  "Marketing Consultant", "College Student", "Lawyer", "Civil Engineer", "Bank Manager",
  "Fitness Trainer", "Sales Manager", "Teacher", "HR Specialist", "Photographer"
];

const PROGRAMMES = [
  "Muscle Gain", "Weight Loss", "General Fitness", "Endurance & Cardio", "Flexibility & Yoga", "Powerlifting", "Personal Training"
];

const COACHES = ["Coach Vikram", "Coach Ananya", "Coach Rahul", "Coach Sam"];
const SOURCES = ["Walk-in", "Instagram", "Google", "Referral", "Facebook Ads", "Flyer / Banner"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padReceiptNo(num: number): string {
  return `REC-${String(num).padStart(5, "0")}`;
}

async function main() {
  console.log("Cleaning database tables...");
  await prisma.payment.deleteMany();
  await prisma.memberSubscription.deleteMany();
  await prisma.memberPT.deleteMany();
  await prisma.member.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.membershipPlan.deleteMany();

  console.log("Seeding standard membership plans...");
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

  const now = new Date();
  let receiptCounter = 1;

  console.log("Seeding 100 bulk members with active, expiring, expired, and pending dues...");
  
  for (let i = 1; i <= 100; i++) {
    const memberIdNum = 1000 + i;
    const isFemale = i % 3 === 0;
    const firstName = isFemale ? randomChoice(FIRST_NAMES_FEMALE) : randomChoice(FIRST_NAMES_MALE);
    const lastName = randomChoice(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const gender = isFemale ? "Female" : "Male";
    const phone = `9${randomInt(100000000, 999999999)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    // Vary enrollment dates (past 180 days to today)
    const enrollDaysAgo = randomInt(1, 180);
    const enrollDate = new Date(now.getTime() - enrollDaysAgo * 24 * 60 * 60 * 1000);

    const isMarried = randomInt(1, 10) > 7;
    const isBirthdayNear = i % 15 === 0;
    const dob = isBirthdayNear
      ? new Date(now.getFullYear() - randomInt(20, 45), now.getMonth(), (now.getDate() + (i % 5)) % 28 + 1)
      : new Date(now.getFullYear() - randomInt(20, 50), randomInt(0, 11), randomInt(1, 28));

    const plan = randomChoice(plans);
    const hasDue = i % 5 === 0; // 20% of members have outstanding dues
    const isExpired = i % 7 === 0 && !hasDue;

    let subStatus: SubscriptionStatus = SubscriptionStatus.ACTIVE;
    let memberStatus: MembershipStatus = MembershipStatus.ACTIVE;
    let startDate = enrollDate;
    let endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    if (isExpired) {
      subStatus = SubscriptionStatus.EXPIRED;
      memberStatus = MembershipStatus.EXPIRED;
      startDate = new Date(now.getTime() - (plan.durationInDays + 20) * 24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);
    }

    const totalAmount = plan.price;
    const paidAmount = hasDue ? Math.round(totalAmount * 0.5) : totalAmount;
    const dueAmount = totalAmount - paidAmount;

    const member = await prisma.member.create({
      data: {
        memberId: String(memberIdNum),
        firstName,
        lastName,
        fullName,
        email,
        phone,
        gender,
        dob,
        address: `Flat ${randomInt(101, 909)}, ${randomChoice(LOCALITIES)}`,
        enrollDate,
        representative: randomChoice(COACHES),
        source: randomChoice(SOURCES),
        isMarried,
        spouseName: isMarried ? `${randomChoice(isFemale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE)} ${lastName}` : null,
        anniversaryDate: isMarried ? new Date(now.getFullYear(), randomInt(0, 11), randomInt(1, 28)) : null,
        occupation: randomChoice(OCCUPATIONS),
        programme: randomChoice(PROGRAMMES),
        membershipStatus: memberStatus,
      },
    });

    const sub = await prisma.memberSubscription.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        planName: plan.name,
        startDate,
        endDate,
        totalAmount,
        paidAmount,
        dueAmount,
        status: subStatus,
      },
    });

    // Create 1st payment
    const paymentMethod: PaymentMethod = randomChoice([
      PaymentMethod.UPI,
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.BANK_TRANSFER,
    ]);

    await prisma.payment.create({
      data: {
        receiptNo: padReceiptNo(receiptCounter++),
        memberId: member.id,
        subscriptionId: sub.id,
        amount: paidAmount,
        paymentDate: startDate,
        paymentMethod,
        paymentType: plan.name.includes("Personal Training")
          ? "PERSONAL_TRAINING"
          : "MEMBERSHIP_FEE",
        notes: hasDue ? "Partial payment received. Balance due shortly." : "Full payment completed.",
      },
    });

    // Add extra secondary renewal/top-up payments for some members
    if (i % 6 === 0 && !hasDue && !isExpired) {
      const extraPayDate = new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      await prisma.payment.create({
        data: {
          receiptNo: padReceiptNo(receiptCounter++),
          memberId: member.id,
          subscriptionId: sub.id,
          amount: randomChoice([1000, 2000, 3000]),
          paymentDate: extraPayDate > now ? now : extraPayDate,
          paymentMethod: PaymentMethod.UPI,
          paymentType: "PERSONAL_TRAINING",
          notes: "PT Add-on & Diet Consultation top-up",
        },
      });
    }
  }

  console.log("Seeding 50 realistic visitor inquiries and leads...");
  const ENQUIRY_STATUSES: EnquiryStatus[] = [
    EnquiryStatus.NEW,
    EnquiryStatus.FOLLOW_UP,
    EnquiryStatus.CONVERTED,
    EnquiryStatus.LOST,
  ];

  for (let j = 1; j <= 50; j++) {
    const isFemale = j % 2 === 0;
    const firstName = isFemale ? randomChoice(FIRST_NAMES_FEMALE) : randomChoice(FIRST_NAMES_MALE);
    const lastName = randomChoice(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const phone = `9${randomInt(100000000, 999999999)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${j}@gmail.com`;
    const plan = randomChoice(plans);
    const status = randomChoice(ENQUIRY_STATUSES);
    const daysOffset = randomInt(-10, 15);
    const followUpDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    await prisma.enquiry.create({
      data: {
        name: fullName,
        phone,
        email,
        gender: isFemale ? "Female" : "Male",
        source: randomChoice(SOURCES),
        preferredPlan: plan.name,
        budget: plan.price,
        status,
        followUpDate: status === EnquiryStatus.LOST ? null : followUpDate,
        notes:
          status === EnquiryStatus.FOLLOW_UP
            ? "Requested evening batch callback. Interested in cardio zone."
            : status === EnquiryStatus.CONVERTED
            ? "Enrolled successfully into gym plan."
            : status === EnquiryStatus.LOST
            ? "Looking for early morning 5 AM timing which is currently full."
            : "First time gym enquiry. Scheduled workout demo.",
        assignedStaff: randomChoice(COACHES),
      },
    });
  }

  console.log(`Successfully seeded:
  - ${plans.length} Membership Plans
  - 100 Members (IDs 1001-1100)
  - ${receiptCounter - 1} Payments with 5-digit receipts (REC-00001 to ${padReceiptNo(receiptCounter - 1)})
  - 50 Enquiries & Leads with active follow-ups`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

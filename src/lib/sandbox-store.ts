import fs from "fs";
import path from "path";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subMonths } from "date-fns";
import { extractNumericId, normalizeMemberId, formatInvoiceNo } from "@/lib/utils";

const SANDBOX_FILE_PATH = path.join(process.cwd(), "prisma", "developer_sandbox.json");

export interface SandboxData {
  members: any[];
  subscriptions: any[];
  ptSubscriptions: any[];
  payments: any[];
  enquiries: any[];
  plans: any[];
  trainers: any[];
  scheduledWhatsApp: any[];
}

function getInitialSeedData(): SandboxData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  // Create date helpers relative to today
  const dToday = new Date(currentYear, currentMonth, todayDate, 10, 0, 0);
  const d3DaysAgo = new Date(currentYear, currentMonth, todayDate - 3, 11, 30, 0);
  const d10DaysAgo = new Date(currentYear, currentMonth, todayDate - 10, 14, 0, 0);
  const d20DaysAgo = new Date(currentYear, currentMonth, todayDate - 20, 17, 0, 0);
  const d2MonthsAgo = new Date(currentYear, currentMonth - 2, 5, 9, 30, 0);
  const d4MonthsAgo = new Date(currentYear, currentMonth - 4, 1, 10, 0, 0);
  
  // Future dates
  const dIn3Days = new Date(currentYear, currentMonth, todayDate + 3, 23, 59, 59);
  const dIn10Days = new Date(currentYear, currentMonth, todayDate + 10, 23, 59, 59);
  const dIn40Days = new Date(currentYear, currentMonth + 1, todayDate + 10, 23, 59, 59);
  const dIn6Months = new Date(currentYear, currentMonth + 6, todayDate, 23, 59, 59);
  const dIn1Year = new Date(currentYear + 1, currentMonth, todayDate, 23, 59, 59);

  // Birthday today / soon
  const bdayToday = new Date(1998, currentMonth, todayDate, 0, 0, 0);
  const bdayIn3Days = new Date(1995, currentMonth, todayDate + 3, 0, 0, 0);

  const initialPlans = [
    { id: "dev-plan-1", name: "1 Month", price: 4000, durationInDays: 30, category: "GYM", sessions: null, description: "1 Month regular gym access", isActive: true },
    { id: "dev-plan-2", name: "3 Months", price: 9000, durationInDays: 90, category: "GYM", sessions: null, description: "3 Months regular gym access", isActive: true },
    { id: "dev-plan-3", name: "6 Months (Regular)", price: 15000, durationInDays: 180, category: "GYM", sessions: null, description: "6 Months regular membership", isActive: true },
    { id: "dev-plan-4", name: "1 Year (Males)", price: 25000, durationInDays: 365, category: "GYM", sessions: null, description: "1 Year full membership (Males)", isActive: true },
    { id: "dev-plan-5", name: "Happy Hours Offer", price: 18000, durationInDays: 365, category: "GYM", sessions: null, description: "Special afternoon slot annual membership", isActive: true },
    { id: "dev-plan-6", name: "1 Year (Female)", price: 23000, durationInDays: 365, category: "GYM", sessions: null, description: "1 Year membership (Female concession)", isActive: true },
    { id: "dev-plan-7", name: "1 Year (Student)", price: 23000, durationInDays: 365, category: "GYM", sessions: null, description: "1 Year membership (Student concession)", isActive: true },
    { id: "dev-plan-8", name: "1 Month PT (12 Sessions)", price: 6000, durationInDays: 30, category: "PT", sessions: 12, description: "12 One-on-one sessions in 1 month", isActive: true },
    { id: "dev-plan-9", name: "3 Months PT (36 Sessions)", price: 16500, durationInDays: 90, category: "PT", sessions: 36, description: "36 PT sessions across 3 months", isActive: true },
    { id: "dev-plan-10", name: "Dietitian Nutrition Plan", price: 2500, durationInDays: 30, category: "OTHER", sessions: null, description: "Personalized sports nutrition and diet chart", isActive: true },
  ];

  const initialTrainers = [
    { id: "dev-tr-1", name: "Coach Vikram", specialty: "Strength & Conditioning", phone: "9825100001", isActive: true },
    { id: "dev-tr-2", name: "Coach Rahul", specialty: "Hypertrophy & Fat Loss", phone: "9825100002", isActive: true },
    { id: "dev-tr-3", name: "Coach Priya", specialty: "Mobility & Functional Training", phone: "9825100003", isActive: true },
    { id: "dev-tr-4", name: "Head Coach Aman", specialty: "Master Trainer & Kinesiology", phone: "9825100004", isActive: true },
  ];

  const initialMembers = [
    {
      id: "dev-mem-1",
      memberId: "1001",
      firstName: "Arjun",
      lastName: "Verma",
      fullName: "Arjun Verma",
      email: "arjun.verma@example.com",
      phone: "9825011111",
      gender: "Male",
      dob: new Date(1996, 5, 14).toISOString(),
      address: "B-201, Samarth Heights, Manjalpur, Vadodara",
      enrollDate: d4MonthsAgo.toISOString(),
      representative: "Coach Vikram",
      referredBy: "Self / Instagram",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Software Engineer",
      designation: "Tech Lead",
      source: "Instagram",
      phoneOffice: null,
      phoneResidence: null,
      programme: "General Fitness",
      notes: "Dev Sandbox sample active annual member with PT",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-mem-2",
      memberId: "1002",
      firstName: "Rohan",
      lastName: "Mehta",
      fullName: "Rohan Mehta",
      email: "rohan.mehta@example.com",
      phone: "9825022222",
      gender: "Male",
      dob: new Date(1999, 8, 22).toISOString(),
      address: "12, Shanti Nagar, Makarpura, Vadodara",
      enrollDate: d20DaysAgo.toISOString(),
      representative: "Coach Rahul",
      referredBy: "Friend",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Chartered Accountant",
      designation: "Associate",
      source: "Walk-in",
      phoneOffice: null,
      phoneResidence: null,
      programme: "General Fitness",
      notes: "Has pending ₹2,000 due payment (Paid ₹7,000 of ₹9,000)",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-mem-3",
      memberId: "1003",
      firstName: "Pooja",
      lastName: "Patel",
      fullName: "Pooja Patel",
      email: "pooja.patel@example.com",
      phone: "9825033333",
      gender: "Female",
      dob: bdayToday.toISOString(), // Birthday TODAY!
      address: "C-44, Surya Greens, Vasna Road, Vadodara",
      enrollDate: d2MonthsAgo.toISOString(),
      representative: "Coach Priya",
      referredBy: "Google Search",
      isMarried: true,
      spouseName: "Kunal Patel",
      spouseBirthDate: new Date(1994, 2, 10).toISOString(),
      anniversaryDate: bdayIn3Days.toISOString(),
      occupation: "Architect",
      designation: "Partner",
      source: "Google Search",
      phoneOffice: null,
      phoneResidence: null,
      programme: "Fat Loss & Conditioning",
      notes: "Birthday is today! Test birthday banner and greeting trigger.",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-mem-4",
      memberId: "1004",
      firstName: "Karan",
      lastName: "Shah",
      fullName: "Karan Shah",
      email: "karan.shah@example.com",
      phone: "9825044444",
      gender: "Male",
      dob: new Date(1992, 11, 5).toISOString(),
      address: "Flat 101, Nilamber Bellissimo, Gotri, Vadodara",
      enrollDate: d20DaysAgo.toISOString(),
      representative: "Coach Rahul",
      referredBy: "Walk-in",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Businessman",
      designation: "Owner",
      source: "Walk-in",
      phoneOffice: null,
      phoneResidence: null,
      programme: "Muscle Gain",
      notes: "Expiring in 3 days! Test expiry alerts and renewal flows.",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-mem-5",
      memberId: "1005",
      firstName: "Simran",
      lastName: "Kaur",
      fullName: "Simran Kaur",
      email: "simran.kaur@example.com",
      phone: "9825055555",
      gender: "Female",
      dob: new Date(1997, 3, 19).toISOString(),
      address: "15, Royal Palms, Sevasi, Vadodara",
      enrollDate: d4MonthsAgo.toISOString(),
      representative: "Coach Priya",
      referredBy: "Friend",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Dentist",
      designation: "Clinician",
      source: "Referral",
      phoneOffice: null,
      phoneResidence: null,
      programme: "General Fitness",
      notes: "Expired membership. Test re-activation / renewal.",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "EXPIRED",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-mem-6",
      memberId: "1006",
      firstName: "Aditya",
      lastName: "Joshi",
      fullName: "Aditya Joshi",
      email: "aditya.joshi@example.com",
      phone: "9825066666",
      gender: "Male",
      dob: new Date(2003, 7, 28).toISOString(),
      address: "Hostel Block 3, MS University, Vadodara",
      enrollDate: d3DaysAgo.toISOString(),
      representative: "Coach Vikram",
      referredBy: "College Group",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Student",
      designation: "Engineering Final Year",
      source: "Referral",
      phoneOffice: null,
      phoneResidence: null,
      programme: "Strength Training",
      notes: "Student discount package, newly registered.",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
    {
      id: "dev-mem-7",
      memberId: "1007",
      firstName: "Neha",
      lastName: "Sharma",
      fullName: "Neha Sharma",
      email: "neha.sharma@example.com",
      phone: "9825077777",
      gender: "Female",
      dob: new Date(1995, 9, 8).toISOString(),
      address: "302, Silver Leaf, Akota, Vadodara",
      enrollDate: d10DaysAgo.toISOString(),
      representative: "Coach Priya",
      referredBy: "Walk-in",
      isMarried: false,
      spouseName: null,
      spouseBirthDate: null,
      anniversaryDate: null,
      occupation: "Marketing Specialist",
      designation: "Manager",
      source: "Walk-in",
      phoneOffice: null,
      phoneResidence: null,
      programme: "General Fitness",
      notes: "Enrolled profile without active plan (Inactive status).",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "INACTIVE",
      createdAt: d10DaysAgo.toISOString(),
      updatedAt: d10DaysAgo.toISOString(),
    },
    {
      id: "dev-mem-8",
      memberId: "1008",
      firstName: "Vikram",
      lastName: "Malhotra",
      fullName: "Vikram Malhotra",
      email: "vikram.malhotra@example.com",
      phone: "9825088888",
      gender: "Male",
      dob: new Date(1989, 4, 30).toISOString(),
      address: "Row House 7, Kalali, Vadodara",
      enrollDate: d2MonthsAgo.toISOString(),
      representative: "Head Coach Aman",
      referredBy: "Corporate Gym Program",
      isMarried: true,
      spouseName: "Ritu Malhotra",
      spouseBirthDate: new Date(1991, 10, 12).toISOString(),
      anniversaryDate: new Date(2018, 11, 15).toISOString(),
      occupation: "Senior Director",
      designation: "Pharma Executive",
      source: "Corporate",
      phoneOffice: null,
      phoneResidence: null,
      programme: "Personal Training",
      notes: "VIP Client with 36 PT sessions package.",
      qFaintOrDizzy: false,
      qChestPain: false,
      qRecentChestPain: false,
      qBloodPressureHeart: false,
      qDiabetes: false,
      qJointBoneProblem: false,
      qPregnant: false,
      qOver65: false,
      qOtherHealthIssues: null,
      membershipStatus: "ACTIVE",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
  ];

  const initialSubscriptions = [
    {
      id: "dev-sub-1",
      memberId: "dev-mem-1",
      planId: "dev-plan-4",
      planName: "1 Year (Males)",
      startDate: d4MonthsAgo.toISOString(),
      endDate: dIn1Year.toISOString(),
      totalAmount: 25000,
      paidAmount: 25000,
      dueAmount: 0,
      status: "ACTIVE",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-sub-2",
      memberId: "dev-mem-2",
      planId: "dev-plan-2",
      planName: "3 Months",
      startDate: d20DaysAgo.toISOString(),
      endDate: dIn40Days.toISOString(),
      totalAmount: 9000,
      paidAmount: 7000,
      dueAmount: 2000,
      status: "ACTIVE",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-sub-3",
      memberId: "dev-mem-3",
      planId: "dev-plan-3",
      planName: "6 Months (Regular)",
      startDate: d2MonthsAgo.toISOString(),
      endDate: dIn6Months.toISOString(),
      totalAmount: 15000,
      paidAmount: 15000,
      dueAmount: 0,
      status: "ACTIVE",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-sub-4",
      memberId: "dev-mem-4",
      planId: "dev-plan-1",
      planName: "1 Month",
      startDate: d20DaysAgo.toISOString(),
      endDate: dIn3Days.toISOString(), // Expiring in 3 days!
      totalAmount: 4000,
      paidAmount: 4000,
      dueAmount: 0,
      status: "ACTIVE",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-sub-5",
      memberId: "dev-mem-5",
      planId: "dev-plan-1",
      planName: "1 Month",
      startDate: d4MonthsAgo.toISOString(),
      endDate: d10DaysAgo.toISOString(), // Expired 10 days ago!
      totalAmount: 4000,
      paidAmount: 4000,
      dueAmount: 0,
      status: "EXPIRED",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-sub-6",
      memberId: "dev-mem-6",
      planId: "dev-plan-7",
      planName: "1 Year (Student)",
      startDate: d3DaysAgo.toISOString(),
      endDate: dIn1Year.toISOString(),
      totalAmount: 23000,
      paidAmount: 23000,
      dueAmount: 0,
      status: "ACTIVE",
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
    {
      id: "dev-sub-8",
      memberId: "dev-mem-8",
      planId: "dev-plan-2",
      planName: "3 Months",
      startDate: d2MonthsAgo.toISOString(),
      endDate: dIn40Days.toISOString(),
      totalAmount: 9000,
      paidAmount: 9000,
      dueAmount: 0,
      status: "ACTIVE",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
  ];

  const initialPTs = [
    {
      id: "dev-pt-1",
      memberId: "dev-mem-1",
      planName: "3 Months PT (36 Sessions)",
      trainerName: "Coach Vikram",
      totalSessions: 36,
      completedSessions: 16,
      startDate: d2MonthsAgo.toISOString(),
      endDate: dIn40Days.toISOString(),
      totalAmount: 16500,
      paidAmount: 16500,
      dueAmount: 0,
      status: "ACTIVE",
      notes: "Focusing on bench press and squat form",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-pt-8",
      memberId: "dev-mem-8",
      planName: "3 Months PT (36 Sessions)",
      trainerName: "Head Coach Aman",
      totalSessions: 36,
      completedSessions: 22,
      startDate: d2MonthsAgo.toISOString(),
      endDate: dIn40Days.toISOString(),
      totalAmount: 16500,
      paidAmount: 16500,
      dueAmount: 0,
      status: "ACTIVE",
      notes: "Posture correction & lower back strengthening",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
  ];

  const initialPayments = [
    {
      id: "dev-pay-1",
      receiptNo: "00001",
      memberId: "dev-mem-1",
      subscriptionId: "dev-sub-1",
      ptId: null,
      amount: 25000,
      paymentDate: d4MonthsAgo.toISOString(),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Full year membership fee paid via GPay",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-2",
      receiptNo: "00002",
      memberId: "dev-mem-1",
      subscriptionId: null,
      ptId: "dev-pt-1",
      amount: 16500,
      paymentDate: d2MonthsAgo.toISOString(),
      paymentMethod: "UPI",
      paymentType: "PERSONAL_TRAINING",
      notes: "PT with Coach Vikram",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-3",
      receiptNo: "00003",
      memberId: "dev-mem-2",
      subscriptionId: "dev-sub-2",
      ptId: null,
      amount: 7000,
      paymentDate: d20DaysAgo.toISOString(),
      paymentMethod: "CASH",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Initial part payment. Balance ₹2,000 pending due.",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-pay-4",
      receiptNo: "00004",
      memberId: "dev-mem-3",
      subscriptionId: "dev-sub-3",
      ptId: null,
      amount: 15000,
      paymentDate: d2MonthsAgo.toISOString(),
      paymentMethod: "CARD",
      paymentType: "MEMBERSHIP_FEE",
      notes: "HDFC POS terminal swipe",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-5",
      receiptNo: "00005",
      memberId: "dev-mem-4",
      subscriptionId: "dev-sub-4",
      ptId: null,
      amount: 4000,
      paymentDate: d20DaysAgo.toISOString(),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "1 Month membership fee via PhonePe",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
    {
      id: "dev-pay-6",
      receiptNo: "00006",
      memberId: "dev-mem-5",
      subscriptionId: "dev-sub-5",
      ptId: null,
      amount: 4000,
      paymentDate: d4MonthsAgo.toISOString(),
      paymentMethod: "CASH",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Cash receipt",
      createdAt: d4MonthsAgo.toISOString(),
      updatedAt: d4MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-7",
      receiptNo: "00007",
      memberId: "dev-mem-6",
      subscriptionId: "dev-sub-6",
      ptId: null,
      amount: 23000,
      paymentDate: d3DaysAgo.toISOString(),
      paymentMethod: "BANK_TRANSFER",
      notes: "Student annual plan NEFT transfer",
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
    {
      id: "dev-pay-8",
      receiptNo: "00008",
      memberId: "dev-mem-8",
      subscriptionId: "dev-sub-8",
      ptId: null,
      amount: 9000,
      paymentDate: d2MonthsAgo.toISOString(),
      paymentMethod: "UPI",
      paymentType: "MEMBERSHIP_FEE",
      notes: "Gym 3 months fee",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-9",
      receiptNo: "00009",
      memberId: "dev-mem-8",
      subscriptionId: null,
      ptId: "dev-pt-8",
      amount: 16500,
      paymentDate: d2MonthsAgo.toISOString(),
      paymentMethod: "UPI",
      paymentType: "PERSONAL_TRAINING",
      notes: "Personal training with Head Coach Aman",
      createdAt: d2MonthsAgo.toISOString(),
      updatedAt: d2MonthsAgo.toISOString(),
    },
    {
      id: "dev-pay-10",
      receiptNo: "00010",
      memberId: "dev-mem-1",
      subscriptionId: null,
      ptId: null,
      amount: 2500,
      paymentDate: dToday.toISOString(),
      paymentMethod: "UPI",
      paymentType: "OTHER",
      notes: "Dietitian Nutrition Plan Add-on",
      createdAt: dToday.toISOString(),
      updatedAt: dToday.toISOString(),
    },
  ];

  const initialEnquiries = [
    {
      id: "dev-enq-1",
      name: "Rajesh Nair",
      phone: "9898011223",
      email: "rajesh.nair@example.com",
      gender: "Male",
      source: "Walk-in",
      preferredPlan: "1 Year (Males)",
      budget: 25000,
      followUpDate: dToday.toISOString(),
      status: "FOLLOW_UP",
      notes: "Interested in annual package; follow up today afternoon.",
      assignedStaff: "Coach Vikram",
      convertedMemberId: null,
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
    {
      id: "dev-enq-2",
      name: "Kavita Desai",
      phone: "9898022334",
      email: "kavita.desai@example.com",
      gender: "Female",
      source: "Instagram",
      preferredPlan: "3 Months",
      budget: 9000,
      followUpDate: dIn3Days.toISOString(),
      status: "NEW",
      notes: "Asked about ladies slots and evening timings.",
      assignedStaff: "Coach Priya",
      convertedMemberId: null,
      createdAt: dToday.toISOString(),
      updatedAt: dToday.toISOString(),
    },
    {
      id: "dev-enq-3",
      name: "Manish Tiwari",
      phone: "9898033445",
      email: null,
      gender: "Male",
      source: "Walk-in",
      preferredPlan: "1 Month PT (12 Sessions)",
      budget: 10000,
      followUpDate: dIn3Days.toISOString(),
      status: "TRIAL_SCHEDULED",
      notes: "Scheduled trial workout with Coach Rahul on Friday 7 PM.",
      assignedStaff: "Coach Rahul",
      convertedMemberId: null,
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
    {
      id: "dev-enq-4",
      name: "Sunita Rao",
      phone: "9898044556",
      email: "sunita.rao@example.com",
      gender: "Female",
      source: "Referral",
      preferredPlan: "Happy Hours Offer",
      budget: 18000,
      followUpDate: null,
      status: "CONVERTED",
      notes: "Converted to member successfully.",
      assignedStaff: "Coach Priya",
      convertedMemberId: "dev-mem-3",
      createdAt: d20DaysAgo.toISOString(),
      updatedAt: d20DaysAgo.toISOString(),
    },
  ];

  const initialScheduledWhatsApp = [
    {
      id: "dev-sch-1",
      memberId: null,
      enquiryId: "dev-enq-1",
      recipientName: "Rajesh Nair",
      recipientPhone: "9898011223",
      templateName: "customer_followup_update",
      variables: JSON.stringify(["Rajesh Nair", "1 Year (Males)"]),
      offerDate: null,
      scheduledFor: dToday.toISOString(),
      status: "PENDING",
      sentAt: null,
      sentBy: "developer",
      error: null,
      createdAt: d3DaysAgo.toISOString(),
      updatedAt: d3DaysAgo.toISOString(),
    },
  ];

  return {
    members: initialMembers,
    subscriptions: initialSubscriptions,
    ptSubscriptions: initialPTs,
    payments: initialPayments,
    enquiries: initialEnquiries,
    plans: initialPlans,
    trainers: initialTrainers,
    scheduledWhatsApp: initialScheduledWhatsApp,
  };
}

class SandboxStore {
  private data: SandboxData | null = null;

  private load(): SandboxData {
    if (this.data) return this.data;

    try {
      if (fs.existsSync(SANDBOX_FILE_PATH)) {
        const raw = fs.readFileSync(SANDBOX_FILE_PATH, "utf-8");
        this.data = JSON.parse(raw);
        return this.data!;
      }
    } catch (e) {
      console.warn("Could not read sandbox database file, re-initializing:", e);
    }

    const initial = getInitialSeedData();
    this.data = initial;
    this.save();
    return this.data;
  }

  private save(): void {
    if (!this.data) return;
    try {
      const dir = path.dirname(SANDBOX_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SANDBOX_FILE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save sandbox data:", e);
    }
  }

  public reset(): SandboxData {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // --- MEMBERS ---

  public getMembers(filters?: { search?: string; status?: string; ptStatus?: string; hasDue?: boolean }) {
    const data = this.load();
    const now = new Date();

    let list = data.members.map((m) => {
      const subs = data.subscriptions
        .filter((s) => s.memberId === m.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const pts = data.ptSubscriptions
        .filter((pt) => pt.memberId === m.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        ...m,
        subscriptions: subs.slice(0, 1),
        ptSubscriptions: pts.slice(0, 1),
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      list = list.filter((m) =>
        m.fullName.toLowerCase().includes(term) ||
        m.phone.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term))
      );
    }

    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "ACTIVE") {
        list = list.filter((m) =>
          m.subscriptions.some((s: any) => s.status === "ACTIVE" && new Date(s.endDate).getTime() >= now.getTime())
        );
      } else if (filters.status === "EXPIRED") {
        list = list.filter((m) =>
          m.membershipStatus === "EXPIRED" ||
          (m.subscriptions.length > 0 &&
            m.subscriptions.every((s: any) => new Date(s.endDate).getTime() < now.getTime()))
        );
      } else if (filters.status === "INACTIVE") {
        list = list.filter((m) => m.membershipStatus === "INACTIVE" || m.subscriptions.length === 0);
      }
    }

    if (filters?.ptStatus && filters.ptStatus !== "ALL") {
      if (filters.ptStatus === "ACTIVE_PT") {
        list = list.filter((m) =>
          m.ptSubscriptions.some((pt: any) => pt.status === "ACTIVE" && new Date(pt.endDate).getTime() >= now.getTime())
        );
      } else if (filters.ptStatus === "EXPIRED_PT") {
        list = list.filter((m) =>
          m.ptSubscriptions.some((pt: any) => pt.status === "EXPIRED" || new Date(pt.endDate).getTime() < now.getTime())
        );
      } else if (filters.ptStatus === "NO_PT") {
        list = list.filter((m) => m.ptSubscriptions.length === 0);
      }
    }

    if (filters?.hasDue) {
      list = list.filter((m) =>
        m.subscriptions.some((s: any) => s.dueAmount > 0) ||
        m.ptSubscriptions.some((pt: any) => pt.dueAmount > 0)
      );
    }

    list.sort((a, b) => {
      const numA = extractNumericId(a.memberId) || 0;
      const numB = extractNumericId(b.memberId) || 0;
      return numB - numA;
    });

    return list;
  }

  public getMembersLookup() {
    const data = this.load();
    const list = data.members.map((m) => ({
      id: m.id,
      memberId: normalizeMemberId(m.memberId),
      fullName: m.fullName,
      phone: m.phone,
    }));

    list.sort((a, b) => {
      const numA = extractNumericId(a.memberId) || 0;
      const numB = extractNumericId(b.memberId) || 0;
      return numB - numA;
    });

    return list;
  }

  public getMemberById(id: string) {
    if (!id) return null;
    const data = this.load();
    const decoded = decodeURIComponent(id).trim();
    const normalized = normalizeMemberId(decoded);

    const member = data.members.find(
      (m) => m.id === decoded || m.memberId === decoded || m.memberId === normalized
    );

    if (!member) return null;

    const subscriptions = data.subscriptions
      .filter((s) => s.memberId === member.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const ptSubscriptions = data.ptSubscriptions
      .filter((pt) => pt.memberId === member.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const payments = data.payments
      .filter((p) => p.memberId === member.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return {
      ...member,
      subscriptions,
      ptSubscriptions,
      payments,
    };
  }

  public getNextMemberId(): string {
    const data = this.load();
    let max = 1000;
    for (const m of data.members) {
      const num = extractNumericId(m.memberId);
      if (num !== null && num > max) {
        max = num;
      }
    }
    return String(max + 1);
  }

  public createMember(input: any) {
    const data = this.load();
    let desiredId = input.memberId?.trim();
    if (!desiredId) {
      desiredId = this.getNextMemberId();
    } else {
      desiredId = normalizeMemberId(desiredId);
      if (data.members.some((m) => m.memberId === desiredId)) {
        return {
          success: false,
          error: `Member ID "${desiredId}" is already taken in sandbox.`,
        };
      }
    }

    const now = new Date();
    const id = `dev-mem-${Date.now()}`;
    const fullName = `${input.firstName.trim()} ${input.lastName ? input.lastName.trim() : ""}`.trim();
    const hasValidPlan = Boolean(input.planName && input.planName.trim() && input.totalAmount && Number(input.totalAmount) > 0);

    const newMember = {
      id,
      memberId: desiredId,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      fullName,
      email: input.email?.trim() || null,
      phone: input.phone.trim(),
      gender: input.gender || "Male",
      dob: input.dob ? new Date(input.dob).toISOString() : null,
      address: input.address || null,
      enrollDate: input.enrollDate ? new Date(input.enrollDate).toISOString() : now.toISOString(),
      representative: input.representative || null,
      referredBy: input.referredBy || null,
      isMarried: Boolean(input.isMarried),
      spouseName: input.spouseName || null,
      spouseBirthDate: input.spouseBirthDate ? new Date(input.spouseBirthDate).toISOString() : null,
      anniversaryDate: input.anniversaryDate ? new Date(input.anniversaryDate).toISOString() : null,
      occupation: input.occupation || null,
      designation: input.designation || null,
      source: input.source || "Walk-in",
      phoneOffice: input.phoneOffice || null,
      phoneResidence: input.phoneResidence || null,
      programme: input.programme || "General Fitness",
      notes: input.notes || null,
      qFaintOrDizzy: Boolean(input.qFaintOrDizzy),
      qChestPain: Boolean(input.qChestPain),
      qRecentChestPain: Boolean(input.qRecentChestPain),
      qBloodPressureHeart: Boolean(input.qBloodPressureHeart),
      qDiabetes: Boolean(input.qDiabetes),
      qJointBoneProblem: Boolean(input.qJointBoneProblem),
      qPregnant: Boolean(input.qPregnant),
      qOver65: Boolean(input.qOver65),
      qOtherHealthIssues: input.qOtherHealthIssues || null,
      membershipStatus: hasValidPlan ? "ACTIVE" : "INACTIVE",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    data.members.push(newMember);

    let subscription = null;
    let payment = null;

    if (hasValidPlan) {
      const totalAmount = Number(input.totalAmount);
      const paidAmount = Number(input.paidAmount || 0);
      const dueAmount = Math.max(0, totalAmount - paidAmount);
      const startDate = input.startDate ? new Date(input.startDate) : now;
      const endDate = input.endDate ? new Date(input.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscription = {
        id: `dev-sub-${Date.now()}`,
        memberId: id,
        planId: input.planId || null,
        planName: input.planName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount,
        paidAmount,
        dueAmount,
        status: "ACTIVE",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      data.subscriptions.push(subscription);

      if (paidAmount > 0) {
        const receiptNo = input.receiptNo?.trim() || this.getNextSequentialReceiptNo(now);
        payment = {
          id: `dev-pay-${Date.now()}`,
          receiptNo,
          memberId: id,
          subscriptionId: subscription.id,
          ptId: null,
          amount: paidAmount,
          paymentDate: now.toISOString(),
          paymentMethod: input.paymentMethod || "UPI",
          paymentType: "MEMBERSHIP_FEE",
          notes: input.paymentNotes || null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        data.payments.push(payment);
      }
    }

    this.save();
    return { success: true, member: newMember, subscription, payment };
  }

  public updateMember(id: string, input: any) {
    const data = this.load();
    const idx = data.members.findIndex((m) => m.id === id || m.memberId === id);
    if (idx === -1) {
      return { success: false, error: "Member not found in sandbox" };
    }

    const existing = data.members[idx];
    const updated = {
      ...existing,
      firstName: input.firstName !== undefined ? input.firstName.trim() : existing.firstName,
      lastName: input.lastName !== undefined ? (input.lastName?.trim() || null) : existing.lastName,
      fullName: `${input.firstName || existing.firstName} ${input.lastName || existing.lastName || ""}`.trim(),
      email: input.email !== undefined ? (input.email?.trim() || null) : existing.email,
      phone: input.phone !== undefined ? input.phone.trim() : existing.phone,
      gender: input.gender || existing.gender,
      dob: input.dob ? new Date(input.dob).toISOString() : existing.dob,
      address: input.address !== undefined ? input.address : existing.address,
      representative: input.representative !== undefined ? input.representative : existing.representative,
      referredBy: input.referredBy !== undefined ? input.referredBy : existing.referredBy,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    data.members[idx] = updated;
    this.save();
    return { success: true, member: updated };
  }

  public renewSubscription(input: any) {
    const data = this.load();
    const member = data.members.find((m) => m.id === input.memberId);
    if (!member) {
      return { success: false, error: "Member not found in sandbox" };
    }

    const now = new Date();
    const totalAmount = Number(input.totalAmount);
    const paidAmount = Number(input.paidAmount || 0);
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const startDate = input.startDate ? new Date(input.startDate) : now;
    const endDate = input.endDate ? new Date(input.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = {
      id: `dev-sub-${Date.now()}`,
      memberId: input.memberId,
      planId: input.planId || null,
      planName: input.planName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalAmount,
      paidAmount,
      dueAmount,
      status: "ACTIVE",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    data.subscriptions.push(subscription);

    // Update member status
    member.membershipStatus = "ACTIVE";

    let payment = null;
    if (paidAmount > 0) {
      const receiptNo = input.receiptNo?.trim() || this.getNextSequentialReceiptNo(now);
      payment = {
        id: `dev-pay-${Date.now()}`,
        receiptNo,
        memberId: input.memberId,
        subscriptionId: subscription.id,
        ptId: null,
        amount: paidAmount,
        paymentDate: now.toISOString(),
        paymentMethod: input.paymentMethod || "UPI",
        paymentType: "MEMBERSHIP_FEE",
        notes: input.paymentNotes || "Subscription renewal",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      data.payments.push(payment);
    }

    this.save();
    return { success: true, subscription, payment };
  }

  public deleteMember(id: string) {
    const data = this.load();
    const memberIdx = data.members.findIndex((m) => m.id === id || m.memberId === id);
    if (memberIdx === -1) {
      return { success: false, error: "Member not found in sandbox" };
    }

    const memberId = data.members[memberIdx].id;
    data.members.splice(memberIdx, 1);
    data.subscriptions = data.subscriptions.filter((s) => s.memberId !== memberId);
    data.ptSubscriptions = data.ptSubscriptions.filter((pt) => pt.memberId !== memberId);
    data.payments = data.payments.filter((p) => p.memberId !== memberId);

    this.save();
    return { success: true };
  }

  // --- PAYMENTS & DUES ---

  public getNextSequentialReceiptNo(dateInput?: Date | string): string {
    const data = this.load();
    let max = 0;
    for (const p of data.payments) {
      const num = parseInt(p.receiptNo.replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
    return String(max + 1).padStart(5, "0");
  }

  public getPayments(filters?: { search?: string; method?: string; type?: string; limit?: number }) {
    const data = this.load();
    let list = data.payments.map((p) => {
      const member = data.members.find((m) => m.id === p.memberId);
      const sub = p.subscriptionId ? data.subscriptions.find((s) => s.id === p.subscriptionId) : null;
      const pt = p.ptId ? data.ptSubscriptions.find((pt) => pt.id === p.ptId) : null;

      return {
        ...p,
        paymentDate: new Date(p.paymentDate),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        member: member
          ? {
              id: member.id,
              memberId: member.memberId,
              fullName: member.fullName,
              phone: member.phone,
              subscriptions: sub ? [sub] : [],
              ptSubscriptions: pt ? [pt] : [],
            }
          : { id: p.memberId, memberId: "-", fullName: "Unknown Member", phone: "-" },
        subscription: sub,
        ptSubscription: pt,
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.receiptNo.toLowerCase().includes(term) ||
          p.member.fullName.toLowerCase().includes(term) ||
          p.member.phone.toLowerCase().includes(term) ||
          p.member.memberId.toLowerCase().includes(term)
      );
    }

    if (filters?.method && filters.method !== "ALL") {
      list = list.filter((p) => p.paymentMethod === filters.method);
    }

    if (filters?.type && filters.type !== "ALL") {
      list = list.filter((p) => p.paymentType === filters.type);
    }

    list.sort((a, b) => b.receiptNo.localeCompare(a.receiptNo, undefined, { numeric: true, sensitivity: "base" }));

    return filters?.limit ? list.slice(0, filters.limit) : list;
  }

  public addPayment(input: any) {
    const data = this.load();
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than 0" };
    }

    const now = input.paymentDate ? new Date(input.paymentDate) : new Date();
    const receiptNo = input.receiptNo?.trim() || this.getNextSequentialReceiptNo(now);

    let targetSubId = input.subscriptionId;
    let targetPtId = input.ptId;

    if (input.paymentType === "OTHER") {
      targetSubId = null;
      targetPtId = null;
    } else if (!targetSubId && !targetPtId) {
      const subWithDue = data.subscriptions.find((s) => s.memberId === input.memberId && s.dueAmount > 0);
      if (subWithDue) {
        targetSubId = subWithDue.id;
      } else {
        const ptWithDue = data.ptSubscriptions.find((pt) => pt.memberId === input.memberId && pt.dueAmount > 0);
        if (ptWithDue) {
          targetPtId = ptWithDue.id;
        }
      }
    }

    const newPayment = {
      id: `dev-pay-${Date.now()}`,
      receiptNo,
      memberId: input.memberId,
      subscriptionId: targetSubId || null,
      ptId: targetPtId || null,
      amount,
      paymentDate: now.toISOString(),
      paymentMethod: input.paymentMethod || "UPI",
      paymentType: input.paymentType || (targetPtId ? "PERSONAL_TRAINING" : "DUE_CLEARANCE"),
      notes: input.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.payments.push(newPayment);

    // Update dues if linked
    if (targetSubId) {
      const sub = data.subscriptions.find((s) => s.id === targetSubId);
      if (sub) {
        sub.paidAmount += amount;
        sub.dueAmount = Math.max(0, sub.dueAmount - amount);
        sub.updatedAt = new Date().toISOString();
      }
    }

    if (targetPtId) {
      const pt = data.ptSubscriptions.find((pt) => pt.id === targetPtId);
      if (pt) {
        pt.paidAmount += amount;
        pt.dueAmount = Math.max(0, pt.dueAmount - amount);
        pt.updatedAt = new Date().toISOString();
      }
    }

    this.save();
    return { success: true, payment: newPayment };
  }

  public deletePayment(id: string) {
    const data = this.load();
    const idx = data.payments.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { success: false, error: "Payment not found in sandbox" };
    }

    const payment = data.payments[idx];
    const amount = payment.amount;

    // Revert subscription dues
    if (payment.subscriptionId) {
      const sub = data.subscriptions.find((s) => s.id === payment.subscriptionId);
      if (sub) {
        sub.paidAmount = Math.max(0, sub.paidAmount - amount);
        sub.dueAmount = Math.max(0, sub.totalAmount - sub.paidAmount);
      }
    }

    if (payment.ptId) {
      const pt = data.ptSubscriptions.find((pt) => pt.id === payment.ptId);
      if (pt) {
        pt.paidAmount = Math.max(0, pt.paidAmount - amount);
        pt.dueAmount = Math.max(0, pt.totalAmount - pt.paidAmount);
      }
    }

    data.payments.splice(idx, 1);
    this.save();
    return { success: true, receiptNo: payment.receiptNo, amount: payment.amount };
  }

  public updatePaymentDate(input: { paymentId: string; newPaymentDate: string | Date }) {
    const data = this.load();
    const p = data.payments.find((pay) => pay.id === input.paymentId);
    if (!p) {
      return { success: false, error: "Payment not found in sandbox" };
    }

    p.paymentDate = new Date(input.newPaymentDate).toISOString();
    p.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, payment: p };
  }

  public getDueSubscriptions() {
    const data = this.load();
    const dueSubs = data.subscriptions
      .filter((s) => s.dueAmount > 0)
      .map((s) => {
        const member = data.members.find((m) => m.id === s.memberId);
        return {
          id: s.id,
          planName: s.planName,
          totalAmount: s.totalAmount,
          paidAmount: s.paidAmount,
          dueAmount: s.dueAmount,
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate),
          member: member
            ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone }
            : { id: s.memberId, memberId: "-", fullName: "Unknown", phone: "-" },
          type: "MEMBERSHIP" as const,
        };
      });

    const duePTs = data.ptSubscriptions
      .filter((pt) => pt.dueAmount > 0)
      .map((pt) => {
        const member = data.members.find((m) => m.id === pt.memberId);
        return {
          id: pt.id,
          planName: `PT: ${pt.planName} (${pt.trainerName || "Trainer"})`,
          totalAmount: pt.totalAmount,
          paidAmount: pt.paidAmount,
          dueAmount: pt.dueAmount,
          startDate: new Date(pt.startDate),
          endDate: new Date(pt.endDate),
          member: member
            ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone }
            : { id: pt.memberId, memberId: "-", fullName: "Unknown", phone: "-" },
          type: "PT" as const,
        };
      });

    return [...dueSubs, ...duePTs].sort((a, b) => b.dueAmount - a.dueAmount);
  }

  // --- ENQUIRIES ---

  public getEnquiries(filters?: { search?: string; status?: string }) {
    const data = this.load();
    let list = data.enquiries.map((e) => {
      const match = data.scheduledWhatsApp.find(
        (m) => (m.status === "PENDING" || m.status === "SENT") && m.enquiryId === e.id
      );
      return {
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
        followUpDate: e.followUpDate ? new Date(e.followUpDate) : null,
        scheduledWhatsApp: match
          ? {
              id: match.id,
              status: match.status,
              scheduledFor: match.scheduledFor,
              sentAt: match.sentAt,
              sentBy: match.sentBy,
            }
          : null,
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.phone.toLowerCase().includes(term) ||
          (e.email && e.email.toLowerCase().includes(term))
      );
    }

    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((e) => e.status === filters.status);
    }

    list.sort((a, b) => {
      const dateA = a.followUpDate ? a.followUpDate.getTime() : 0;
      const dateB = b.followUpDate ? b.followUpDate.getTime() : 0;
      return dateA - dateB;
    });

    return list;
  }

  public createEnquiry(input: any): { success: boolean; enquiry?: any; error?: string } {
    const data = this.load();
    const now = new Date();
    const newEnq = {
      id: `dev-enq-${Date.now()}`,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      gender: input.gender || "Male",
      source: input.source || "Walk-in",
      preferredPlan: input.preferredPlan || null,
      budget: input.budget ? Number(input.budget) : null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate).toISOString() : null,
      status: input.status || "NEW",
      notes: input.notes || null,
      assignedStaff: input.assignedStaff || null,
      convertedMemberId: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    data.enquiries.push(newEnq);
    this.save();
    return { success: true, enquiry: newEnq };
  }

  public updateEnquiryStatus(id: string, status: string, notes?: string) {
    const data = this.load();
    const enq = data.enquiries.find((e) => e.id === id);
    if (!enq) {
      return { success: false, error: "Enquiry not found in sandbox" };
    }

    enq.status = status;
    if (notes) enq.notes = notes;
    enq.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, enquiry: enq };
  }

  public deleteEnquiry(id: string) {
    const data = this.load();
    const idx = data.enquiries.findIndex((e) => e.id === id);
    if (idx === -1) {
      return { success: false, error: "Enquiry not found in sandbox" };
    }

    data.enquiries.splice(idx, 1);
    data.scheduledWhatsApp = data.scheduledWhatsApp.filter((m) => m.enquiryId !== id);
    this.save();
    return { success: true };
  }

  public convertEnquiryToMember(id: string) {
    const data = this.load();
    const enq = data.enquiries.find((e) => e.id === id);
    if (!enq) {
      return { success: false, error: "Enquiry not found in sandbox" };
    }

    enq.status = "CONVERTED";
    enq.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, enquiry: enq };
  }

  // --- DASHBOARD DATA ---

  public getDashboardData() {
    const data = this.load();
    const now = new Date();

    const todayStart = startOfDay(now).getTime();
    const todayEnd = endOfDay(now).getTime();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).getTime();
    const monthStart = startOfMonth(now).getTime();
    const monthEnd = endOfMonth(now).getTime();

    // Counts
    let subSoldToday = 0, subSoldWeek = 0, subSoldMonth = 0;
    for (const s of data.subscriptions) {
      const t = new Date(s.startDate).getTime();
      if (t >= todayStart && t <= todayEnd) subSoldToday++;
      if (t >= weekStart && t <= weekEnd) subSoldWeek++;
      if (t >= monthStart && t <= monthEnd) subSoldMonth++;
    }

    let ptSoldToday = 0, ptSoldWeek = 0, ptSoldMonth = 0;
    for (const pt of data.ptSubscriptions) {
      const t = new Date(pt.startDate).getTime();
      if (t >= todayStart && t <= todayEnd) ptSoldToday++;
      if (t >= weekStart && t <= weekEnd) ptSoldWeek++;
      if (t >= monthStart && t <= monthEnd) ptSoldMonth++;
    }

    let salesToday = 0, salesWeek = 0, salesMonth = 0;
    for (const p of data.payments) {
      const t = new Date(p.paymentDate).getTime();
      if (t >= todayStart && t <= todayEnd) salesToday += p.amount;
      if (t >= weekStart && t <= weekEnd) salesWeek += p.amount;
      if (t >= monthStart && t <= monthEnd) salesMonth += p.amount;
    }

    let enqToday = 0, enqWeek = 0, enqMonth = 0;
    for (const e of data.enquiries) {
      const t = new Date(e.createdAt).getTime();
      if (t >= todayStart && t <= todayEnd) enqToday++;
      if (t >= weekStart && t <= weekEnd) enqWeek++;
      if (t >= monthStart && t <= monthEnd) enqMonth++;
    }

    let totalDue = 0;
    for (const s of data.subscriptions) totalDue += s.dueAmount || 0;
    for (const pt of data.ptSubscriptions) totalDue += pt.dueAmount || 0;

    const dueSubscriptions = this.getDueSubscriptions();

    // Expiring soon in next 7 days
    const in7Days = addDays(now, 7).getTime();
    const expiringSubs = data.subscriptions
      .filter((s) => {
        const end = new Date(s.endDate).getTime();
        return s.status === "ACTIVE" && end >= todayStart && end <= in7Days;
      })
      .map((s) => {
        const member = data.members.find((m) => m.id === s.memberId);
        return {
          id: s.id,
          planName: s.planName,
          endDate: new Date(s.endDate),
          member: member
            ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone }
            : { id: s.memberId, memberId: "-", fullName: "Unknown", phone: "-" },
          type: "MEMBERSHIP" as const,
        };
      });

    const expiringPTs = data.ptSubscriptions
      .filter((pt) => {
        const end = new Date(pt.endDate).getTime();
        return pt.status === "ACTIVE" && end >= todayStart && end <= in7Days;
      })
      .map((pt) => {
        const member = data.members.find((m) => m.id === pt.memberId);
        return {
          id: pt.id,
          planName: `PT: ${pt.planName} (${pt.trainerName || "Trainer"})`,
          endDate: new Date(pt.endDate),
          member: member
            ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone }
            : { id: pt.memberId, memberId: "-", fullName: "Unknown", phone: "-" },
          type: "PT" as const,
        };
      });

    const expiringSoon = [...expiringSubs, ...expiringPTs].sort(
      (a, b) => a.endDate.getTime() - b.endDate.getTime()
    );

    // Upcoming birthdays / anniversaries within 7 days
    const upcomingEvents: any[] = [];
    const currentYear = now.getFullYear();
    const todayNorm = new Date(currentYear, now.getMonth(), now.getDate()).getTime();

    for (const m of data.members) {
      if (m.dob) {
        const b = new Date(m.dob);
        const thisYr = new Date(currentYear, b.getMonth(), b.getDate());
        const diff = Math.ceil((thisYr.getTime() - todayNorm) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) {
          upcomingEvents.push({
            id: `${m.id}-bday`,
            memberId: m.memberId,
            fullName: m.fullName,
            phone: m.phone,
            type: "Birthday",
            date: thisYr,
            isToday: diff === 0,
            daysUntil: diff,
            detail: `Turning ${currentYear - b.getFullYear()} yrs`,
          });
        }
      }

      if (m.anniversaryDate) {
        const a = new Date(m.anniversaryDate);
        const thisYr = new Date(currentYear, a.getMonth(), a.getDate());
        const diff = Math.ceil((thisYr.getTime() - todayNorm) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) {
          upcomingEvents.push({
            id: `${m.id}-anni`,
            memberId: m.memberId,
            fullName: m.fullName,
            phone: m.phone,
            type: "Anniversary",
            date: thisYr,
            isToday: diff === 0,
            daysUntil: diff,
            detail: m.spouseName ? `with ${m.spouseName}` : undefined,
          });
        }
      }
    }

    upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    // Recent Members
    const recentMembers = data.members
      .slice()
      .sort((a, b) => new Date(b.enrollDate).getTime() - new Date(a.enrollDate).getTime())
      .slice(0, 10)
      .map((m) => {
        const sub = data.subscriptions.find((s) => s.memberId === m.id && s.status === "ACTIVE");
        const pt = data.ptSubscriptions.find((pt) => pt.memberId === m.id && pt.status === "ACTIVE");
        return {
          ...m,
          enrollDate: new Date(m.enrollDate),
          subscriptions: sub ? [sub] : [],
          ptSubscriptions: pt ? [pt] : [],
        };
      });

    // Follow-ups
    const pendingFollowUps = data.enquiries
      .filter((e) => e.status === "NEW" || e.status === "FOLLOW_UP")
      .map((e) => {
        const match = data.scheduledWhatsApp.find(
          (m) => (m.status === "PENDING" || m.status === "SENT") && m.enquiryId === e.id
        );
        return {
          ...e,
          followUpDate: e.followUpDate ? new Date(e.followUpDate) : null,
          scheduledWhatsApp: match
            ? {
                id: match.id,
                status: match.status,
                scheduledFor: match.scheduledFor,
                sentAt: match.sentAt,
                sentBy: match.sentBy,
              }
            : null,
        };
      });

    return {
      metrics: {
        sold: {
          today: subSoldToday + ptSoldToday,
          week: subSoldWeek + ptSoldWeek,
          month: subSoldMonth + ptSoldMonth,
        },
        sales: {
          today: salesToday,
          week: salesWeek,
          month: salesMonth,
        },
        enquiries: {
          today: enqToday,
          week: enqWeek,
          month: enqMonth,
        },
        totalDue,
      },
      dueSubscriptions,
      pendingFollowUps,
      recentMembers,
      expiringSoon,
      upcomingEvents,
    };
  }

  // --- REPORTS ---

  public getReportsData() {
    const data = this.load();
    const now = new Date();

    const monthRanges = [5, 4, 3, 2, 1, 0].map((i) => {
      const targetMonth = subMonths(now, i);
      return {
        monthLabel: format(targetMonth, "MMM yyyy"),
        start: startOfMonth(targetMonth).getTime(),
        end: endOfMonth(targetMonth).getTime(),
      };
    });

    const monthlyRevenue = monthRanges.map((mr) => {
      let revenue = 0;
      let count = 0;
      for (const p of data.payments) {
        const t = new Date(p.paymentDate).getTime();
        if (t >= mr.start && t <= mr.end) {
          revenue += p.amount;
          count++;
        }
      }
      return {
        month: mr.monthLabel,
        amount: revenue,
        count,
      };
    });

    // Plans distribution
    const plansDistribution = data.plans.map((p) => {
      const subs = data.subscriptions.filter(
        (s) => s.planName.toLowerCase() === p.name.toLowerCase()
      );
      const rev = subs.reduce((sum, s) => sum + s.totalAmount, 0);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        durationInDays: p.durationInDays,
        count: subs.length,
        revenue: rev,
        category: p.category,
      };
    });

    // PT Distribution
    const ptPkgMap: Record<string, { count: number; activeCount: number; revenue: number; sessions: number }> = {};
    const ptTrainerMap: Record<string, { clientCount: number; activeClients: number; totalSessions: number; completedSessions: number; revenue: number }> = {};

    let totalSessionsCompleted = 0;
    for (const pt of data.ptSubscriptions) {
      totalSessionsCompleted += pt.completedSessions || 0;
      if (!ptPkgMap[pt.planName]) {
        ptPkgMap[pt.planName] = { count: 0, activeCount: 0, revenue: 0, sessions: pt.totalSessions || 12 };
      }
      ptPkgMap[pt.planName].count++;
      if (pt.status === "ACTIVE") ptPkgMap[pt.planName].activeCount++;
      ptPkgMap[pt.planName].revenue += pt.totalAmount;

      const tr = pt.trainerName || "Unassigned";
      if (!ptTrainerMap[tr]) {
        ptTrainerMap[tr] = { clientCount: 0, activeClients: 0, totalSessions: 0, completedSessions: 0, revenue: 0 };
      }
      ptTrainerMap[tr].clientCount++;
      if (pt.status === "ACTIVE") ptTrainerMap[tr].activeClients++;
      ptTrainerMap[tr].totalSessions += pt.totalSessions || 12;
      ptTrainerMap[tr].completedSessions += pt.completedSessions || 0;
      ptTrainerMap[tr].revenue += pt.totalAmount;
    }

    const ptPackagesDistribution = Object.entries(ptPkgMap).map(([name, stat]) => ({
      name,
      ...stat,
    }));

    const ptTrainerDistribution = Object.entries(ptTrainerMap).map(([trainer, stat]) => ({
      trainer,
      ...stat,
    }));

    // Other payments (e.g. Diet Plan, Lockers)
    const otherPayments = data.payments
      .filter((p) => p.paymentType === "OTHER")
      .map((p) => {
        const member = data.members.find((m) => m.id === p.memberId);
        return {
          id: p.id,
          receiptNo: p.receiptNo,
          invoiceNo: formatInvoiceNo(p.receiptNo, new Date(p.paymentDate)),
          paymentDate: new Date(p.paymentDate),
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          notes: p.notes || "Other Payment",
          memberName: member?.fullName || "Unknown",
          memberId: member?.memberId || "-",
          phone: member?.phone || "-",
        };
      });

    const otherTotalRevenue = otherPayments.reduce((sum, o) => sum + o.amount, 0);
    const totalPTRevenue = data.ptSubscriptions.reduce((sum, pt) => sum + pt.totalAmount, 0);
    const activePTCount = data.ptSubscriptions.filter((pt) => pt.status === "ACTIVE").length;

    // Collections ledger
    const collectionsLedger = data.payments.map((p) => {
      const member = data.members.find((m) => m.id === p.memberId);
      const sub = p.subscriptionId ? data.subscriptions.find((s) => s.id === p.subscriptionId) : null;
      const pt = p.ptId ? data.ptSubscriptions.find((pt) => pt.id === p.ptId) : null;

      const planName = pt
        ? `PT: ${pt.planName}${pt.trainerName ? ` (${pt.trainerName})` : ""}`
        : sub?.planName ||
          (p.paymentType === "OTHER" && p.notes ? `Other: ${p.notes}` : p.paymentType);

      return {
        id: p.id,
        receiptNo: p.receiptNo,
        invoiceNo: formatInvoiceNo(p.receiptNo, new Date(p.paymentDate)),
        paymentDate: new Date(p.paymentDate),
        amount: Number(p.amount) || 0,
        paymentMethod: p.paymentMethod,
        paymentType: p.paymentType,
        notes: p.notes || null,
        member: member
          ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone }
          : { id: p.memberId, memberId: "-", fullName: "Unknown", phone: "-" },
        subscription: sub,
        ptSubscription: pt,
        planName,
        startDate: pt ? new Date(pt.startDate) : sub ? new Date(sub.startDate) : new Date(p.paymentDate),
        endDate: pt ? new Date(pt.endDate) : sub ? new Date(sub.endDate) : null,
      };
    });

    const activeCount = data.members.filter((m) => m.membershipStatus === "ACTIVE").length;
    const expiredCount = data.members.filter((m) => m.membershipStatus === "EXPIRED").length;
    const frozenCount = data.members.filter((m) => m.membershipStatus === "FROZEN").length;

    const totalEnq = data.enquiries.length;
    const convertedEnq = data.enquiries.filter((e) => e.status === "CONVERTED").length;

    const methodCounts: Record<string, { amount: number; count: number }> = {};
    for (const p of data.payments) {
      if (!methodCounts[p.paymentMethod]) {
        methodCounts[p.paymentMethod] = { amount: 0, count: 0 };
      }
      methodCounts[p.paymentMethod].amount += p.amount;
      methodCounts[p.paymentMethod].count++;
    }

    const paymentMethodsList = Object.entries(methodCounts).map(([method, stat]) => ({
      method,
      amount: stat.amount,
      count: stat.count,
    }));

    return {
      monthlyRevenue,
      plansDistribution,
      ptPackagesDistribution,
      ptTrainerDistribution,
      ptSummary: {
        totalClients: data.ptSubscriptions.length,
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
      taxLedger: [] as any[],
      enquiryStats: {
        total: totalEnq,
        converted: convertedEnq,
        rate: totalEnq > 0 ? Math.round((convertedEnq / totalEnq) * 100) : 0,
      },
      paymentMethods: paymentMethodsList,
      memberStats: {
        active: activeCount,
        expired: expiredCount,
        frozen: frozenCount,
        total: data.members.length,
      },
    };
  }

  // --- PLANS ---

  public getPlans(category?: string) {
    const data = this.load();
    let list = data.plans.filter((p) => p.isActive);
    if (category && category !== "ALL") {
      list = list.filter((p) => p.category === category);
    }
    return list;
  }

  public getAllPlansAdmin() {
    const data = this.load();
    return data.plans.filter((p) => p.isActive);
  }

  public createPlan(input: any): { success: boolean; plan?: any; error?: string } {
    const data = this.load();
    const newPlan = {
      id: `dev-plan-${Date.now()}`,
      name: input.name.trim(),
      price: Number(input.price),
      durationInDays: Number(input.durationInDays) || 30,
      category: input.category || "GYM",
      sessions: input.sessions ? Number(input.sessions) : null,
      description: input.description?.trim() || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.plans.push(newPlan);
    this.save();
    return { success: true, plan: newPlan };
  }

  public updatePlan(id: string, input: any) {
    const data = this.load();
    const plan = data.plans.find((p) => p.id === id);
    if (!plan) return { success: false, error: "Plan not found in sandbox" };

    if (input.name !== undefined) plan.name = input.name.trim();
    if (input.price !== undefined) plan.price = Number(input.price);
    if (input.durationInDays !== undefined) plan.durationInDays = Number(input.durationInDays);
    if (input.category !== undefined) plan.category = input.category;
    if (input.sessions !== undefined) plan.sessions = input.sessions ? Number(input.sessions) : null;
    if (input.description !== undefined) plan.description = input.description?.trim() || null;
    if (input.isActive !== undefined) plan.isActive = Boolean(input.isActive);

    plan.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, plan };
  }

  public deletePlan(id: string) {
    const data = this.load();
    const plan = data.plans.find((p) => p.id === id);
    if (!plan) return { success: false, error: "Plan not found in sandbox" };
    plan.isActive = false;
    this.save();
    return { success: true };
  }

  // --- TRAINERS ---

  public getTrainers() {
    const data = this.load();
    return data.trainers.filter((t) => t.isActive);
  }

  public getAllTrainersAdmin() {
    const data = this.load();
    return data.trainers.filter((t) => t.isActive);
  }

  public createTrainer(input: any): { success: boolean; trainer?: any; error?: string } {
    const data = this.load();
    const newTrainer = {
      id: `dev-tr-${Date.now()}`,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      specialty: input.specialty?.trim() || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.trainers.push(newTrainer);
    this.save();
    return { success: true, trainer: newTrainer };
  }

  public updateTrainer(id: string, input: any) {
    const data = this.load();
    const tr = data.trainers.find((t) => t.id === id);
    if (!tr) return { success: false, error: "Trainer not found in sandbox" };

    if (input.name !== undefined) tr.name = input.name.trim();
    if (input.phone !== undefined) tr.phone = input.phone?.trim() || null;
    if (input.specialty !== undefined) tr.specialty = input.specialty?.trim() || null;
    if (input.isActive !== undefined) tr.isActive = Boolean(input.isActive);

    tr.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, trainer: tr };
  }

  public deleteTrainer(id: string) {
    const data = this.load();
    const tr = data.trainers.find((t) => t.id === id);
    if (!tr) return { success: false, error: "Trainer not found in sandbox" };
    tr.isActive = false;
    this.save();
    return { success: true };
  }

  // --- PT SUBSCRIPTIONS ---

  public addOrRenewMemberPT(input: any):
    | { success: true; pt: any; payment: any }
    | { success: false; error: string; pt?: undefined; payment?: undefined } {
    const data = this.load();
    const total = Number(input.totalAmount);
    const paid = Number(input.paidAmount || 0);
    const due = Math.max(0, total - paid);
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const sessions = input.totalSessions ? Number(input.totalSessions) : 12;

    const pt = {
      id: `dev-pt-${Date.now()}`,
      memberId: input.memberId,
      planName: input.planName,
      trainerName: input.trainerName?.trim() || "-",
      totalSessions: sessions,
      completedSessions: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      status: "ACTIVE",
      notes: input.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.ptSubscriptions.push(pt);

    let payment = null;
    if (paid > 0) {
      const receiptNo = input.receiptNo?.trim() || this.getNextSequentialReceiptNo(new Date());
      payment = {
        id: `dev-pay-${Date.now()}`,
        receiptNo,
        memberId: input.memberId,
        subscriptionId: null,
        ptId: pt.id,
        amount: paid,
        paymentDate: new Date().toISOString(),
        paymentMethod: input.paymentMethod || "UPI",
        paymentType: "PERSONAL_TRAINING",
        notes: input.notes ? `PT: ${input.planName} - ${input.notes}` : `PT Add-on: ${input.planName}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.payments.push(payment);
    }

    this.save();
    return { success: true, pt, payment };
  }

  public updatePTSessions(ptId: string, completedSessions: number) {
    const data = this.load();
    const pt = data.ptSubscriptions.find((p) => p.id === ptId);
    if (!pt) return { success: false, error: "PT record not found in sandbox" };

    const total = pt.totalSessions || 12;
    const newCount = Math.max(0, Math.min(total, completedSessions));
    pt.completedSessions = newCount;
    pt.status = newCount >= total ? "COMPLETED" : "ACTIVE";
    pt.updatedAt = new Date().toISOString();
    this.save();
    return { success: true, pt };
  }

  public getPTList() {
    const data = this.load();
    return data.ptSubscriptions.map((pt) => {
      const member = data.members.find((m) => m.id === pt.memberId);
      const payments = data.payments.filter((p) => p.ptId === pt.id);
      return {
        ...pt,
        startDate: new Date(pt.startDate),
        endDate: new Date(pt.endDate),
        createdAt: new Date(pt.createdAt),
        updatedAt: new Date(pt.updatedAt),
        member: member
          ? { id: member.id, memberId: member.memberId, fullName: member.fullName, phone: member.phone, membershipStatus: member.membershipStatus }
          : { id: pt.memberId, memberId: "-", fullName: "Unknown", phone: "-", membershipStatus: "INACTIVE" },
        payments,
      };
    });
  }

  // --- RECEIPT BY ID ---

  public getReceiptById(idOrNo: string) {
    const data = this.load();
    const decoded = decodeURIComponent(idOrNo).trim();
    const pad5 = decoded.padStart(5, "0");

    const payment = data.payments.find(
      (p) =>
        p.id === decoded ||
        p.receiptNo === decoded ||
        p.receiptNo === pad5 ||
        p.receiptNo === `REC-${decoded}`
    );

    if (!payment) return null;

    const member = data.members.find((m) => m.id === payment.memberId);
    const sub = payment.subscriptionId ? data.subscriptions.find((s) => s.id === payment.subscriptionId) : null;
    const pt = payment.ptId ? data.ptSubscriptions.find((pt) => pt.id === payment.ptId) : null;

    return {
      ...payment,
      paymentDate: new Date(payment.paymentDate),
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt),
      member: member ? { ...member, dob: member.dob ? new Date(member.dob) : null } : null,
      subscription: sub ? { ...sub, startDate: new Date(sub.startDate), endDate: new Date(sub.endDate) } : null,
      ptSubscription: pt ? { ...pt, startDate: new Date(pt.startDate), endDate: new Date(pt.endDate) } : null,
    };
  }
}

export const sandboxStore = new SandboxStore();


import * as XLSX from "xlsx";
import * as path from "path";
import { PrismaClient, MembershipStatus, SubscriptionStatus, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === "NULL" || isNaN(Number(serial))) return null;
  const num = Number(serial);
  const utcDays = num - 25569;
  return new Date(utcDays * 86400 * 1000);
}

function cleanPhone(raw: any): string | null {
  if (!raw || raw === "NULL") return null;
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  // International format fallback
  if (digits.length >= 7 && digits.length <= 15) {
    return digits;
  }
  return null;
}

function formatPlanName(months: any, amount: any, membershipId: any): string {
  const m = Number(months) || 0;
  if (m === 1) return "Monthly Standard (1 Month)";
  if (m === 3) return "Quarterly Pro (3 Months)";
  if (m === 6) return "Half Yearly Elite (6 Months)";
  if (m === 12) return "Annual Platinum (12 Months)";
  if (m === 14 || m === 15 || m === 16) return `Annual Plus (${m} Months)`;
  if (m > 0) return `${m} Months Membership`;
  return `Standard Plan (${membershipId || "General"})`;
}

function padReceiptNo(num: number): string {
  return `REC-${String(num).padStart(5, "0")}`;
}

async function run() {
  const filePath = path.join(process.cwd(), "Workbook1.xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets["Sheet1"];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Read ${rows.length} total rows from Workbook1.xlsx`);

  // Group by customer
  const customerMap = new Map<string, any[]>();
  for (const row of rows) {
    if (row.IsDeleted === 1 || row.IsDeleted_1 === 1) continue;
    const phone = cleanPhone(row.PhoneNo);
    if (!phone) continue; // Skip rows without valid phone

    const custCode = String(row.CustomerCode || row.CustomerId || "").trim();
    if (!custCode || custCode === "NULL") continue;

    if (!customerMap.has(custCode)) {
      customerMap.set(custCode, []);
    }
    customerMap.get(custCode)!.push(row);
  }

  console.log(`Found ${customerMap.size} unique valid customers.`);

  // Find 15 high-quality varied customers:
  // - Some with active dates (2024-2027)
  // - Some with multiple renewal histories
  // - Some with single plans
  // - Both Male and Female
  const candidates: Array<{ custCode: string; rows: any[] }> = [];
  const now = new Date();

  for (const [custCode, custRows] of customerMap.entries()) {
    const first = custRows[0];
    if (!first.FirstName || first.FirstName === "NULL") continue;
    
    // Check if member has valid start and end dates on any subscription
    const hasValidSub = custRows.some((r) => excelSerialToDate(r.StartDate) && excelSerialToDate(r.EndDate));
    if (!hasValidSub) continue;

    candidates.push({ custCode, rows: custRows });
  }

  // Pick 15 rich profiles across the list
  const selectedCustomers = [
    // Pick candidates with recent active dates
    ...candidates.filter(c => c.rows.some(r => {
      const end = excelSerialToDate(r.EndDate);
      return end && end > now;
    })).slice(0, 8),
    // Pick candidates with multiple renewal histories
    ...candidates.filter(c => c.rows.length >= 3 && !candidates.slice(0, 8).includes(c)).slice(0, 4),
    // Pick other varied candidates
    ...candidates.filter(c => c.rows.length === 1 && !candidates.slice(0, 12).includes(c)).slice(0, 3),
  ].slice(0, 15);

  console.log(`\nSelected ${selectedCustomers.length} representative test customer profiles for migration:`);
  selectedCustomers.forEach((c, idx) => {
    const r = c.rows[0];
    console.log(` ${idx + 1}. [Code #${c.custCode}] ${r.FirstName} ${r.LastName || ""} | Phone: ${cleanPhone(r.PhoneNo)} | Records: ${c.rows.length}`);
  });

  console.log("\nDeleting existing DB data...");
  await prisma.payment.deleteMany();
  await prisma.memberPT.deleteMany();
  await prisma.memberSubscription.deleteMany();
  await prisma.member.deleteMany();
  await prisma.enquiry.deleteMany();

  let receiptCounter = 1;
  let migratedCount = 0;

  for (let i = 0; i < selectedCustomers.length; i++) {
    const { custCode, rows: custRows } = selectedCustomers[i];
    const firstRow = custRows[0];

    const firstName = String(firstRow.FirstName || "").trim();
    const lastName = firstRow.LastName && firstRow.LastName !== "NULL" ? String(firstRow.LastName).trim() : "";
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    const phone = cleanPhone(firstRow.PhoneNo)!;
    const email = firstRow.Email && firstRow.Email !== "NULL" ? String(firstRow.Email).trim() : null;
    const gender = firstRow.Gender && firstRow.Gender !== "NULL" ? String(firstRow.Gender).trim() : "Male";
    const address = firstRow.Address && firstRow.Address !== "NULL" ? String(firstRow.Address).trim() : null;
    const dob = excelSerialToDate(firstRow.DOB);
    const enrollDate = excelSerialToDate(firstRow.EnrollDate) || new Date();
    const representative = firstRow.Representative && firstRow.Representative !== "NULL" ? String(firstRow.Representative).trim() : "Coach Vikram";
    const referredBy = firstRow.ReferenceBy && firstRow.ReferenceBy !== "NULL" ? String(firstRow.ReferenceBy).trim() : null;

    // Use 4-digit ID starting from 1001 for clean CRM presentation, with original code referenced in notes
    const formattedMemberId = String(1001 + i);

    // Determine latest membership status
    let latestSubEndDate: Date | null = null;
    for (const r of custRows) {
      const eDate = excelSerialToDate(r.EndDate);
      if (eDate && (!latestSubEndDate || eDate > latestSubEndDate)) {
        latestSubEndDate = eDate;
      }
    }

    const isMemberActive = latestSubEndDate && latestSubEndDate >= now;

    const member = await prisma.member.create({
      data: {
        memberId: formattedMemberId,
        firstName,
        lastName: lastName || null,
        fullName,
        email,
        phone,
        gender,
        dob,
        address,
        enrollDate,
        representative,
        referredBy,
        membershipStatus: isMemberActive ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED,
        notes: `Migrated from Old ERP (CustomerCode: ${custCode}, CustomerId: ${firstRow.CustomerId})`,
      },
    });

    // Create subscriptions and payments for this member
    for (const r of custRows) {
      const sDate = excelSerialToDate(r.StartDate) || enrollDate;
      const eDate = excelSerialToDate(r.EndDate) || new Date(sDate.getTime() + 30 * 86400 * 1000);
      const amount = Number(r.Amount) || 0;
      const planName = formatPlanName(r.Month, r.Amount, r.MembershipId);
      const isSubActive = eDate >= now;

      // Check if this record is PT or standard membership
      const isPT = String(r.MembershipId) === "605" || String(r.MembershipId) === "606" || Number(r.Sessions) > 0;

      if (isPT) {
        const ptSub = await prisma.memberPT.create({
          data: {
            memberId: member.id,
            planName: `Personal Training (${r.Month || 1}M)`,
            trainerName: representative || "Trainer",
            totalSessions: Number(r.Sessions) || 12,
            completedSessions: isSubActive ? 4 : (Number(r.Sessions) || 12),
            startDate: sDate,
            endDate: eDate,
            totalAmount: amount,
            paidAmount: amount,
            dueAmount: 0,
            status: isSubActive ? "ACTIVE" : "EXPIRED",
            notes: r.Note && r.Note !== "NULL" ? String(r.Note) : null,
          },
        });

        await prisma.payment.create({
          data: {
            receiptNo: padReceiptNo(receiptCounter++),
            memberId: member.id,
            ptId: ptSub.id,
            amount: amount,
            paymentDate: excelSerialToDate(r.PaidDate) || excelSerialToDate(r.SaleDate) || sDate,
            paymentMethod: PaymentMethod.UPI,
            paymentType: "PERSONAL_TRAINING",
            notes: `Old ERP PT Migration (Rec #${r.Id})`,
          },
        });
      } else {
        const sub = await prisma.memberSubscription.create({
          data: {
            memberId: member.id,
            planName,
            startDate: sDate,
            endDate: eDate,
            totalAmount: amount,
            paidAmount: amount,
            dueAmount: 0,
            status: isSubActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
          },
        });

        await prisma.payment.create({
          data: {
            receiptNo: padReceiptNo(receiptCounter++),
            memberId: member.id,
            subscriptionId: sub.id,
            amount: amount,
            paymentDate: excelSerialToDate(r.PaidDate) || excelSerialToDate(r.SaleDate) || sDate,
            paymentMethod: PaymentMethod.UPI,
            paymentType: "MEMBERSHIP_FEE",
            notes: `Old ERP Migration (Rec #${r.Id}, Note: ${r.Note && r.Note !== "NULL" ? r.Note : "None"})`,
          },
        });
      }
    }

    migratedCount++;
  }

  // Also seed 5 fresh enquiries to keep CRM rich
  await prisma.enquiry.createMany({
    data: [
      {
        name: "Deepak Choudhary",
        phone: "9899001122",
        email: "deepak.c@gmail.com",
        gender: "Male",
        source: "Google",
        preferredPlan: "Monthly Standard",
        budget: 2500,
        status: "NEW",
        followUpDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        notes: "Interested in morning weight training demo.",
        assignedStaff: "Coach Vikram",
      },
      {
        name: "Kavita Rao",
        phone: "9845012345",
        email: "kavita.rao@example.com",
        gender: "Female",
        source: "Instagram",
        preferredPlan: "Annual Platinum",
        budget: 16500,
        status: "FOLLOW_UP",
        followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        notes: "Inquired about group fitness & cardio zone.",
        assignedStaff: "Coach Vikram",
      },
    ],
  });

  console.log(`\nMigration completed successfully!`);
  console.log(`- ${migratedCount} Real Members Migrated from Excel`);
  console.log(`- ${receiptCounter - 1} Payments with 5-digit receipts (REC-00001 to ${padReceiptNo(receiptCounter - 1)})`);
}

run()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

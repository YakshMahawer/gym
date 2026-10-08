import * as XLSX from "xlsx";
import * as path from "path";

const filePath = path.join(process.cwd(), "Workbook1.xlsx");
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets["Sheet1"];
const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log(`Total rows in Sheet1: ${rows.length}`);

let deletedCount = 0;
let nullPhoneCount = 0;
let validPhoneCount = 0;
const uniqueCustomers = new Map<string, any[]>();
const membershipIdCounts = new Map<string, { count: number; months: Set<any>; amounts: Set<any> }>();

function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === "NULL" || isNaN(Number(serial))) return null;
  const num = Number(serial);
  // Excel epoch is Dec 30 1899 (taking leap year bug into account, 25569 offset from 1970-01-01)
  const utcDays = num - 25569;
  return new Date(utcDays * 86400 * 1000);
}

for (const row of rows) {
  if (row.IsDeleted === 1 || row.IsDeleted_1 === 1) {
    deletedCount++;
  }

  const phone = String(row.PhoneNo).trim();
  if (!phone || phone === "NULL") {
    nullPhoneCount++;
  } else {
    validPhoneCount++;
  }

  const custKey = String(row.CustomerId || row.CustomerCode || "").trim();
  if (custKey) {
    if (!uniqueCustomers.has(custKey)) {
      uniqueCustomers.set(custKey, []);
    }
    uniqueCustomers.get(custKey)!.push(row);
  }

  const mId = String(row.MembershipId || "None");
  if (!membershipIdCounts.has(mId)) {
    membershipIdCounts.set(mId, { count: 0, months: new Set(), amounts: new Set() });
  }
  const entry = membershipIdCounts.get(mId)!;
  entry.count++;
  if (row.Month) entry.months.add(row.Month);
  if (row.Amount) entry.amounts.add(row.Amount);
}

console.log(`\nAnalysis:`);
console.log(`- Unique Customer IDs / Codes: ${uniqueCustomers.size}`);
console.log(`- Rows marked IsDeleted: ${deletedCount}`);
console.log(`- Rows with Phone "NULL" or empty: ${nullPhoneCount}`);
console.log(`- Rows with phone present: ${validPhoneCount}`);

console.log(`\nMembership IDs Distribution (Top 15):`);
const sortedMIds = Array.from(membershipIdCounts.entries()).sort((a, b) => b[1].count - a[1].count);
sortedMIds.slice(0, 15).forEach(([mId, data]) => {
  console.log(`  MembershipId ${mId}: count=${data.count}, Months=[${Array.from(data.months).join(",")}], Sample Amounts=[${Array.from(data.amounts).slice(0, 5).join(",")}]`);
});

// Sample 5 Customer profiles
console.log(`\nSample 5 Unique Customer Profiles:`);
let sampleIdx = 0;
for (const [custKey, custRows] of uniqueCustomers.entries()) {
  if (sampleIdx >= 5) break;
  const first = custRows[0];
  const last = custRows[custRows.length - 1];
  console.log(`\n[Customer #${custKey}] ${first.FirstName} ${first.LastName}`);
  console.log(`  Phone: ${first.PhoneNo}, Email: ${first.Email}, Gender: ${first.Gender}`);
  console.log(`  Address: ${first.Address}`);
  console.log(`  EnrollDate: ${first.EnrollDate} -> ${excelSerialToDate(first.EnrollDate)?.toISOString()?.split("T")[0]}`);
  console.log(`  Total Membership Records: ${custRows.length}`);
  custRows.forEach((r, i) => {
    console.log(`    Rec #${i + 1}: Plan=${r.MembershipId} (${r.Month}M), Amount=₹${r.Amount}, Start=${excelSerialToDate(r.StartDate)?.toISOString()?.split("T")[0]}, End=${excelSerialToDate(r.EndDate)?.toISOString()?.split("T")[0]}`);
  });
  sampleIdx++;
}

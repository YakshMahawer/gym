import * as XLSX from "xlsx";
import * as path from "path";

const filePath = path.join(process.cwd(), "Workbook1.xlsx");
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets["Sheet1"];
const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log("Unique values in column 'Month':");
const monthValues = new Map<any, { count: number; sampleRow: any }>();

for (const r of rows) {
  const m = r.Month;
  if (!monthValues.has(m)) {
    monthValues.set(m, { count: 0, sampleRow: r });
  }
  monthValues.get(m)!.count++;
}

for (const [val, info] of monthValues.entries()) {
  console.log(`- Month value '${val}' (type: ${typeof val}): appears in ${info.count} rows`);
  console.log(`   Sample: Name="${info.sampleRow.FirstName} ${info.sampleRow.LastName}", Amount=₹${info.sampleRow.Amount}, StartDate=${info.sampleRow.StartDate}, EndDate=${info.sampleRow.EndDate}, MembershipId=${info.sampleRow.MembershipId}`);
}

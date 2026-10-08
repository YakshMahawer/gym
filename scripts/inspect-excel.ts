import * as XLSX from "xlsx";
import * as path from "path";

const filePath = path.join(process.cwd(), "Workbook1.xlsx");
console.log("Opening workbook with sheetRows=10...");
const workbook = XLSX.readFile(filePath, { sheetRows: 10 });

console.log("Sheet Names:", workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n================== SHEET: ${sheetName} ==================`);
  const sheet = workbook.Sheets[sheetName];
  const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`Preview Rows: ${jsonData.length}`);
  if (jsonData.length > 0) {
    console.log("Columns:", Object.keys(jsonData[0]));
    console.log("\nSample Row 1:", JSON.stringify(jsonData[0], null, 2));
    if (jsonData.length > 1) {
      console.log("\nSample Row 2:", JSON.stringify(jsonData[1], null, 2));
    }
  }
});

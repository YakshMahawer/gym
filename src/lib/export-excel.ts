import * as XLSX from "xlsx";

export interface ExcelColumnMapping<T> {
  header: string;
  accessor: (item: T, index: number) => string | number | boolean | null | undefined;
  width?: number;
}

/**
 * Export tabular data directly to an Excel (.xlsx) file with native AutoFilter enabled on the header row
 */
export function exportToExcel<T>({
  data,
  columns,
  sheetName = "Sheet1",
  fileName = "Export",
}: {
  data: T[];
  columns: ExcelColumnMapping<T>[];
  sheetName?: string;
  fileName?: string;
}) {
  if (!data || data.length === 0) {
    alert("No data available to export with current filters.");
    return;
  }

  // 1. Build row objects with header names as keys
  const rows = data.map((item, index) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col) => {
      const val = col.accessor(item, index);
      rowObj[col.header] = val !== null && val !== undefined ? val : "";
    });
    return rowObj;
  });

  // 2. Convert to worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. Enable Excel AutoFilter on the entire header row!
  if (worksheet["!ref"]) {
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };
  }

  // 4. Set sensible column widths based on content length
  const colWidths = columns.map((col) => {
    if (col.width) return { wch: col.width };
    let maxLen = col.header.length;
    rows.forEach((r) => {
      const cellVal = String(r[col.header] || "");
      if (cellVal.length > maxLen) {
        maxLen = Math.min(45, cellVal.length);
      }
    });
    return { wch: Math.max(12, maxLen + 3) };
  });

  worksheet["!cols"] = colWidths;

  // 5. Create workbook and trigger download
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const dateStr = new Date().toISOString().split("T")[0];
  const safeFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, safeFileName);
}

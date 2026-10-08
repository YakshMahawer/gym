"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck,
  RefreshCw,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { isValidPhoneNumber, cleanPhoneNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ParsedCustomer {
  memberId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  gender: string;
  dob: any;
  address: string | null;
  enrollDate: any;
  representative: string;
  referredBy: string | null;
  customerId: any;
  records: any[];
}

interface RejectedRow {
  rowNumber: number;
  custCode: string;
  name: string;
  phone: string;
  reason: string;
}

function excelSerialToDate(serial: any): Date | null {
  if (!serial || serial === "NULL" || isNaN(Number(serial))) return null;
  const num = Number(serial);
  const utcDays = num - 25569;
  return new Date(utcDays * 86400 * 1000);
}

function formatPlanName(months: any, amount: any, membershipId: any): string {
  const m = Number(months) || 0;
  if (m === 1) return "Monthly (1M)";
  if (m === 3) return "Quarterly (3M)";
  if (m === 6) return "Half Yearly (6M)";
  if (m === 12) return "Annual (12M)";
  if (m > 0) return `${m}M Plan`;
  return `Plan ${membershipId || ""}`;
}

export function UploadClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [totalRowsCount, setTotalRowsCount] = useState(0);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [rejectedRows, setRejectedRows] = useState<RejectedRow[]>([]);
  const [activeTab, setActiveTab] = useState<"valid" | "rejected">("valid");
  const [wipeExisting, setWipeExisting] = useState(true);

  // Migration state
  const [migrating, setMigrating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [migrationDone, setMigrationDone] = useState(false);
  const [finalStats, setFinalStats] = useState<{ members: number; receipts: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsing(true);
    setMigrationDone(false);
    setFinalStats(null);
    setProgressPercent(0);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      setTotalRowsCount(rows.length);

      const customerMap = new Map<string, any[]>();
      const rejections: RejectedRow[] = [];

      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const custCode = String(row.CustomerCode || row.CustomerId || "").trim();
        const name = `${String(row.FirstName || "").trim()} ${String(row.LastName || "").trim()}`.trim();
        const rawPhone = String(row.PhoneNo || "").trim();

        if (row.IsDeleted === 1 || row.IsDeleted_1 === 1) {
          rejections.push({
            rowNumber: rowNum,
            custCode,
            name: name || "Unknown",
            phone: rawPhone,
            reason: "Marked as Deleted (IsDeleted = 1)",
          });
          return;
        }

        if (!row.FirstName || row.FirstName === "NULL") {
          rejections.push({
            rowNumber: rowNum,
            custCode,
            name: "Missing Name",
            phone: rawPhone,
            reason: "Missing client first name",
          });
          return;
        }

        const cleaned = cleanPhoneNumber(rawPhone);
        if (!cleaned || cleaned === "NULL" || !isValidPhoneNumber(cleaned)) {
          rejections.push({
            rowNumber: rowNum,
            custCode,
            name,
            phone: rawPhone || "EMPTY",
            reason: "Invalid or missing phone number",
          });
          return;
        }

        if (!custCode || custCode === "NULL") {
          rejections.push({
            rowNumber: rowNum,
            custCode: "EMPTY",
            name,
            phone: rawPhone,
            reason: "Missing CustomerCode identifier",
          });
          return;
        }

        if (!customerMap.has(custCode)) {
          customerMap.set(custCode, []);
        }
        customerMap.get(custCode)!.push(row);
      });

      const validList: ParsedCustomer[] = [];
      for (const [custCode, custRows] of customerMap.entries()) {
        const first = custRows[0];
        const firstName = String(first.FirstName || "").trim();
        const lastName = first.LastName && first.LastName !== "NULL" ? String(first.LastName).trim() : "";
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const phone = cleanPhoneNumber(first.PhoneNo)!;
        const email = first.Email && first.Email !== "NULL" ? String(first.Email).trim() : null;
        const gender = first.Gender && first.Gender !== "NULL" ? String(first.Gender).trim() : "Male";
        const address = first.Address && first.Address !== "NULL" ? String(first.Address).trim() : null;
        const representative =
          first.Representative && first.Representative !== "NULL"
            ? String(first.Representative).trim()
            : "Coach Vikram";
        const referredBy =
          first.ReferenceBy && first.ReferenceBy !== "NULL" ? String(first.ReferenceBy).trim() : null;

        validList.push({
          memberId: custCode,
          firstName,
          lastName,
          fullName,
          email,
          phone,
          gender,
          dob: first.DOB,
          address,
          enrollDate: first.EnrollDate,
          representative,
          referredBy,
          customerId: first.CustomerId,
          records: custRows,
        });
      }

      setParsedCustomers(validList);
      setRejectedRows(rejections);
    } catch (err: any) {
      alert("Failed to parse Excel file: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleStartMigration = async (isTestSampleOnly: boolean = false) => {
    const listToMigrate = isTestSampleOnly ? parsedCustomers.slice(0, 15) : parsedCustomers;

    if (listToMigrate.length === 0) {
      alert("No valid records to migrate. Please upload an Excel file first.");
      return;
    }

    const confirmMsg = isTestSampleOnly
      ? "Run test migration on 15 sample records?"
      : `Proceed with FULL migration of all ${listToMigrate.length.toLocaleString()} valid members? ${
          wipeExisting ? "(All previous data will be cleared first)" : ""
        }`;

    if (!confirm(confirmMsg)) return;

    setMigrating(true);
    setProgressPercent(0);
    setProgressStatus("Preparing migration...");

    try {
      // Step 1: Wipe DB if requested
      if (wipeExisting) {
        setProgressStatus("Clearing old database records...");
        const resetRes = await fetch("/api/migration/reset", { method: "POST" });
        if (!resetRes.ok) {
          throw new Error("Failed to reset database before migration.");
        }
      }

      // Step 2: Batch import in chunks of 50 members
      const BATCH_SIZE = 50;
      const totalBatches = Math.ceil(listToMigrate.length / BATCH_SIZE);
      let receiptIndex = 1;
      let totalImported = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, listToMigrate.length);
        const batch = listToMigrate.slice(start, end);

        setProgressStatus(`Migrating batch ${i + 1} of ${totalBatches} (${start} - ${end} members)...`);

        const response = await fetch("/api/migration/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            membersBatch: batch,
            receiptStartIndex: receiptIndex,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Failed at batch ${i + 1}`);
        }

        const data = await response.json();
        receiptIndex = data.nextReceiptIndex || receiptIndex + batch.length;
        totalImported += data.importedMembers || batch.length;

        const pct = Math.round(((i + 1) / totalBatches) * 100);
        setProgressPercent(pct);
      }

      setFinalStats({
        members: totalImported,
        receipts: receiptIndex - 1,
      });
      setMigrationDone(true);
      setProgressStatus("Migration successfully completed!");
      router.refresh();
    } catch (err: any) {
      alert("Migration Error: " + err.message);
      setProgressStatus("Migration halted due to error.");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Superuser Master Authority</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Legacy ERP Data Migration & Schema Transformer
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Upload and transform raw client spreadsheets into the new high-performance Concept I Gym CRM schema.
          The client-side parser validates 10-digit Indian phone numbers, extracts renewal timelines, and batches database operations with live progress.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Upload Excel Spreadsheet (.xlsx, .xls, .csv)</span>
        </h2>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center transition bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {file ? file.name : "Select or Drop your Excel Migration file here"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Accepts standard sheets with CustomerCode, Phone, Plans, Start/End Dates & Amounts.
          </p>

          <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition active:scale-98">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Browse Local File</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {parsing && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Parsing worksheet, cleaning contact formats, and validating schema...</span>
          </div>
        )}
      </div>

      {/* Validation Breakdown & Summary */}
      {parsedCustomers.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Metrics Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Raw Rows</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {totalRowsCount.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500">Sheet entries parsed</span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Valid Client Profiles</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {parsedCustomers.length.toLocaleString()}
              </p>
              <span className="text-xs text-emerald-600/80">With verified mobile & plans</span>
            </div>

            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Skipped / Filtered Entries</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {rejectedRows.length.toLocaleString()}
              </p>
              <span className="text-xs text-amber-600/80">Deleted or invalid phones</span>
            </div>
          </div>

          {/* Action Card */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ready to Execute Migration</h3>
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="wipeCheck"
                    checked={wipeExisting}
                    onChange={(e) => setWipeExisting(e.target.checked)}
                    disabled={migrating}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="wipeCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    Wipe existing database records before migrating (Recommended for clean state)
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleStartMigration(true)}
                  disabled={migrating}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Test 15 Samples
                </button>

                <button
                  onClick={() => handleStartMigration(false)}
                  disabled={migrating}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Migrating...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Migrate All {parsedCustomers.length.toLocaleString()} Members</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Progress Bar when migrating */}
            {migrating && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{progressStatus}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Banner if complete */}
            {migrationDone && finalStats && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Successfully migrated <strong>{finalStats.members.toLocaleString()}</strong> client profiles with{" "}
                    <strong>{finalStats.receipts.toLocaleString()}</strong> 5-digit payment receipts!
                  </span>
                </div>
                <button
                  onClick={() => router.push("/portal/members")}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition whitespace-nowrap self-start sm:self-auto"
                >
                  View Members Directory ↗
                </button>
              </div>
            )}
          </div>

          {/* Tab Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 pt-3 gap-3">
              <button
                onClick={() => setActiveTab("valid")}
                className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "valid"
                    ? "border-slate-900 dark:border-white text-slate-900 dark:text-white"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Validated Samples ({Math.min(parsedCustomers.length, 25)} Previewed)</span>
              </button>

              <button
                onClick={() => setActiveTab("rejected")}
                className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === "rejected"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Filtered / Skipped Entries Audit ({rejectedRows.length})</span>
              </button>
            </div>

            {/* TAB 1: Valid Preview Table */}
            {activeTab === "valid" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                      <th className="py-2.5 px-4">Original Code</th>
                      <th className="py-2.5 px-4">Full Name</th>
                      <th className="py-2.5 px-4">Verified Mobile</th>
                      <th className="py-2.5 px-4">Gender</th>
                      <th className="py-2.5 px-4">Renewal Records</th>
                      <th className="py-2.5 px-4">Latest Validity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedCustomers.slice(0, 25).map((m, i) => {
                      let latestEnd: Date | null = null;
                      const samplePlans: string[] = [];
                      m.records.forEach((r) => {
                        const e = excelSerialToDate(r.EndDate);
                        if (e && (!latestEnd || e > latestEnd)) latestEnd = e;
                        samplePlans.push(formatPlanName(r.Month, r.Amount, r.MembershipId));
                      });

                      return (
                        <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            #{m.memberId}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {m.fullName}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                            {m.phone}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{m.gender}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">{m.records.length} renewals: </span>
                            <span className="text-slate-500 text-[11px]">
                              {samplePlans.slice(0, 3).join(", ")}
                              {samplePlans.length > 3 ? "..." : ""}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                            {latestEnd ? (latestEnd as Date).toISOString().split("T")[0] : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Skipped / Rejected Rows Table */}
            {activeTab === "rejected" && (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-rose-50 dark:bg-rose-950">
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Excel Row</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Raw Phone</th>
                      <th className="py-2.5 px-4">Reason Skipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {rejectedRows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/30 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-500">
                          Row #{r.rowNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {r.name} <span className="text-slate-400 text-[11px]">({r.custCode})</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">{r.phone}</td>
                        <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-medium">
                          {r.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

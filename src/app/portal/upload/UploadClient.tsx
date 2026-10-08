"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { validateMigrationData, executeFullMigration, MigrationPreviewResult } from "@/lib/actions/migration";
import { useRouter } from "next/navigation";

export function UploadClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<MigrationPreviewResult | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"valid" | "rejected">("valid");
  const [wipeExisting, setWipeExisting] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsing(true);
    setPreview(null);
    setMigrationResult(null);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      setRawRows(jsonData);
      const res = await validateMigrationData(jsonData);
      setPreview(res);
    } catch (err: any) {
      alert("Failed to parse Excel file: " + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleStartMigration = async (isTestSampleOnly: boolean = false) => {
    if (!rawRows || rawRows.length === 0) {
      alert("Please upload and validate an Excel file first.");
      return;
    }

    const rowsToMigrate = isTestSampleOnly ? rawRows.slice(0, 100) : rawRows;
    const confirmMsg = isTestSampleOnly
      ? "Run test migration on sample records?"
      : `Proceed with FULL migration of all ${preview?.validCustomersCount} valid member profiles? ${
          wipeExisting ? "(Existing members and payments will be replaced)" : ""
        }`;

    if (!confirm(confirmMsg)) return;

    setMigrating(true);
    try {
      const res = await executeFullMigration(rowsToMigrate, { wipeExisting });
      setMigrationResult(res);
      if (res.success) {
        router.refresh();
      }
    } catch (err: any) {
      alert("Migration failed: " + err.message);
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
          The validator automatically sanitizes 10-digit Indian phone numbers, extracts renewal timelines, and flags invalid records.
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
            Accepts standard sheets with CustomerId, Phone, Plans, Start/End Dates & Amounts.
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
      {preview && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Metrics Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Raw Rows</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {preview.totalRows.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500">Sheet entries processed</span>
            </div>

            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Valid Client Profiles</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {preview.validCustomersCount.toLocaleString()}
              </p>
              <span className="text-xs text-emerald-600/80">With verified mobile & plans</span>
            </div>

            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Skipped / Filtered Entries</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {preview.skippedRowsCount.toLocaleString()}
              </p>
              <span className="text-xs text-amber-600/80">Deleted or invalid phones</span>
            </div>
          </div>

          {/* Action Card */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ready to Execute Migration</h3>
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="wipeCheck"
                  checked={wipeExisting}
                  onChange={(e) => setWipeExisting(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="wipeCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  Wipe test/existing records before migrating (Recommended for clean state)
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
                    <span>Migrating Data...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Migrate All {preview.validCustomersCount} Members</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Banner if run */}
          {migrationResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{migrationResult.message}</span>
              </div>
              <button
                onClick={() => router.push("/portal/members")}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                View Members Directory ↗
              </button>
            </div>
          )}

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
                <span>Validated Samples ({preview.sampleValid.length} Previewed)</span>
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
                <span>Filtered / Skipped Entries Audit ({preview.rejectedRows.length})</span>
              </button>
            </div>

            {/* TAB 1: Valid Preview Table */}
            {activeTab === "valid" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                      <th className="py-2.5 px-4">Old Code</th>
                      <th className="py-2.5 px-4">Full Name</th>
                      <th className="py-2.5 px-4">Verified Mobile</th>
                      <th className="py-2.5 px-4">Gender</th>
                      <th className="py-2.5 px-4">Packages</th>
                      <th className="py-2.5 px-4">Valid Till</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.sampleValid.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          #{m.custCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {m.fullName}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                          {m.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{m.gender}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{m.totalRecords} renewals: </span>
                          <span className="text-slate-500 text-[11px]">{m.samplePlans.join(", ")}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {m.latestEnd || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Skipped / Rejected Rows Table */}
            {activeTab === "rejected" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider bg-rose-50/40 dark:bg-rose-950/20">
                      <th className="py-2.5 px-4">Excel Row</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Raw Phone</th>
                      <th className="py-2.5 px-4">Reason Skipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {preview.rejectedRows.map((r, i) => (
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

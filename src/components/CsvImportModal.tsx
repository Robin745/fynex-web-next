"use client";

import React, { useState, useTransition } from "react";
import Papa from "papaparse";
import { bulkImportTransactionsAction } from "@/actions/client";
import { X, UploadCloud, FileText, Check, Loader2, Download, AlertTriangle } from "lucide-react";

interface CsvImportModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentStatus?: string;
}

export function CsvImportModal({ tenantSlug, isOpen, onClose }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as any[];
          const rows: ParsedRow[] = rawData.map((r, idx) => ({
            type: (r.type || r.Type || "EXPENSE").toUpperCase().includes("REV") ? "REVENUE" : "EXPENSE",
            category: r.category || r.Category || "Imported",
            description: r.description || r.Description || `Transaction #${idx + 1}`,
            amount: parseFloat(r.amount || r.Amount || "0"),
            date: r.date || r.Date || new Date().toISOString().split("T")[0],
            paymentStatus: (r.paymentStatus || r.Status || "COMPLETED").toUpperCase().includes("PEND")
              ? "PENDING"
              : "COMPLETED",
          }));

          const validRows = rows.filter((r) => r.amount > 0);
          if (validRows.length === 0) {
            setParseError("Could not find valid rows with amounts. Check column names.");
          } else {
            setParsedRows(validRows);
          }
        } catch (err: any) {
          setParseError("Failed to parse CSV file: " + err.message);
        }
      },
      error: (err) => {
        setParseError("CSV parsing error: " + err.message);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const headers = "type,category,description,amount,date,paymentStatus\n";
    const sampleRows = [
      "REVENUE,Sales,Direct Website Sales,1250.00,2026-11-15,COMPLETED",
      "EXPENSE,Ad Spend,Meta Advertising,350.00,2026-11-15,COMPLETED",
      "EXPENSE,Shipping,FedEx Freight Service,120.50,2026-11-16,COMPLETED",
    ].join("\n");

    const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transaction_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (parsedRows.length === 0) return;

    startTransition(async () => {
      try {
        const res = await bulkImportTransactionsAction(tenantSlug, parsedRows);
        if (res.success) {
          onClose();
        } else {
          setParseError(res.error || "Bulk import failed.");
        }
      } catch (err: any) {
        setParseError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Bulk Import Transactions (CSV)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Download Template Bar */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="text-xs text-blue-900">
              <span className="font-semibold">Format required:</span> columns for{" "}
              <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">type</code>,{" "}
              <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">category</code>,{" "}
              <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">description</code>,{" "}
              <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">amount</code>,{" "}
              <code className="bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">date</code>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Template
            </button>
          </div>

          {/* File Upload Zone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20">
            <FileText className="h-10 w-10 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-800">
              {file ? file.name : "Select or drag a CSV file to import"}
            </span>
            <span className="text-xs text-slate-500 mt-1">Supports standard CSV spreadsheets</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              {parseError}
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Preview ({parsedRows.length} valid records found)
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-600">{row.date}</td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                              row.type === "REVENUE"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-700">{row.category}</td>
                        <td className="py-1.5 px-3 text-slate-800 truncate max-w-xs">{row.description}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                          ${row.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Showing first 15 of {parsedRows.length} transactions...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || parsedRows.length === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Import {parsedRows.length} Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

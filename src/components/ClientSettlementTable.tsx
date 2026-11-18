"use client";

import React, { useState, useMemo } from "react";
import { formatUsd, formatSettlement } from "@/lib/calculations";
import { Search, Download, CheckCircle2, Clock } from "lucide-react";

export interface SettlementRecord {
  id: string;
  date: string;
  usdBought: number;
  buyRate: number;
  usdSold: number;
  sellRate: number;
  totalUsdVolume: number;
  totalSettlementAmount: number;
  status: string;
  notes?: string | null;
}

interface ClientSettlementTableProps {
  records: SettlementRecord[];
  currency: string;
  tenantSlug: string;
}

export function ClientSettlementTable({
  records,
  currency,
  tenantSlug,
}: ClientSettlementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const term = searchTerm.toLowerCase();
      const matchesDate = r.date.toLowerCase().includes(term);
      const matchesNotes = (r.notes || "").toLowerCase().includes(term);
      return matchesDate || matchesNotes;
    });
  }, [records, searchTerm]);

  const handleExportCsv = () => {
    const headers = [
      "Date",
      "Dollars Sold",
      "Buy Rate",
      "Dollars Bought",
      "Sell Rate",
      "Total Amount",
      "Currency",
      "Status",
      "Notes",
    ].join(",");

    const rows = filteredRecords.map((r) =>
      [
        `"${r.date}"`,
        r.usdBought,
        r.buyRate,
        r.usdSold,
        r.sellRate,
        r.totalSettlementAmount,
        `"${currency}"`,
        `"${r.status}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
      ].join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fynex_${tenantSlug}_records_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daily Records
            </h3>
            <p className="text-xs text-slate-500">
              List of daily dollar trades and payments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by date or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer shrink-0"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Streamlined Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5">Date</th>
              <th className="py-3 px-4 text-right">Dollars Sold (You got money)</th>
              <th className="py-3 px-4 text-right">Dollars Bought (You paid)</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-5">Note / Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                  No records found matching your search.
                </td>
              </tr>
            ) : (
              filteredRecords.slice().reverse().map((r) => {
                const hasBought = r.usdBought > 0;
                const hasSold = r.usdSold > 0;

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Date & Status */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 text-xs whitespace-nowrap">
                        {r.date}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {r.status === "SETTLED" || r.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                            <Clock className="h-3 w-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dollars Sold (Payout) */}
                    <td className="py-3.5 px-4 text-right">
                      {hasBought ? (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {formatUsd(r.usdBought)}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            Rate: ৳{r.buyRate.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium">—</span>
                      )}
                    </td>

                    {/* Dollars Bought (Delivery) */}
                    <td className="py-3.5 px-4 text-right">
                      {hasSold ? (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {formatUsd(r.usdSold)}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            Rate: ৳{r.sellRate.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium">—</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900 text-xs">
                        {formatSettlement(r.totalSettlementAmount, currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Local Currency
                      </div>
                    </td>

                    {/* Notes / Reference */}
                    <td className="py-3.5 px-5">
                      <span className="text-xs text-slate-600 max-w-xs truncate block">
                        {r.notes || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> daily records
        </span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Sold: Dollars you sold to us
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Bought: Dollars you bought from us
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { formatUsd, formatSettlement } from "@/lib/calculations";
import {
  Search,
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Plus,
} from "lucide-react";
import { DollarTradeModal } from "./DollarTradeModal";

export interface DollarTradeItem {
  id: string;
  tradeNumber?: string | null;
  type: string; // "BUY_USD" | "SELL_USD"
  usdAmount: number;
  exchangeRate: number;
  settlementAmount: number;
  settlementCurrency: string;
  paymentMethod: string;
  paymentStatus: string;
  category: string;
  description: string;
  reference?: string | null;
  date: string;
}

interface DollarTradeTableProps {
  tenantSlug: string;
  trades: DollarTradeItem[];
  currency?: string;
  readOnly?: boolean;
}

export function DollarTradeTable({
  tenantSlug,
  trades,
  currency = "BDT",
  readOnly = false,
}: DollarTradeTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BUY_USD" | "SELL_USD">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        t.description.toLowerCase().includes(term) ||
        (t.tradeNumber && t.tradeNumber.toLowerCase().includes(term)) ||
        (t.reference && t.reference.toLowerCase().includes(term)) ||
        t.date.includes(term);

      const matchesType = typeFilter === "ALL" || t.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || t.paymentStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [trades, searchTerm, typeFilter, statusFilter]);

  // Compute live filtered totals
  const totals = useMemo(() => {
    return filteredTrades.reduce(
      (acc, curr) => {
        acc.usdVolume += curr.usdAmount;
        acc.settlementTotal += curr.settlementAmount;
        if (curr.type === "BUY_USD") {
          acc.soldToFynexUsd += curr.usdAmount;
          acc.soldToFynexSettlement += curr.settlementAmount;
        } else {
          acc.purchasedUsd += curr.usdAmount;
          acc.purchasedSettlement += curr.settlementAmount;
        }
        return acc;
      },
      {
        usdVolume: 0,
        settlementTotal: 0,
        soldToFynexUsd: 0,
        soldToFynexSettlement: 0,
        purchasedUsd: 0,
        purchasedSettlement: 0,
      }
    );
  }, [filteredTrades]);

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      "Transaction ID",
      "Date",
      "Type",
      "USD Amount",
      "Rate",
      "Total Amount",
      "Currency",
      "Payment Method",
      "Status",
      "Reference",
      "Description",
    ].join(",");

    const rows = filteredTrades.map((t) => [
      `"${t.tradeNumber || t.id}"`,
      `"${t.date}"`,
      `"${t.type === "BUY_USD" ? "Sold USD" : "Bought USD"}"`,
      t.usdAmount,
      t.exchangeRate,
      t.settlementAmount,
      `"${t.settlementCurrency}"`,
      `"${t.paymentMethod}"`,
      `"${t.paymentStatus}"`,
      `"${t.reference || ""}"`,
      `"${t.description.replace(/"/g, '""')}"`,
    ].join(","));

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fynex_${tenantSlug}_transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Search, Filter & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white p-2.5 px-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by number, note, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3 text-slate-400 ml-0.5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2 py-1 text-xs font-medium border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="BUY_USD">Dollars Sold (You got money)</option>
              <option value="SELL_USD">Dollars Bought (You paid)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 text-xs font-medium border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredTrades.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtered Live Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Total Dollars
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block leading-tight">
            {formatUsd(totals.usdVolume)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Dollars Sold
          </span>
          <span className="text-sm font-bold text-emerald-700 mt-0.5 block leading-tight">
            {formatUsd(totals.soldToFynexUsd)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Dollars Bought
          </span>
          <span className="text-sm font-bold text-blue-700 mt-0.5 block leading-tight">
            {formatUsd(totals.purchasedUsd)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Total Amount ({currency})
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block leading-tight">
            {formatSettlement(totals.settlementTotal, currency)}
          </span>
        </div>
      </div>

      {/* Main Streamlined 5-Column Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2 px-3.5">Transaction & Date</th>
                <th className="py-2 px-3">Type & Method</th>
                <th className="py-2 px-3 text-right">Dollars & Rate</th>
                <th className="py-2 px-3 text-right">Total Amount ({currency})</th>
                <th className="py-2 px-3.5">Note / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No transactions match your search.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isBuy = t.type === "BUY_USD";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                      {/* Ticket & Date */}
                      <td className="py-2 px-3.5">
                        <div className="font-mono font-bold text-slate-900 text-xs leading-tight">
                          {t.tradeNumber || t.id.substring(0, 10)}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          {t.date}
                        </div>
                      </td>

                      {/* Direction & Payment Method */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isBuy
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                              : "bg-blue-50 text-blue-800 border border-blue-200/70"
                          }`}
                        >
                          {isBuy ? (
                            <>
                              <ArrowDownLeft className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Sold USD</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-2.5 w-2.5 text-blue-600" />
                              <span>Bought USD</span>
                            </>
                          )}
                        </span>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {t.paymentMethod}
                        </div>
                      </td>

                      {/* USD Amount & Executed Rate */}
                      <td className="py-2 px-3 text-right">
                        <div className="font-bold text-slate-900 text-xs leading-tight">
                          {formatUsd(t.usdAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium leading-tight">
                          Rate: ৳{t.exchangeRate.toFixed(2)}
                        </div>
                      </td>

                      {/* Settlement & Status */}
                      <td className="py-2 px-3 text-right">
                        <div className="font-bold text-slate-900 text-xs leading-tight">
                          {formatSettlement(t.settlementAmount, t.settlementCurrency)}
                        </div>
                        <div className="leading-tight mt-0.5">
                          {t.paymentStatus === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700">
                              <ShieldCheck className="h-2.5 w-2.5" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700">
                              <Clock className="h-2.5 w-2.5" /> Pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reference & Description */}
                      <td className="py-2 px-3.5">
                        <div className="font-mono text-xs text-slate-700 max-w-xs truncate leading-tight">
                          {t.reference || "—"}
                        </div>
                        <div className="text-[10px] text-slate-400 max-w-xs truncate leading-tight mt-0.5">
                          {t.description}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-3.5 py-2 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
          <span>
            Showing <strong>{filteredTrades.length}</strong> of <strong>{trades.length}</strong> transactions
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Sold: Dollars you sold to us
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Bought: Dollars you bought from us
            </span>
          </div>
        </div>
      </div>

      {/* Trade Modal for logging new trade */}
      {isModalOpen && (
        <DollarTradeModal
          tenantSlug={tenantSlug}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

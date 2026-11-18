"use client";

import React, { useState, useTransition, useMemo } from "react";
import { batchSaveDollarDailyAction } from "@/actions/admin";
import { calculateDailyDollarMetrics, formatSettlement } from "@/lib/calculations";
import {
  Check,
  Calendar,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  slug: string;
  clientType: string;
  settlementCurrency: string;
  defaultBuyRate: number;
  defaultSellRate: number;
  usdBought?: number;
  buyRate?: number;
  usdSold?: number;
  sellRate?: number;
  status?: string;
  notes?: string;
}

interface BatchEntryGridProps {
  clients: ClientRow[];
  initialDate: string;
}

interface RowState {
  usdBought: string;
  buyRate: string;
  usdSold: string;
  sellRate: string;
  status: string;
  notes: string;
}

export function BatchEntryGrid({ clients, initialDate }: BatchEntryGridProps) {
  const [date, setDate] = useState(initialDate);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form state per client
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const initial: Record<string, RowState> = {};
    clients.forEach((c) => {
      initial[c.id] = {
        usdBought: c.usdBought !== undefined && c.usdBought > 0 ? String(c.usdBought) : "",
        buyRate: c.buyRate ? String(c.buyRate) : String(c.defaultBuyRate),
        usdSold: c.usdSold !== undefined && c.usdSold > 0 ? String(c.usdSold) : "",
        sellRate: c.sellRate ? String(c.sellRate) : String(c.defaultSellRate),
        status: c.status || "SETTLED",
        notes: c.notes || "",
      };
    });
    return initial;
  });

  const handleFieldChange = (clientId: string, field: keyof RowState, value: string) => {
    setRows((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: value,
      },
    }));
    setSuccessMessage(null);
  };

  const handlePreFillRealistic = () => {
    setRows((prev) => {
      const updated = { ...prev };
      clients.forEach((c) => {
        let b = "0";
        let s = "0";
        let br = String(c.defaultBuyRate);
        let sr = String(c.defaultSellRate);

        if (c.clientType === "EXPORTER" || c.name.toLowerCase().includes("robin")) {
          b = "4800";
          s = "0";
          br = "121.75";
        } else if (c.clientType === "IMPORTER" || c.name.toLowerCase().includes("rigan")) {
          b = "0";
          s = "6500";
          sr = "123.10";
        } else {
          b = "3500";
          s = "2800";
          br = "121.80";
          sr = "122.95";
        }

        updated[c.id] = {
          usdBought: b,
          buyRate: br,
          usdSold: s,
          sellRate: sr,
          status: "SETTLED",
          notes: `Daily FX trade settlement via Bank Wire on ${date}`,
        };
      });
      return updated;
    });
  };

  // Compute live totals across all client rows
  const { totalBatchBought, totalBatchSold, totalBatchSettlement, totalBatchProfit } =
    useMemo(() => {
      let boughtSum = 0;
      let soldSum = 0;
      let settlementSum = 0;
      let profitSum = 0;

      clients.forEach((c) => {
        const r = rows[c.id];
        if (!r) return;
        const bought = parseFloat(r.usdBought) || 0;
        const buyRate = parseFloat(r.buyRate) || c.defaultBuyRate;
        const sold = parseFloat(r.usdSold) || 0;
        const sellRate = parseFloat(r.sellRate) || c.defaultSellRate;
        const metrics = calculateDailyDollarMetrics(bought, buyRate, sold, sellRate);

        boughtSum += bought;
        soldSum += sold;
        settlementSum += metrics.totalSettlementAmount;
        profitSum += metrics.netProfit;
      });

      return {
        totalBatchBought: boughtSum,
        totalBatchSold: soldSum,
        totalBatchSettlement: settlementSum,
        totalBatchProfit: profitSum,
      };
    }, [clients, rows]);

  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const entries = clients.map((c) => {
      const r = rows[c.id] || {
        usdBought: "0",
        buyRate: String(c.defaultBuyRate),
        usdSold: "0",
        sellRate: String(c.defaultSellRate),
        status: "SETTLED",
        notes: "",
      };
      return {
        tenantId: c.id,
        usdBought: parseFloat(r.usdBought) || 0,
        buyRate: parseFloat(r.buyRate) || c.defaultBuyRate,
        usdSold: parseFloat(r.usdSold) || 0,
        sellRate: parseFloat(r.sellRate) || c.defaultSellRate,
        status: r.status,
        notes: r.notes || undefined,
      };
    });

    startTransition(async () => {
      try {
        const res = await batchSaveDollarDailyAction(date, entries);
        if (res.success) {
          setSuccessMessage(`Successfully saved dollar records for ${res.count} clients on ${date}!`);
        } else {
          setErrorMessage("Failed to save records.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  const getClientTypeBadge = (type: string) => {
    if (type.includes("EXPORTER")) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
          <ArrowDownLeft className="h-2.5 w-2.5" /> Sells USD
        </span>
      );
    }
    if (type.includes("IMPORTER")) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
          <ArrowUpRight className="h-2.5 w-2.5" /> Buys USD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
        Buys & Sells
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmitAll} className="space-y-3">
      {/* Date Header & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 px-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <label htmlFor="fx-business-date" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Settlement Trade Date
            </label>
            <input
              id="fx-business-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSuccessMessage(null);
              }}
              className="text-xs font-bold text-slate-900 bg-transparent border-0 focus:outline-hidden p-0 cursor-pointer"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreFillRealistic}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Fill Sample Data</span>
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save All Entries</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Calculated Batch Totals Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Total Dollars Traded
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block leading-tight">
            ${(totalBatchBought + totalBatchSold).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Dollars Bought (Inflow)
          </span>
          <span className="text-sm font-bold text-emerald-700 mt-0.5 block leading-tight">
            ${totalBatchBought.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Dollars Sold (Outflow)
          </span>
          <span className="text-sm font-bold text-blue-700 mt-0.5 block leading-tight">
            ${totalBatchSold.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wider">
            Total Paid & Profit
          </span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block leading-tight">
            ৳{totalBatchSettlement.toLocaleString()}{" "}
            <span className="text-[11px] text-emerald-600 font-semibold">
              (+৳{totalBatchProfit.toLocaleString()})
            </span>
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Multi-Client Batch Entry Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2 px-3.5 min-w-[190px]">Client Name</th>
                <th className="py-2 px-2.5 w-32">Dollars Bought ($)</th>
                <th className="py-2 px-2.5 w-28">Buy Rate (৳)</th>
                <th className="py-2 px-2.5 w-32">Dollars Sold ($)</th>
                <th className="py-2 px-2.5 w-28">Sell Rate (৳)</th>
                <th className="py-2 px-3 text-right w-36">Total Paid & Profit</th>
                <th className="py-2 px-2.5 w-24">Status</th>
                <th className="py-2 px-3.5 min-w-[160px]">Note / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => {
                const r = rows[c.id] || {
                  usdBought: "",
                  buyRate: String(c.defaultBuyRate),
                  usdSold: "",
                  sellRate: String(c.defaultSellRate),
                  status: "SETTLED",
                  notes: "",
                };
                const bought = parseFloat(r.usdBought) || 0;
                const buyRate = parseFloat(r.buyRate) || c.defaultBuyRate;
                const sold = parseFloat(r.usdSold) || 0;
                const sellRate = parseFloat(r.sellRate) || c.defaultSellRate;
                const metrics = calculateDailyDollarMetrics(bought, buyRate, sold, sellRate);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition group">
                    {/* Client Identity */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {c.name}
                            </span>
                            {getClientTypeBadge(c.clientType)}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            Base: ৳{c.defaultBuyRate.toFixed(2)} / ৳{c.defaultSellRate.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dollars Bought */}
                    <td className="py-2 px-2.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs font-semibold text-slate-400 select-none">
                          $
                        </span>
                        <input
                          type="number"
                          step="1"
                          placeholder="0"
                          value={r.usdBought}
                          onChange={(e) => handleFieldChange(c.id, "usdBought", e.target.value)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-bold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-slate-900"
                        />
                      </div>
                    </td>

                    {/* Buy Rate */}
                    <td className="py-2 px-2.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs font-semibold text-emerald-600 select-none">
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={c.defaultBuyRate.toFixed(2)}
                          value={r.buyRate}
                          onChange={(e) => handleFieldChange(c.id, "buyRate", e.target.value)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-semibold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-emerald-800"
                        />
                      </div>
                    </td>

                    {/* Dollars Sold */}
                    <td className="py-2 px-2.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs font-semibold text-slate-400 select-none">
                          $
                        </span>
                        <input
                          type="number"
                          step="1"
                          placeholder="0"
                          value={r.usdSold}
                          onChange={(e) => handleFieldChange(c.id, "usdSold", e.target.value)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-bold border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-slate-900"
                        />
                      </div>
                    </td>

                    {/* Sell Rate */}
                    <td className="py-2 px-2.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs font-semibold text-blue-600 select-none">
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={c.defaultSellRate.toFixed(2)}
                          value={r.sellRate}
                          onChange={(e) => handleFieldChange(c.id, "sellRate", e.target.value)}
                          className="w-full pl-5 pr-2 py-1 text-xs font-semibold border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-blue-800"
                        />
                      </div>
                    </td>

                    {/* Total Paid & Profit */}
                    <td className="py-2 px-3 text-right whitespace-nowrap leading-tight">
                      <div className="font-bold text-xs text-slate-900">
                        {formatSettlement(metrics.totalSettlementAmount, c.settlementCurrency)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        +{formatSettlement(metrics.netProfit, c.settlementCurrency)} profit
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-2.5">
                      <select
                        value={r.status}
                        onChange={(e) => handleFieldChange(c.id, "status", e.target.value)}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="SETTLED">Settled</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-3.5">
                      <input
                        type="text"
                        placeholder="Bank wire, Swift MT103..."
                        value={r.notes}
                        onChange={(e) => handleFieldChange(c.id, "notes", e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-slate-700 placeholder-slate-400"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-3.5 py-2 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
          <span>
            Showing <strong>{clients.length}</strong> registered clients for <strong>{date}</strong>
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Bought: Dollars received from client
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Sold: Dollars given to client
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { batchSaveDollarDailyAction } from "@/actions/admin";
import { calculateDailyDollarMetrics, formatSettlement } from "@/lib/calculations";
import { Check, Calendar, Loader2, Sparkles, AlertCircle, Building2 } from "lucide-react";

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

        if (c.clientType === "EXPORTER") {
          b = "4800";
          s = "0";
          br = "121.75";
        } else if (c.clientType === "IMPORTER") {
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
          setSuccessMessage(`Successfully updated Dollar Buy/Sell settlements for ${res.count} clients on ${date}!`);
        } else {
          setErrorMessage("Failed to save records.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmitAll} className="space-y-6">
      {/* Date Header & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <label htmlFor="fx-business-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
              className="mt-0.5 text-base font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-600 focus:outline-hidden pb-0.5 bg-transparent"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreFillRealistic}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Fill Sample Data
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Save All Entries
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Multi-Client Batch Entry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4 min-w-[200px]">Client Name</th>
                <th className="py-3.5 px-3 w-32">Dollars Bought ($)</th>
                <th className="py-3.5 px-3 w-28">Buy Rate (৳)</th>
                <th className="py-3.5 px-3 w-32">Dollars Sold ($)</th>
                <th className="py-3.5 px-3 w-28">Sell Rate (৳)</th>
                <th className="py-3.5 px-3 w-36">Total Paid</th>
                <th className="py-3.5 px-3 w-28">Profit</th>
                <th className="py-3.5 px-3 w-28">Status</th>
                <th className="py-3.5 px-4 min-w-[180px]">Note / Ref</th>
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
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-xs">
                              {c.clientType}
                            </span>
                            <span>• Base: ৳{c.defaultBuyRate}/৳{c.defaultSellRate}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="1"
                        placeholder="0"
                        value={r.usdBought}
                        onChange={(e) => handleFieldChange(c.id, "usdBought", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-bold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-slate-900"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="121.50"
                        value={r.buyRate}
                        onChange={(e) => handleFieldChange(c.id, "buyRate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-semibold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-emerald-800"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="1"
                        placeholder="0"
                        value={r.usdSold}
                        onChange={(e) => handleFieldChange(c.id, "usdSold", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-bold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-slate-900"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="122.80"
                        value={r.sellRate}
                        onChange={(e) => handleFieldChange(c.id, "sellRate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-semibold border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-blue-800"
                      />
                    </td>

                    <td className="py-3 px-3 text-xs font-bold text-slate-900">
                      {formatSettlement(metrics.totalSettlementAmount, c.settlementCurrency)}
                    </td>

                    <td className="py-3 px-3 text-xs font-bold text-amber-700">
                      {formatSettlement(metrics.netProfit, c.settlementCurrency)}
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={r.status}
                        onChange={(e) => handleFieldChange(c.id, "status", e.target.value)}
                        className="w-full px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="SETTLED">Settled</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Bank wire, Swift MT103..."
                        value={r.notes}
                        onChange={(e) => handleFieldChange(c.id, "notes", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:border-emerald-500 focus:outline-hidden bg-white text-slate-800"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}

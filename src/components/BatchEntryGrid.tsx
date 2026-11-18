"use client";

import React, { useState, useTransition } from "react";
import { batchSaveDailyRecordsAction } from "@/actions/admin";
import { calculateDailyMetrics } from "@/lib/calculations";
import { Check, Calendar, Loader2, Sparkles, AlertCircle, Building2 } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  slug: string;
  platformFeePercent: number;
  currency: string;
  defaultGross?: number;
  defaultCogs?: number;
  defaultOpex?: number;
  defaultNotes?: string;
}

interface BatchEntryGridProps {
  clients: ClientRow[];
  initialDate: string;
}

interface RowState {
  grossSales: string;
  cogs: string;
  operatingExpenses: string;
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
        grossSales: c.defaultGross ? String(c.defaultGross) : "",
        cogs: c.defaultCogs ? String(c.defaultCogs) : "",
        operatingExpenses: c.defaultOpex ? String(c.defaultOpex) : "",
        notes: c.defaultNotes || "",
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

  const handlePreFillSample = () => {
    setRows((prev) => {
      const updated = { ...prev };
      clients.forEach((c) => {
        const sampleGross = c.slug.includes("nexus") ? 4500 : c.slug.includes("vanguard") ? 6200 : 3200;
        const sampleCogs = Number((sampleGross * (c.slug.includes("nexus") ? 0.25 : 0.45)).toFixed(2));
        const sampleOpex = 450;
        updated[c.id] = {
          grossSales: String(sampleGross),
          cogs: String(sampleCogs),
          operatingExpenses: String(sampleOpex),
          notes: `Batch daily settlement for ${date}`,
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
      const r = rows[c.id] || { grossSales: "0", cogs: "0", operatingExpenses: "0", notes: "" };
      return {
        tenantId: c.id,
        grossSales: parseFloat(r.grossSales) || 0,
        cogs: parseFloat(r.cogs) || 0,
        operatingExpenses: parseFloat(r.operatingExpenses) || 0,
        notes: r.notes || undefined,
      };
    });

    startTransition(async () => {
      try {
        const res = await batchSaveDailyRecordsAction(date, entries);
        if (res.success) {
          setSuccessMessage(`Successfully updated daily records for ${res.count} clients on ${date}!`);
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
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <label htmlFor="business-date" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Settlement Business Date
            </label>
            <input
              id="business-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSuccessMessage(null);
              }}
              className="mt-0.5 text-base font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-blue-600 focus:outline-hidden pb-0.5 bg-transparent"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreFillSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Auto-Fill Sample Data
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Save All Client Data
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
                <th className="py-3.5 px-4">Client Business</th>
                <th className="py-3.5 px-4 w-36">Gross Sales ($)</th>
                <th className="py-3.5 px-4 w-36">COGS ($)</th>
                <th className="py-3.5 px-4 w-36">OpEx ($)</th>
                <th className="py-3.5 px-4 w-32">Platform Cut</th>
                <th className="py-3.5 px-4 w-36">Live Net Profit</th>
                <th className="py-3.5 px-4 w-28">Margin %</th>
                <th className="py-3.5 px-4 min-w-[180px]">Operational Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => {
                const r = rows[c.id] || { grossSales: "", cogs: "", operatingExpenses: "", notes: "" };
                const gross = parseFloat(r.grossSales) || 0;
                const cogs = parseFloat(r.cogs) || 0;
                const opex = parseFloat(r.operatingExpenses) || 0;
                const metrics = calculateDailyMetrics(gross, cogs, opex, c.platformFeePercent);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Fee rate: {c.platformFeePercent}%
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={r.grossSales}
                        onChange={(e) => handleFieldChange(c.id, "grossSales", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-medium border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-slate-900"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={r.cogs}
                        onChange={(e) => handleFieldChange(c.id, "cogs", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-medium border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-slate-900"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={r.operatingExpenses}
                        onChange={(e) => handleFieldChange(c.id, "operatingExpenses", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-medium border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-slate-900"
                      />
                    </td>

                    <td className="py-3 px-4 text-xs font-semibold text-amber-700">
                      ${metrics.platformFee.toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-bold text-sm ${
                          metrics.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        ${metrics.netProfit.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          metrics.marginPercentage >= 20
                            ? "bg-emerald-50 text-emerald-700"
                            : metrics.marginPercentage > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {metrics.marginPercentage.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Settlement notes..."
                        value={r.notes}
                        onChange={(e) => handleFieldChange(c.id, "notes", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:border-blue-500 focus:outline-hidden bg-white text-slate-800"
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

"use client";

import React, { useState, useTransition } from "react";
import { createDollarTradeAction } from "@/actions/client";
import { X, Check, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface DollarTradeModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DollarTradeModal({ tenantSlug, isOpen, onClose }: DollarTradeModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "BUY_USD" as "BUY_USD" | "SELL_USD",
    usdAmount: 1000,
    exchangeRate: 122.0,
    paymentMethod: "Bank Wire",
    paymentStatus: "COMPLETED" as "COMPLETED" | "PENDING",
    description: "",
    reference: "",
    date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const settlementPreview = (formData.usdAmount * formData.exchangeRate).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.usdAmount || formData.usdAmount <= 0) {
      setError("Please enter a valid USD amount.");
      return;
    }
    if (!formData.exchangeRate || formData.exchangeRate <= 0) {
      setError("Please enter a valid exchange rate.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createDollarTradeAction(tenantSlug, {
          type: formData.type,
          usdAmount: formData.usdAmount,
          exchangeRate: formData.exchangeRate,
          paymentMethod: formData.paymentMethod,
          paymentStatus: formData.paymentStatus,
          description: formData.description || (formData.type === "BUY_USD" ? "USD Sold to FynEX" : "USD Purchase from FynEX"),
          reference: formData.reference || undefined,
          date: formData.date,
        });

        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Failed to create trade.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Add New Transaction</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Trade Direction Toggle */}
          <div>
            <label className="block font-semibold text-slate-600 uppercase mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "BUY_USD" })}
                className={`py-2 px-3 font-bold rounded-lg border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  formData.type === "BUY_USD"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Sold USD
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "SELL_USD" })}
                className={`py-2 px-3 font-bold rounded-lg border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  formData.type === "SELL_USD"
                    ? "bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Bought USD
              </button>
            </div>
          </div>

          {/* USD Amount & Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                USD Amount ($)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.usdAmount}
                onChange={(e) => setFormData({ ...formData, usdAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                Rate (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Settlement Preview Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total Amount (৳):</span>
            <span className="text-base font-bold text-slate-900">৳{settlementPreview}</span>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="Bank Wire">Bank Wire</option>
                <option value="Cash Settlement">Cash</option>
                <option value="Wise / Payoneer">Wise / Payoneer</option>
                <option value="Crypto USDT">USDT</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                Note / Ref #
              </label>
              <input
                type="text"
                placeholder="e.g. Bank wire note"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

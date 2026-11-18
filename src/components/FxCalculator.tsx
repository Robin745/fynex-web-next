"use client";

import React, { useState } from "react";
import { formatUsd, formatSettlement } from "@/lib/calculations";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface FxCalculatorProps {
  defaultBuyRate: number;
  defaultSellRate: number;
  currency: string;
  clientName: string;
}

export function FxCalculator({
  defaultBuyRate,
  defaultSellRate,
  currency,
  clientName,
}: FxCalculatorProps) {
  const [mode, setMode] = useState<"SELL_USD" | "BUY_USD">("SELL_USD");
  const [usdAmount, setUsdAmount] = useState<string>("2500");
  const [localAmount, setLocalAmount] = useState<string>("");
  const [activeInput, setActiveInput] = useState<"USD" | "LOCAL">("USD");

  const activeRate = mode === "SELL_USD" ? defaultBuyRate : defaultSellRate;

  // Compute outputs
  let computedLocal = 0;
  let computedUsd = 0;

  if (activeInput === "USD") {
    const u = parseFloat(usdAmount) || 0;
    computedLocal = Number((u * activeRate).toFixed(2));
    computedUsd = u;
  } else {
    const l = parseFloat(localAmount) || 0;
    computedUsd = activeRate > 0 ? Number((l / activeRate).toFixed(2)) : 0;
    computedLocal = l;
  }

  const handleUsdChange = (val: string) => {
    setUsdAmount(val);
    setActiveInput("USD");
    const u = parseFloat(val) || 0;
    setLocalAmount(u > 0 ? (u * activeRate).toFixed(2) : "");
  };

  const handleLocalChange = (val: string) => {
    setLocalAmount(val);
    setActiveInput("LOCAL");
    const l = parseFloat(val) || 0;
    setUsdAmount(l > 0 && activeRate > 0 ? (l / activeRate).toFixed(2) : "");
  };

  const switchMode = (newMode: "SELL_USD" | "BUY_USD") => {
    setMode(newMode);
    const newRate = newMode === "SELL_USD" ? defaultBuyRate : defaultSellRate;
    if (activeInput === "USD") {
      const u = parseFloat(usdAmount) || 0;
      setLocalAmount(u > 0 ? (u * newRate).toFixed(2) : "");
    } else {
      const l = parseFloat(localAmount) || 0;
      setUsdAmount(l > 0 && newRate > 0 ? (l / newRate).toFixed(2) : "");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Mode Selector Tabs */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => switchMode("SELL_USD")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mode === "SELL_USD"
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sell USD (You get money)</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode("BUY_USD")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              mode === "BUY_USD"
                ? "bg-white text-blue-800 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
            <span>Buy USD (You pay money)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Today&apos;s Rate:</span>
          <span className="font-bold text-slate-900 text-sm">
            ৳{activeRate.toFixed(2)}
            <span className="text-[11px] font-normal text-slate-400 ml-1">/ USD</span>
          </span>
        </div>
      </div>

      {/* Main Conversion Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* USD Input Box */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">
                USD Amount ($)
              </label>
              <span className="text-[11px] text-slate-400">Dollars to exchange</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0.00"
                value={usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-lg font-bold text-slate-900 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[500, 1000, 2500, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUsdChange(String(preset))}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  +${preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Local Currency Input Box */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">
                Amount in ৳ ({currency})
              </label>
              <span className="text-[11px] text-slate-400">Total in local money</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0.00"
                value={localAmount || (computedLocal > 0 ? String(computedLocal) : "")}
                onChange={(e) => handleLocalChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-lg font-bold text-slate-900 border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleLocalChange(String(preset))}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  +৳{(preset / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-950">
              {mode === "SELL_USD"
                ? "You will receive in local currency:"
                : "Total you need to pay in local currency:"}
            </div>
            <div className="text-xs text-emerald-700 mt-0.5">
              Based on {formatUsd(computedUsd)} at rate of ৳{activeRate.toFixed(2)} per dollar
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xl font-bold text-emerald-900">
              {formatSettlement(computedLocal, currency)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              Same-day bank payment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

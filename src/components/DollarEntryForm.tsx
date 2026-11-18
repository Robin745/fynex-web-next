"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDailyDollarEntryAction } from "@/actions/admin";
import {
  Building2,
  Calendar,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  FileText,
  TrendingUp,
} from "lucide-react";

export interface ClientOption {
  id: string;
  name: string;
  slug: string;
  clientType: string; // 'SELLER' | 'BUYER' | 'BOTH'
  settlementCurrency: string;
  defaultBuyRate: number;
  defaultSellRate: number;
}

interface DollarEntryFormProps {
  clients: ClientOption[];
  initialDate: string;
}

export function DollarEntryForm({ clients, initialDate }: DollarEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    clients[0]?.id || ""
  );

  const selectedClient = clients.find((c) => c.id === selectedTenantId) || clients[0];

  // Initialize trade direction based on client type
  const initialType: "BUY_USD" | "SELL_USD" =
    selectedClient?.clientType === "BUYER" ? "SELL_USD" : "BUY_USD";

  const [type, setType] = useState<"BUY_USD" | "SELL_USD">(initialType);
  const [date, setDate] = useState<string>(initialDate);
  const [usdAmount, setUsdAmount] = useState<string>("5000");
  const [exchangeRate, setExchangeRate] = useState<string>(
    selectedClient
      ? (initialType === "BUY_USD"
          ? selectedClient.defaultBuyRate
          : selectedClient.defaultSellRate
        ).toFixed(2)
      : "122.00"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Wire");
  const [paymentStatus, setPaymentStatus] = useState<"COMPLETED" | "PENDING">("COMPLETED");
  const [notes, setNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle client selection change
  const handleSelectClient = (clientId: string) => {
    setSelectedTenantId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    let newType = type;
    if (client.clientType === "SELLER") {
      newType = "BUY_USD";
      setType("BUY_USD");
    } else if (client.clientType === "BUYER") {
      newType = "SELL_USD";
      setType("SELL_USD");
    }

    const rate = newType === "BUY_USD" ? client.defaultBuyRate : client.defaultSellRate;
    setExchangeRate(rate.toFixed(2));
  };

  // Handle direction change
  const handleToggleType = (newType: "BUY_USD" | "SELL_USD") => {
    setType(newType);
    if (selectedClient) {
      const rate =
        newType === "BUY_USD"
          ? selectedClient.defaultBuyRate
          : selectedClient.defaultSellRate;
      setExchangeRate(rate.toFixed(2));
    }
  };

  // Quick amount helper
  const handleSetAmount = (amt: number) => {
    setUsdAmount(String(amt));
  };

  const handleAddAmount = (amt: number) => {
    const current = parseFloat(usdAmount) || 0;
    setUsdAmount(String(current + amt));
  };

  // Fill sample data
  const handleFillSample = () => {
    const sampleClient = clients.find((c) => c.name.includes("Robin")) || clients[0];
    if (sampleClient) {
      setSelectedTenantId(sampleClient.id);
      setType("BUY_USD");
      setUsdAmount("10000");
      setExchangeRate(sampleClient.defaultBuyRate.toFixed(2));
      setPaymentMethod("Bank Wire");
      setPaymentStatus("COMPLETED");
      setNotes("Daily export proceeds trade");
      setError(null);
    }
  };

  // Live calculations
  const parsedUsd = parseFloat(usdAmount) || 0;
  const parsedRate = parseFloat(exchangeRate) || 0;
  const settlementTotal = parsedUsd * parsedRate;

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTenantId) {
      setError("Please select a client.");
      return;
    }
    if (parsedUsd <= 0) {
      setError("Please enter a valid dollar amount greater than 0.");
      return;
    }
    if (parsedRate <= 0) {
      setError("Please enter a valid exchange rate.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createDailyDollarEntryAction({
          tenantId: selectedTenantId,
          type,
          usdAmount: parsedUsd,
          exchangeRate: parsedRate,
          paymentMethod,
          paymentStatus,
          notes: notes.trim() || undefined,
          date,
        });

        if (res.success) {
          setSuccess("Transaction saved successfully! Returning to Overview...");
          setTimeout(() => {
            router.push("/admin");
            router.refresh();
          }, 800);
        } else {
          setError(res.error || "Failed to save dollar entry.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={handleFillSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Fill Sample Data</span>
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Action Failed:</span> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Main Form Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Client Selection */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>1. Select Client</span>
              </label>
              <span className="text-xs text-slate-500">
                Choose the business partner for this trade
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {clients.map((client) => {
                const isSelected = client.id === selectedTenantId;
                const isSeller = client.clientType === "SELLER";
                const isBuyer = client.clientType === "BUYER";

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">
                          {client.name}
                        </span>
                        {isSelected && (
                          <div className="h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>

                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          isSeller
                            ? "bg-amber-100 text-amber-800"
                            : isBuyer
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {isSeller
                          ? "Sells USD"
                          : isBuyer
                          ? "Buys USD"
                          : "Buys & Sells USD"}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                      <span>Rate:</span>
                      <span className="font-semibold text-slate-700">
                        ৳{isBuyer ? client.defaultSellRate.toFixed(2) : client.defaultBuyRate.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Transaction Direction & Date */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>2. Trade Direction & Date</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleType("BUY_USD")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  type === "BUY_USD"
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    type === "BUY_USD"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Dollars Bought (Inflow)
                  </div>
                  <div className="text-xs text-slate-500">
                    You receive USD, pay BDT to client
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleType("SELL_USD")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  type === "SELL_USD"
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    type === "SELL_USD"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Dollars Sold (Outflow)
                  </div>
                  <div className="text-xs text-slate-500">
                    You send USD, receive BDT from client
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Amounts & Exchange Rate */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>3. Amount & Exchange Rate</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dollar Amount */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Dollar Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    $
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Amount quick chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[1000, 5000, 10000, 25000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleSetAmount(chip)}
                      className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                    >
                      ${chip.toLocaleString()}
                    </button>
                  ))}
                  <button
                    key="add5k"
                    type="button"
                    onClick={() => handleAddAmount(5000)}
                    className="px-2 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition cursor-pointer"
                  >
                    +$5,000
                  </button>
                </div>
              </div>

              {/* Exchange Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Exchange Rate (BDT)
                  </label>
                  {selectedClient && (
                    <button
                      type="button"
                      onClick={() => {
                        const r =
                          type === "BUY_USD"
                            ? selectedClient.defaultBuyRate
                            : selectedClient.defaultSellRate;
                        setExchangeRate(r.toFixed(2));
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                    >
                      Reset: ৳
                      {(type === "BUY_USD"
                        ? selectedClient.defaultBuyRate
                        : selectedClient.defaultSellRate
                      ).toFixed(2)}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    ৳
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="e.g. 122.00"
                    required
                    className="w-full pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Rate per 1 USD for this transaction.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Payment & Reference Info */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>4. Payment & Reference (Optional)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Bank Wire">Bank Wire Transfer</option>
                  <option value="BEFTN / EFT">BEFTN / EFT</option>
                  <option value="Cash Settlement">Cash Settlement</option>
                  <option value="bKash / MFS">bKash / Mobile Financial Service</option>
                  <option value="Account Offset">Account Offset</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="COMPLETED">Completed (Settled)</option>
                  <option value="PENDING">Pending Settlement</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Reference Memo or Notes</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Tranche 2 export remittance, Cheque #4928"
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs sticky top-4 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Transaction Preview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time settlement calculation
              </p>
            </div>

            {/* Calculations Card */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Client</span>
                <span className="font-bold text-slate-800">
                  {selectedClient?.name || "None"}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Direction</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    type === "BUY_USD"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {type === "BUY_USD" ? "Dollars Bought" : "Dollars Sold"}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Dollar Amount</span>
                <span className="font-semibold text-slate-900">
                  ${parsedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Rate (৳/$)</span>
                <span className="font-semibold text-slate-900">
                  ৳{parsedRate.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-[11px] text-slate-500 mb-1">
                  {type === "BUY_USD"
                    ? "Total BDT Payout to Client"
                    : "Total BDT to Receive"}
                </div>
                <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                  ৳{settlementTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 text-slate-500 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Saving creates an audit record, adds the transaction to the client history, and updates the Overview totals.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isPending || parsedUsd <= 0 || parsedRate <= 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Transaction...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Transaction</span>
                  </>
                )}
              </button>

              <Link
                href="/admin"
                className="w-full flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

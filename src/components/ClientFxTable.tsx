"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatUsd, formatSettlement } from "@/lib/calculations";
import {
  Search,
  ExternalLink,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export interface ClientSummaryItem {
  tenant: {
    id: string;
    name: string;
    slug: string;
    clientType: string;
    contactEmail: string;
    settlementCurrency: string;
    defaultBuyRate: number;
    defaultSellRate: number;
  };
  totalUsdVolume: number;
  totalUsdBought: number;
  totalUsdSold: number;
  avgBuyRate: number;
  avgSellRate: number;
  totalSettlementAmount: number;
  totalSpreadProfit: number;
  lastRecordDate: string;
}

interface ClientFxTableProps {
  clients: ClientSummaryItem[];
}

export function ClientFxTable({ clients }: ClientFxTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const filteredClients = useMemo(() => {
    return clients.filter((item) => {
      const matchesSearch =
        item.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tenant.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        selectedType === "ALL" ||
        item.tenant.clientType === selectedType ||
        (selectedType === "EXPORTER" && item.tenant.clientType.includes("EXPORTER")) ||
        (selectedType === "IMPORTER" && item.tenant.clientType.includes("IMPORTER")) ||
        (selectedType === "DUAL_TRADER" && item.tenant.clientType.includes("DUAL"));

      return matchesSearch && matchesType;
    });
  }, [clients, searchQuery, selectedType]);

  const typeCounts = useMemo(() => {
    return {
      ALL: clients.length,
      EXPORTER: clients.filter((c) => c.tenant.clientType.includes("EXPORTER")).length,
      IMPORTER: clients.filter((c) => c.tenant.clientType.includes("IMPORTER")).length,
      DUAL_TRADER: clients.filter((c) => c.tenant.clientType.includes("DUAL")).length,
    };
  }, [clients]);

  const getClientTypeBadge = (type: string) => {
    if (type.includes("EXPORTER")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
          <ArrowDownLeft className="h-2.5 w-2.5" /> Sells USD
        </span>
      );
    }
    if (type.includes("IMPORTER")) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
          <ArrowUpRight className="h-2.5 w-2.5" /> Buys USD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
        Buys & Sells
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Controls & Filter Bar */}
      <div className="p-2.5 px-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/40">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              selectedType === "ALL"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            All Clients ({typeCounts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("EXPORTER")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              selectedType === "EXPORTER"
                ? "bg-white text-emerald-800 shadow-xs border border-emerald-200"
                : "text-slate-600 hover:text-emerald-800 hover:bg-slate-100/70"
            }`}
          >
            Dollar Sellers ({typeCounts.EXPORTER})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("IMPORTER")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              selectedType === "IMPORTER"
                ? "bg-white text-blue-800 shadow-xs border border-blue-200"
                : "text-slate-600 hover:text-blue-800 hover:bg-slate-100/70"
            }`}
          >
            Dollar Buyers ({typeCounts.IMPORTER})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("DUAL_TRADER")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              selectedType === "DUAL_TRADER"
                ? "bg-white text-purple-800 shadow-xs border border-purple-200"
                : "text-slate-600 hover:text-purple-800 hover:bg-slate-100/70"
            }`}
          >
            Both ({typeCounts.DUAL_TRADER})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-60">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search client or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-2 px-3.5">Client Name</th>
              <th className="py-2 px-3 text-right">Dollars Bought</th>
              <th className="py-2 px-3 text-right">Dollars Sold</th>
              <th className="py-2 px-3 text-right">Total Paid & Profit</th>
              <th className="py-2 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No clients found matching your search.
                </td>
              </tr>
            ) : (
              filteredClients.map((c) => {
                const hasBought = c.totalUsdBought > 0;
                const hasSold = c.totalUsdSold > 0;

                return (
                  <tr
                    key={c.tenant.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Client Identity */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {c.tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/clients/${c.tenant.slug}`}
                              className="font-semibold text-xs text-slate-900 hover:text-emerald-700 transition truncate"
                            >
                              {c.tenant.name}
                            </Link>
                            {getClientTypeBadge(c.tenant.clientType)}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight truncate">
                            {c.tenant.contactEmail} • Last trade: {c.lastRecordDate}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Dollars Bought */}
                    <td className="py-2 px-3 text-right">
                      {hasBought ? (
                        <div className="leading-tight">
                          <div className="font-bold text-xs text-slate-900">
                            {formatUsd(c.totalUsdBought)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Rate: ৳{c.avgBuyRate.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium text-xs">—</span>
                      )}
                    </td>

                    {/* Dollars Sold */}
                    <td className="py-2 px-3 text-right">
                      {hasSold ? (
                        <div className="leading-tight">
                          <div className="font-bold text-xs text-slate-900">
                            {formatUsd(c.totalUsdSold)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Rate: ৳{c.avgSellRate.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-medium text-xs">—</span>
                      )}
                    </td>

                    {/* Total Paid & Profit */}
                    <td className="py-2 px-3 text-right">
                      <div className="leading-tight">
                        <div className="font-bold text-xs text-slate-900">
                          {formatSettlement(c.totalSettlementAmount, c.tenant.settlementCurrency)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          +{formatSettlement(c.totalSpreadProfit, c.tenant.settlementCurrency)} profit
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/portal/${c.tenant.slug}`}
                          target="_blank"
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                          title="Open Client View"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/admin/clients/${c.tenant.slug}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-md transition"
                        >
                          <span>Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
        <span>
          Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> clients
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
  );
}

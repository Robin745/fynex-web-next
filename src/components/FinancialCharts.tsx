"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DailyChartData {
  date: string;
  grossSales: number;
  cogs: number;
  operatingExpenses: number;
  platformFee: number;
  netProfit: number;
  marginPercentage: number;
}

interface FinancialChartsProps {
  data: DailyChartData[];
  currency?: string;
}

export function FinancialCharts({ data, currency = "$" }: FinancialChartsProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No financial performance history available for charting yet.
      </div>
    );
  }

  // Format date display (e.g., "Nov 14")
  const formattedData = data.map((d) => {
    let label = d.date;
    try {
      const parts = d.date.split("-");
      if (parts.length === 3) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const m = parseInt(parts[1], 10) - 1;
        label = `${monthNames[m]} ${parseInt(parts[2], 10)}`;
      }
    } catch {
      label = d.date;
    }
    return {
      ...d,
      displayDate: label,
      totalCosts: Number((d.cogs + d.operatingExpenses + d.platformFee).toFixed(2)),
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Financial Performance & Profit Trend
          </h3>
          <p className="text-xs text-slate-500">
            Daily Revenue vs. Operational Costs vs. Net Profit
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`px-3 py-1 rounded-md transition ${
              chartType === "area"
                ? "bg-white text-blue-600 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Trend Area
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded-md transition ${
              chartType === "bar"
                ? "bg-white text-blue-600 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Comparison Bars
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${currency}${v}`} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const val = typeof value === "number" ? value.toFixed(2) : value;
                  if (name === "grossSales") return [`${currency}${val}`, "Gross Revenue"];
                  if (name === "totalCosts") return [`${currency}${val}`, "Total Costs & Fees"];
                  if (name === "netProfit") return [`${currency}${val}`, "Net Profit"];
                  return [value, name];
                }}
                labelStyle={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === "grossSales") return "Gross Revenue";
                  if (value === "totalCosts") return "Total Costs (COGS + OpEx + Fee)";
                  if (value === "netProfit") return "Net Profit";
                  return value;
                }}
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              />
              <Area
                type="monotone"
                dataKey="grossSales"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          ) : (
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${currency}${v}`} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const val = typeof value === "number" ? value.toFixed(2) : value;
                  if (name === "grossSales") return [`${currency}${val}`, "Gross Revenue"];
                  if (name === "totalCosts") return [`${currency}${val}`, "Total Costs"];
                  if (name === "netProfit") return [`${currency}${val}`, "Net Profit"];
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === "grossSales") return "Gross Revenue";
                  if (value === "totalCosts") return "Total Costs";
                  if (value === "netProfit") return "Net Profit";
                  return value;
                }}
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              />
              <Bar dataKey="grossSales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCosts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netProfit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

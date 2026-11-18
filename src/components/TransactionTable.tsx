"use client";

import React, { useState, useTransition } from "react";
import { deleteTransactionAction } from "@/actions/client";
import { TransactionModal } from "./TransactionModal";
import { CsvImportModal } from "./CsvImportModal";
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
} from "lucide-react";

export interface TransactionItem {
  id: string;
  type: "REVENUE" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
  paymentStatus: "COMPLETED" | "PENDING";
  date: string;
}

interface TransactionTableProps {
  tenantSlug: string;
  transactions: TransactionItem[];
  currency?: string;
  readOnly?: boolean;
}

export function TransactionTable({
  tenantSlug,
  transactions,
  currency = "$",
  readOnly = false,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "REVENUE" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);

  const [isPending, startTransition] = useTransition();

  // Extract unique categories
  const categories = Array.from(new Set(transactions.map((t) => t.category))).filter(Boolean);

  // Filter & Search logic
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.date.includes(searchTerm);

    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Live Summary of Filtered Data
  const summary = sorted.reduce(
    (acc, t) => {
      if (t.type === "REVENUE") acc.revenue += t.amount;
      if (t.type === "EXPENSE") acc.expenses += t.amount;
      return acc;
    },
    { revenue: 0, expenses: 0 }
  );
  const net = summary.revenue - summary.expenses;

  // Handle Export to CSV
  const handleExportCsv = () => {
    const headers = "date,type,category,description,amount,paymentStatus\n";
    const rows = sorted
      .map(
        (t) =>
          `"${t.date}","${t.type}","${t.category}","${t.description.replace(/"/g, '""')}",${t.amount},"${t.paymentStatus}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${tenantSlug}-transactions-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, description: string) => {
    if (confirm(`Are you sure you want to delete "${description}"?`)) {
      startTransition(async () => {
        await deleteTransactionAction(tenantSlug, id);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, category, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                typeFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("REVENUE")}
              className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                typeFilter === "REVENUE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("EXPENSE")}
              className={`px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                typeFilter === "EXPENSE" ? "bg-white text-rose-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Expenses
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons: Add, Bulk Import, Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" /> Bulk Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTransaction(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Transaction
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Metrics Ribbon for Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Filtered Revenue:
          </div>
          <div className="text-sm font-bold text-emerald-700">
            {currency}
            {summary.revenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-rose-50/60 border border-rose-100 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs font-medium text-rose-800 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-600" /> Filtered Expenses:
          </div>
          <div className="text-sm font-bold text-rose-700">
            {currency}
            {summary.expenses.toFixed(2)}
          </div>
        </div>

        <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs font-medium text-blue-800">Filtered Net:</div>
          <div className={`text-sm font-bold ${net >= 0 ? "text-blue-700" : "text-rose-700"}`}>
            {currency}
            {net.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No transactions match your current filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting your filters or add a new transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  >
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {!readOnly && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.type === "REVENUE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {t.type === "REVENUE" ? "+ Revenue" : "- Expense"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-900 font-medium max-w-md truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold whitespace-nowrap">
                      <span className={t.type === "REVENUE" ? "text-emerald-600" : "text-slate-900"}>
                        {t.type === "EXPENSE" ? "-" : "+"}
                        {currency}
                        {t.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          t.paymentStatus === "COMPLETED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {t.paymentStatus}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTransaction(t);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                            title="Edit transaction"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id, t.description)}
                            disabled={isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        tenantSlug={tenantSlug}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        transactionToEdit={editingTransaction}
      />

      <CsvImportModal
        tenantSlug={tenantSlug}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}

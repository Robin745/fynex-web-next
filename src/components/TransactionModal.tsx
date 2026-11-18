"use client";

import React, { useState, useTransition } from "react";
import { createTransactionAction, updateTransactionAction, TransactionInput } from "@/actions/client";
import { X, Check, Loader2, PlusCircle, Edit3 } from "lucide-react";

interface TransactionModalProps {
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: {
    id: string;
    type: "REVENUE" | "EXPENSE";
    category: string;
    description: string;
    amount: number;
    paymentStatus: "COMPLETED" | "PENDING";
    date: string;
  } | null;
}

const CATEGORIES = [
  "Sales",
  "Ad Spend",
  "Inventory",
  "Shipping",
  "Payroll",
  "Software & Tools",
  "Office & Rent",
  "Consulting",
  "Returns & Refunds",
  "Other",
];

export function TransactionModal({
  tenantSlug,
  isOpen,
  onClose,
  transactionToEdit,
}: TransactionModalProps) {
  const isEditing = Boolean(transactionToEdit);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TransactionInput>(() => {
    if (transactionToEdit) {
      return {
        type: transactionToEdit.type,
        category: transactionToEdit.category,
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        paymentStatus: transactionToEdit.paymentStatus,
        date: transactionToEdit.date,
      };
    }
    return {
      type: "EXPENSE",
      category: "Ad Spend",
      description: "",
      amount: 0,
      paymentStatus: "COMPLETED",
      date: new Date().toISOString().split("T")[0],
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim()) {
      setError("Please provide a description.");
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError("Please provide a valid positive amount.");
      return;
    }

    startTransition(async () => {
      try {
        let res;
        if (isEditing && transactionToEdit) {
          res = await updateTransactionAction(tenantSlug, transactionToEdit.id, formData);
        } else {
          res = await createTransactionAction(tenantSlug, formData);
        }

        if (res.success) {
          onClose();
        } else {
          setError(res.error || "Failed to save transaction.");
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
            {isEditing ? (
              <Edit3 className="h-5 w-5 text-blue-600" />
            ) : (
              <PlusCircle className="h-5 w-5 text-blue-600" />
            )}
            <h3 className="font-bold text-slate-900">
              {isEditing ? "Edit Business Transaction" : "New Business Transaction"}
            </h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "REVENUE" })}
                className={`py-2 px-3 text-sm font-semibold rounded-lg border transition cursor-pointer ${
                  formData.type === "REVENUE"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                + Revenue / Sales
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                className={`py-2 px-3 text-sm font-semibold rounded-lg border transition cursor-pointer ${
                  formData.type === "EXPENSE"
                    ? "bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                - Cost / Expense
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 Google Ads Search Campaigns"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Payment Status
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentStatus: e.target.value as "COMPLETED" | "PENDING",
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden bg-white"
              >
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> {isEditing ? "Update" : "Add Record"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

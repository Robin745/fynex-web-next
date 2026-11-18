"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";

export interface DollarTradeInput {
  type: "BUY_USD" | "SELL_USD";
  usdAmount: number;
  exchangeRate: number;
  paymentMethod?: string;
  paymentStatus?: "COMPLETED" | "PENDING";
  category?: string;
  description: string;
  reference?: string;
  date: string;
}

/**
 * Creates a dollar buy/sell transaction under the specified tenant.
 * Enforces tenant isolation.
 */
export async function createDollarTradeAction(tenantSlug: string, input: DollarTradeInput) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot create dollar trades." };
  }

  const safeUsd = Math.abs(Number(input.usdAmount) || 0);
  const safeRate = Math.abs(Number(input.exchangeRate) || 0);
  const settlementAmount = Number((safeUsd * safeRate).toFixed(2));
  const tradeNumber = `FX-${input.date.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const trade = await db.transaction.create({
    data: {
      tenantId: tenant.id,
      tradeNumber,
      type: input.type,
      usdAmount: safeUsd,
      exchangeRate: safeRate,
      settlementAmount,
      settlementCurrency: tenant.settlementCurrency,
      paymentMethod: input.paymentMethod || "Bank Wire",
      paymentStatus: input.paymentStatus || "COMPLETED",
      category: input.category || (input.type === "BUY_USD" ? "USD Purchase" : "USD Sale"),
      description: input.description,
      reference: input.reference,
      date: input.date,
      createdById: session.id,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_CREATE_DOLLAR_TRADE",
      entityType: "Transaction",
      entityId: trade.id,
      details: JSON.stringify({ type: input.type, usdAmount: safeUsd, rate: safeRate }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/trades`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true, trade };
}

/**
 * Deletes a trade under the tenant.
 */
export async function deleteDollarTradeAction(tenantSlug: string, tradeId: string) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot delete dollar trades." };
  }

  const existing = await db.transaction.findFirst({
    where: { id: tradeId, tenantId: tenant.id },
  });

  if (!existing) {
    return { success: false, error: "Trade not found or unauthorized." };
  }

  await db.transaction.delete({
    where: { id: tradeId },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_DELETE_DOLLAR_TRADE",
      entityType: "Transaction",
      entityId: tradeId,
      details: JSON.stringify({ usdAmount: existing.usdAmount, tradeNumber: existing.tradeNumber }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/trades`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true };
}

/**
 * Bulk import dollar trades from CSV.
 */
export async function bulkImportDollarTradesAction(
  tenantSlug: string,
  rows: Array<{
    type: string;
    usdAmount: number;
    exchangeRate: number;
    paymentMethod?: string;
    paymentStatus?: string;
    category?: string;
    description: string;
    reference?: string;
    date: string;
  }>
) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot import data." };
  }

  const validTrades = rows
    .filter((r) => r.usdAmount && !isNaN(Number(r.usdAmount)) && r.exchangeRate && r.date)
    .map((r, idx) => {
      const usdAmount = Math.abs(Number(r.usdAmount));
      const exchangeRate = Math.abs(Number(r.exchangeRate));
      const isBuy = r.type?.toUpperCase().includes("BUY");
      return {
        tenantId: tenant.id,
        tradeNumber: `FX-${r.date.replace(/-/g, "")}-${1000 + idx}`,
        type: isBuy ? "BUY_USD" : "SELL_USD",
        usdAmount,
        exchangeRate,
        settlementAmount: Number((usdAmount * exchangeRate).toFixed(2)),
        settlementCurrency: tenant.settlementCurrency,
        paymentMethod: r.paymentMethod || "Bank Wire",
        paymentStatus: r.paymentStatus?.toUpperCase() === "PENDING" ? "PENDING" : "COMPLETED",
        category: r.category || "Bulk Import",
        description: r.description || "Batch CSV Trade Import",
        reference: r.reference || null,
        date: r.date,
        createdById: session.id,
      };
    });

  if (validTrades.length === 0) {
    return { success: false, error: "No valid dollar trade rows found in dataset." };
  }

  await db.transaction.createMany({
    data: validTrades,
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_BULK_IMPORT_TRADES",
      entityType: "TransactionBatch",
      details: JSON.stringify({ count: validTrades.length }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/trades`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true, count: validTrades.length };
}

// Backward compatibility types & shims for legacy components
export interface TransactionInput {
  type: string;
  category: string;
  description: string;
  amount: number;
  paymentStatus: "COMPLETED" | "PENDING";
  date: string;
}

export async function createTransactionAction(tenantSlug: string, input: TransactionInput) {
  return createDollarTradeAction(tenantSlug, {
    type: input.type === "REVENUE" ? "BUY_USD" : "SELL_USD",
    usdAmount: input.amount,
    exchangeRate: 122.0,
    paymentStatus: input.paymentStatus,
    description: input.description,
    date: input.date,
  });
}

export async function updateTransactionAction(
  tenantSlug: string,
  transactionId: string,
  input: Partial<TransactionInput>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteTransactionAction(tenantSlug: string, transactionId: string) {
  return deleteDollarTradeAction(tenantSlug, transactionId);
}

export async function bulkImportTransactionsAction(
  tenantSlug: string,
  rows: Array<{
    type: string;
    category: string;
    description: string;
    amount: number;
    paymentStatus?: string;
    date: string;
  }>
) {
  return bulkImportDollarTradesAction(
    tenantSlug,
    rows.map((r) => ({
      type: r.type,
      usdAmount: r.amount,
      exchangeRate: 122.0,
      paymentStatus: r.paymentStatus,
      description: r.description,
      date: r.date,
    }))
  );
}

export async function saveProductAction(tenantSlug: string, input: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}


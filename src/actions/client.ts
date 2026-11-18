"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";

export interface TransactionInput {
  type: "REVENUE" | "EXPENSE";
  category: string;
  description: string;
  amount: number;
  paymentStatus: "COMPLETED" | "PENDING";
  date: string;
}

/**
 * Creates a transaction under the specified tenant.
 * Enforces tenant isolation.
 */
export async function createTransactionAction(tenantSlug: string, input: TransactionInput) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot create transactions." };
  }

  const transaction = await db.transaction.create({
    data: {
      tenantId: tenant.id,
      type: input.type,
      category: input.category,
      description: input.description,
      amount: Math.abs(input.amount),
      paymentStatus: input.paymentStatus,
      date: input.date,
      createdById: session.id,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_CREATE_TRANSACTION",
      entityType: "Transaction",
      entityId: transaction.id,
      details: JSON.stringify({ type: input.type, amount: input.amount, category: input.category }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/transactions`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true, transaction };
}

/**
 * Updates a transaction under the tenant.
 */
export async function updateTransactionAction(
  tenantSlug: string,
  transactionId: string,
  input: Partial<TransactionInput>
) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot update transactions." };
  }

  // Ensure transaction belongs to this tenant
  const existing = await db.transaction.findFirst({
    where: { id: transactionId, tenantId: tenant.id },
  });

  if (!existing) {
    return { success: false, error: "Transaction not found or unauthorized." };
  }

  const updated = await db.transaction.update({
    where: { id: transactionId },
    data: {
      ...(input.type && { type: input.type }),
      ...(input.category && { category: input.category }),
      ...(input.description && { description: input.description }),
      ...(input.amount !== undefined && { amount: Math.abs(input.amount) }),
      ...(input.paymentStatus && { paymentStatus: input.paymentStatus }),
      ...(input.date && { date: input.date }),
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_UPDATE_TRANSACTION",
      entityType: "Transaction",
      entityId: transactionId,
      details: JSON.stringify(input),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/transactions`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true, transaction: updated };
}

/**
 * Deletes a transaction under the tenant.
 */
export async function deleteTransactionAction(tenantSlug: string, transactionId: string) {
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot delete transactions." };
  }

  const existing = await db.transaction.findFirst({
    where: { id: transactionId, tenantId: tenant.id },
  });

  if (!existing) {
    return { success: false, error: "Transaction not found or unauthorized." };
  }

  await db.transaction.delete({
    where: { id: transactionId },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_DELETE_TRANSACTION",
      entityType: "Transaction",
      entityId: transactionId,
      details: JSON.stringify({ amount: existing.amount, category: existing.category }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/transactions`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true };
}

/**
 * Bulk import transactions from CSV.
 */
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
  const { session, tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access: Cannot import data." };
  }

  const validTransactions = rows
    .filter((r) => r.amount && !isNaN(Number(r.amount)) && r.description && r.date)
    .map((r) => ({
      tenantId: tenant.id,
      type: r.type?.toUpperCase() === "REVENUE" ? "REVENUE" : "EXPENSE",
      category: r.category || "General",
      description: r.description,
      amount: Math.abs(Number(r.amount)),
      paymentStatus: r.paymentStatus?.toUpperCase() === "PENDING" ? "PENDING" : "COMPLETED",
      date: r.date,
      createdById: session.id,
    }));

  if (validTransactions.length === 0) {
    return { success: false, error: "No valid transaction rows found in dataset." };
  }

  await db.transaction.createMany({
    data: validTransactions,
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_BULK_IMPORT",
      entityType: "TransactionBatch",
      details: JSON.stringify({ count: validTransactions.length }),
    },
  });

  revalidatePath(`/portal/${tenantSlug}`);
  revalidatePath(`/portal/${tenantSlug}/transactions`);
  revalidatePath(`/admin/clients/${tenantSlug}`);
  return { success: true, count: validTransactions.length };
}

/**
 * Manage Products / Catalog (add/edit)
 */
export async function saveProductAction(
  tenantSlug: string,
  input: {
    id?: string;
    sku: string;
    name: string;
    category?: string;
    costPrice: number;
    sellingPrice: number;
    stockQty: number;
  }
) {
  const { tenant, role } = await requireTenantAccess(tenantSlug);

  if (role === "CLIENT_VIEWER") {
    return { success: false, error: "Read-only access." };
  }

  if (input.id) {
    const updated = await db.product.update({
      where: { id: input.id },
      data: {
        sku: input.sku,
        name: input.name,
        category: input.category,
        costPrice: Number(input.costPrice) || 0,
        sellingPrice: Number(input.sellingPrice) || 0,
        stockQty: Number(input.stockQty) || 0,
      },
    });
    revalidatePath(`/portal/${tenantSlug}/inventory`);
    return { success: true, product: updated };
  } else {
    const created = await db.product.create({
      data: {
        tenantId: tenant.id,
        sku: input.sku,
        name: input.name,
        category: input.category,
        costPrice: Number(input.costPrice) || 0,
        sellingPrice: Number(input.sellingPrice) || 0,
        stockQty: Number(input.stockQty) || 0,
      },
    });
    revalidatePath(`/portal/${tenantSlug}/inventory`);
    return { success: true, product: created };
  }
}

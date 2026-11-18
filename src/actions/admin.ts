"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/auth";
import { calculateDailyDollarMetrics } from "@/lib/calculations";

export interface DollarDailyInput {
  tenantId: string;
  date: string;
  usdBought: number;
  buyRate: number;
  usdSold: number;
  sellRate: number;
  status?: string;
  notes?: string;
}

/**
 * Saves or updates a daily Dollar Buy/Sell record for a specific client.
 * Calculates settlement amounts, net flow, and operator spread.
 */
export async function saveDollarDailyRecordAction(input: DollarDailyInput) {
  const session = await requireSuperadmin();

  const tenant = await db.tenant.findUnique({
    where: { id: input.tenantId },
  });

  if (!tenant) {
    return { success: false, error: "Client not found." };
  }

  const metrics = calculateDailyDollarMetrics(
    input.usdBought,
    input.buyRate || tenant.defaultBuyRate,
    input.usdSold,
    input.sellRate || tenant.defaultSellRate
  );

  const record = await db.dailyRecord.upsert({
    where: {
      tenantId_date: {
        tenantId: input.tenantId,
        date: input.date,
      },
    },
    create: {
      tenantId: input.tenantId,
      date: input.date,
      usdBought: metrics.usdBought,
      buyRate: metrics.buyRate,
      usdSold: metrics.usdSold,
      sellRate: metrics.sellRate,
      totalUsdVolume: metrics.totalUsdVolume,
      totalSettlementAmount: metrics.totalSettlementAmount,
      netUsdFlow: metrics.netUsdFlow,
      netProfit: metrics.netProfit,
      marginPercentage: metrics.marginPercentage,
      status: input.status || "SETTLED",
      notes: input.notes,
    },
    update: {
      usdBought: metrics.usdBought,
      buyRate: metrics.buyRate,
      usdSold: metrics.usdSold,
      sellRate: metrics.sellRate,
      totalUsdVolume: metrics.totalUsdVolume,
      totalSettlementAmount: metrics.totalSettlementAmount,
      netUsdFlow: metrics.netUsdFlow,
      netProfit: metrics.netProfit,
      marginPercentage: metrics.marginPercentage,
      status: input.status || "SETTLED",
      notes: input.notes,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "ADMIN_SET_DOLLAR_RECORD",
      entityType: "DailyRecord",
      entityId: record.id,
      details: JSON.stringify({
        date: input.date,
        volume: metrics.totalUsdVolume,
        settlement: metrics.totalSettlementAmount,
      }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/entry");
  revalidatePath(`/admin/clients/${tenant.slug}`);
  revalidatePath(`/portal/${tenant.slug}`);
  revalidatePath(`/portal/${tenant.slug}/trades`);

  return { success: true, record };
}

/**
 * Batch entry: Administrative team enters Dollar Buy/Sell figures across all clients for a selected date.
 */
export async function batchSaveDollarDailyAction(
  date: string,
  entries: Array<{
    tenantId: string;
    usdBought: number;
    buyRate: number;
    usdSold: number;
    sellRate: number;
    status?: string;
    notes?: string;
  }>
) {
  const session = await requireSuperadmin();

  const results = [];
  for (const entry of entries) {
    const tenant = await db.tenant.findUnique({ where: { id: entry.tenantId } });
    if (!tenant) continue;

    const metrics = calculateDailyDollarMetrics(
      entry.usdBought,
      entry.buyRate || tenant.defaultBuyRate,
      entry.usdSold,
      entry.sellRate || tenant.defaultSellRate
    );

    const record = await db.dailyRecord.upsert({
      where: {
        tenantId_date: {
          tenantId: entry.tenantId,
          date,
        },
      },
      create: {
        tenantId: entry.tenantId,
        date,
        usdBought: metrics.usdBought,
        buyRate: metrics.buyRate,
        usdSold: metrics.usdSold,
        sellRate: metrics.sellRate,
        totalUsdVolume: metrics.totalUsdVolume,
        totalSettlementAmount: metrics.totalSettlementAmount,
        netUsdFlow: metrics.netUsdFlow,
        netProfit: metrics.netProfit,
        marginPercentage: metrics.marginPercentage,
        status: entry.status || "SETTLED",
        notes: entry.notes,
      },
      update: {
        usdBought: metrics.usdBought,
        buyRate: metrics.buyRate,
        usdSold: metrics.usdSold,
        sellRate: metrics.sellRate,
        totalUsdVolume: metrics.totalUsdVolume,
        totalSettlementAmount: metrics.totalSettlementAmount,
        netUsdFlow: metrics.netUsdFlow,
        netProfit: metrics.netProfit,
        marginPercentage: metrics.marginPercentage,
        status: entry.status || "SETTLED",
        notes: entry.notes,
      },
    });

    results.push(record);
  }

  await db.auditLog.create({
    data: {
      userId: session.id,
      action: "ADMIN_BATCH_DOLLAR_ENTRY",
      entityType: "DailyRecordBatch",
      details: JSON.stringify({ date, count: results.length }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/entry");
  return { success: true, count: results.length };
}

/**
 * Creates an individual Dollar Trade ticket for a specific client
 */
export async function createDollarTradeAction(input: {
  tenantId: string;
  type: "BUY_USD" | "SELL_USD";
  usdAmount: number;
  exchangeRate: number;
  paymentMethod?: string;
  paymentStatus?: string;
  category?: string;
  description: string;
  reference?: string;
  date: string;
}) {
  const session = await requireSuperadmin();

  const tenant = await db.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) return { success: false, error: "Client not found." };

  const settlementAmount = Number((input.usdAmount * input.exchangeRate).toFixed(2));
  const tradeNumber = `FX-${input.date.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const trade = await db.transaction.create({
    data: {
      tenantId: input.tenantId,
      tradeNumber,
      type: input.type,
      usdAmount: input.usdAmount,
      exchangeRate: input.exchangeRate,
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

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${tenant.slug}`);
  revalidatePath(`/portal/${tenant.slug}`);
  revalidatePath(`/portal/${tenant.slug}/trades`);

  return { success: true, trade };
}

/**
 * Update client benchmark exchange rates and client type
 */
export async function updateClientRatesAction(
  tenantId: string,
  defaultBuyRate: number,
  defaultSellRate: number,
  clientType?: string
) {
  await requireSuperadmin();

  const tenant = await db.tenant.update({
    where: { id: tenantId },
    data: {
      defaultBuyRate,
      defaultSellRate,
      clientType: clientType || undefined,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${tenant.slug}`);
  return { success: true, tenant };
}

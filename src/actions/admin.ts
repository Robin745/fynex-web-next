"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/auth";
import { calculateDailyMetrics } from "@/lib/calculations";

export interface DailyRecordInput {
  tenantId: string;
  date: string;
  grossSales: number;
  cogs: number;
  operatingExpenses: number;
  customPlatformFee?: number;
  notes?: string;
}

/**
 * Saves or updates a daily business record for a specific client.
 * Automatically recalculates net profit and margins.
 */
export async function saveDailyRecordAction(input: DailyRecordInput) {
  const session = await requireSuperadmin();

  const tenant = await db.tenant.findUnique({
    where: { id: input.tenantId },
  });

  if (!tenant) {
    return { success: false, error: "Client tenant not found." };
  }

  const metrics = calculateDailyMetrics(
    input.grossSales,
    input.cogs,
    input.operatingExpenses,
    tenant.platformFeePercent,
    input.customPlatformFee
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
      grossSales: metrics.grossSales,
      cogs: metrics.cogs,
      operatingExpenses: metrics.operatingExpenses,
      platformFee: metrics.platformFee,
      netProfit: metrics.netProfit,
      marginPercentage: metrics.marginPercentage,
      notes: input.notes,
      status: "RECORDED",
    },
    update: {
      grossSales: metrics.grossSales,
      cogs: metrics.cogs,
      operatingExpenses: metrics.operatingExpenses,
      platformFee: metrics.platformFee,
      netProfit: metrics.netProfit,
      marginPercentage: metrics.marginPercentage,
      notes: input.notes,
    },
  });

  // Log action
  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "ADMIN_SET_DAILY_RECORD",
      entityType: "DailyRecord",
      entityId: record.id,
      details: JSON.stringify({
        date: input.date,
        grossSales: metrics.grossSales,
        netProfit: metrics.netProfit,
      }),
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${tenant.slug}`);
  revalidatePath(`/portal/${tenant.slug}`);

  return { success: true, record };
}

/**
 * Rapid batch entry: Administrative team enters figures across all clients for a single business date.
 */
export async function batchSaveDailyRecordsAction(
  date: string,
  entries: Array<{
    tenantId: string;
    grossSales: number;
    cogs: number;
    operatingExpenses: number;
    notes?: string;
  }>
) {
  const session = await requireSuperadmin();

  const results = [];
  for (const entry of entries) {
    const tenant = await db.tenant.findUnique({ where: { id: entry.tenantId } });
    if (!tenant) continue;

    const metrics = calculateDailyMetrics(
      entry.grossSales,
      entry.cogs,
      entry.operatingExpenses,
      tenant.platformFeePercent
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
        grossSales: metrics.grossSales,
        cogs: metrics.cogs,
        operatingExpenses: metrics.operatingExpenses,
        platformFee: metrics.platformFee,
        netProfit: metrics.netProfit,
        marginPercentage: metrics.marginPercentage,
        notes: entry.notes,
        status: "RECORDED",
      },
      update: {
        grossSales: metrics.grossSales,
        cogs: metrics.cogs,
        operatingExpenses: metrics.operatingExpenses,
        platformFee: metrics.platformFee,
        netProfit: metrics.netProfit,
        marginPercentage: metrics.marginPercentage,
        notes: entry.notes,
      },
    });

    results.push(record);
  }

  await db.auditLog.create({
    data: {
      userId: session.id,
      action: "ADMIN_BATCH_ENTRY",
      entityType: "DailyRecordBatch",
      details: JSON.stringify({ date, count: results.length }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/entry");
  return { success: true, count: results.length };
}

/**
 * Update platform fee or client settings
 */
export async function updateClientFeeAction(tenantId: string, platformFeePercent: number) {
  await requireSuperadmin();

  const tenant = await db.tenant.update({
    where: { id: tenantId },
    data: { platformFeePercent },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${tenant.slug}`);
  return { success: true, tenant };
}

/**
 * Onboard new client with initial administrator account
 */
export async function createClientAction(formData: FormData) {
  const session = await requireSuperadmin();

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string)?.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const contactEmail = formData.get("contactEmail") as string;
  const contactPhone = (formData.get("contactPhone") as string) || null;
  const platformFeePercent = parseFloat(formData.get("platformFeePercent") as string) || 10.0;
  const adminName = formData.get("adminName") as string;
  const adminEmail = (formData.get("adminEmail") as string)?.toLowerCase();

  if (!name || !slug || !contactEmail || !adminEmail) {
    return { success: false, error: "Missing required fields." };
  }

  const existingTenant = await db.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return { success: false, error: "Client slug already in use. Please choose another." };
  }

  // Create tenant
  const tenant = await db.tenant.create({
    data: {
      name,
      slug,
      contactEmail,
      contactPhone,
      platformFeePercent,
      currency: "USD",
    },
  });

  // Create or link client admin user
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("client123", 10);

  let user = await db.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    user = await db.user.create({
      data: {
        name: adminName || `${name} Admin`,
        email: adminEmail,
        passwordHash,
        role: "CLIENT_USER",
      },
    });
  }

  await db.tenantMembership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      role: "CLIENT_ADMIN",
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.id,
      action: "CLIENT_ONBOARDED",
      entityType: "Tenant",
      entityId: tenant.id,
      details: JSON.stringify({ name, slug }),
    },
  });

  revalidatePath("/admin");
  return { success: true, tenant };
}

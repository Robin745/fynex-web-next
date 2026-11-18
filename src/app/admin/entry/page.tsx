import { db } from "@/lib/db";
import { BatchEntryGrid } from "@/components/BatchEntryGrid";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Daily Dollar Entry",
};

export default async function AdminBatchEntryPage() {
  const tenants = await db.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch any existing records for today
  const existingRecords = await db.dailyRecord.findMany({
    where: {
      date: todayStr,
    },
  });

  const recordMap = new Map(existingRecords.map((r) => [r.tenantId, r]));

  const clientRows = tenants.map((t) => {
    const existing = recordMap.get(t.id);
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      clientType: t.clientType,
      settlementCurrency: t.settlementCurrency,
      defaultBuyRate: t.defaultBuyRate,
      defaultSellRate: t.defaultSellRate,
      usdBought: existing ? existing.usdBought : undefined,
      buyRate: existing ? existing.buyRate : t.defaultBuyRate,
      usdSold: existing ? existing.usdSold : undefined,
      sellRate: existing ? existing.sellRate : t.defaultSellRate,
      status: existing?.status || "SETTLED",
      notes: existing?.notes || undefined,
    };
  });

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Daily Dollar Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter today&apos;s dollar amounts and rates for each client.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Auto Calculation
        </div>
      </div>

      {/* Batch Entry Component */}
      <BatchEntryGrid clients={clientRows} initialDate={todayStr} />
    </div>
  );
}

import { db } from "@/lib/db";
import { BatchEntryGrid } from "@/components/BatchEntryGrid";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";


export const metadata = {
  title: "Daily Batch Entry",
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
      platformFeePercent: t.platformFeePercent,
      currency: t.currency,
      defaultGross: existing?.grossSales,
      defaultCogs: existing?.cogs,
      defaultOpex: existing?.operatingExpenses,
      defaultNotes: existing?.notes || undefined,
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              Administrative Daily Data Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter or update daily business figures for each client. Calculations and profits update automatically.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Instant Recalculation Engine
        </div>
      </div>

      {/* Batch Entry Component */}
      <BatchEntryGrid clients={clientRows} initialDate={todayStr} />
    </div>
  );
}

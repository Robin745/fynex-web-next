import { db } from "@/lib/db";
import { DollarEntryForm } from "@/components/DollarEntryForm";
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

  const clientOptions = tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    clientType: t.clientType,
    settlementCurrency: t.settlementCurrency,
    defaultBuyRate: t.defaultBuyRate,
    defaultSellRate: t.defaultSellRate,
  }));

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Daily Dollar Entry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create a new dollar transaction for client buy or sell orders.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Real-time Settlement Calculation</span>
        </div>
      </div>

      {/* Dollar Entry Form Component */}
      <DollarEntryForm clients={clientOptions} initialDate={todayStr} />
    </div>
  );
}

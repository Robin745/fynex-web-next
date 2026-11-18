import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";
import { MetricCard } from "@/components/MetricCard";
import { ClientSettlementTable, SettlementRecord } from "@/components/ClientSettlementTable";
import { aggregateDollarRecords, formatUsd, formatSettlement } from "@/lib/calculations";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Overview (${slug})`,
  };
}

export default async function ClientOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant, role, isSuperadmin } = await requireTenantAccess(slug);

  const rawDailyRecords = await db.dailyRecord.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "asc" },
  });

  const tradesCount = await db.transaction.count({
    where: { tenantId: tenant.id },
  });

  const summary = aggregateDollarRecords(rawDailyRecords);

  const dailyRecords: SettlementRecord[] = rawDailyRecords.map((r) => ({
    id: r.id,
    date: r.date,
    usdBought: r.usdBought,
    buyRate: r.buyRate,
    usdSold: r.usdSold,
    sellRate: r.sellRate,
    totalUsdVolume: r.totalUsdVolume,
    totalSettlementAmount: r.totalSettlementAmount,
    status: r.status,
    notes: r.notes,
  }));

  const getClientTypeLabel = (type: string) => {
    if (type.includes("EXPORTER")) return "Dollar Seller (Exporter)";
    if (type.includes("IMPORTER")) return "Dollar Buyer (Importer)";
    return "Buyer & Seller";
  };

  return (
    <div className="space-y-6">
      {/* Superadmin Preview Notice */}
      {isSuperadmin && (
        <div className="px-3.5 py-2 bg-amber-50/80 border border-amber-200/80 rounded-lg text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium">
              Admin Preview: Viewing <strong>{tenant.name}</strong> as Admin
            </span>
          </div>
          <Link
            href="/admin"
            className="font-semibold text-amber-800 hover:text-amber-950 underline"
          >
            Back to Admin Panel
          </Link>
        </div>
      )}

      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {tenant.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {tenant.name}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {getClientTypeLabel(tenant.clientType)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              See your dollar trades, today&apos;s rates, and payment history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/portal/${tenant.slug}/calculator`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
            <span>Calculator</span>
          </Link>
          <Link
            href={`/portal/${tenant.slug}/trades`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Transactions ({tradesCount})</span>
          </Link>
        </div>
      </div>

      {/* Today's Rates Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Today&apos;s Rates:
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
              <span>Buy Rate: <strong>৳{tenant.defaultBuyRate.toFixed(2)}</strong> (When you sell USD)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
              <span>Sell Rate: <strong>৳{tenant.defaultSellRate.toFixed(2)}</strong> (When you buy USD)</span>
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Currency: <span className="font-bold text-slate-800">{tenant.settlementCurrency} (৳)</span>
        </div>
      </div>

      {/* Key Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Dollars"
          value={formatUsd(summary.totalUsdVolume)}
          subtitle="Total dollars bought and sold"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Dollars Sold"
          value={formatUsd(summary.totalUsdBought)}
          subtitle={summary.avgBuyRate > 0 ? `Avg Rate: ৳${summary.avgBuyRate.toFixed(2)}` : "No sales yet"}
          icon={ArrowDownLeft}
          variant="emerald"
          badge="You Sold"
        />
        <MetricCard
          title="Dollars Bought"
          value={formatUsd(summary.totalUsdSold)}
          subtitle={summary.avgSellRate > 0 ? `Avg Rate: ৳${summary.avgSellRate.toFixed(2)}` : "No buys yet"}
          icon={ArrowUpRight}
          variant="indigo"
          badge="You Bought"
        />
        <MetricCard
          title="Total Money Paid"
          value={formatSettlement(summary.totalSettlementAmount, tenant.settlementCurrency)}
          subtitle="Total money in local currency"
          icon={TrendingUp}
          variant="amber"
          badge="Paid"
        />
      </div>

      {/* Daily Records Table */}
      <ClientSettlementTable
        records={dailyRecords}
        currency={tenant.settlementCurrency}
        tenantSlug={tenant.slug}
      />
    </div>
  );
}

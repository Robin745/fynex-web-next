import Link from "next/link";
import type { Tenant, DailyRecord } from "@prisma/client";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/MetricCard";
import { ClientFxTable, ClientSummaryItem } from "@/components/ClientFxTable";
import { aggregateDollarRecords, formatUsd, formatSettlement } from "@/lib/calculations";
import {
  DollarSign,
  TrendingUp,
  Percent,
  CalendarPlus,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export const metadata = {
  title: "Admin Overview",
};

export default async function AdminDashboardPage() {
  const tenants = await db.tenant.findMany({
    where: { status: "ACTIVE" },
    include: {
      dailyRecords: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate individual client metrics
  const clientSummaries: ClientSummaryItem[] = tenants.map((tenant: Tenant & { dailyRecords: DailyRecord[] }) => {
    const agg = aggregateDollarRecords(tenant.dailyRecords);
    const lastRecord = tenant.dailyRecords[tenant.dailyRecords.length - 1];

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        clientType: tenant.clientType,
        contactEmail: tenant.contactEmail,
        settlementCurrency: tenant.settlementCurrency,
        defaultBuyRate: tenant.defaultBuyRate,
        defaultSellRate: tenant.defaultSellRate,
      },
      ...agg,
      lastRecordDate: lastRecord?.date || "No entries",
    };
  });

  // Calculate desk-wide totals
  const deskTotals = clientSummaries.reduce(
    (acc, curr) => {
      acc.totalVolumeUsd += curr.totalUsdVolume;
      acc.totalUsdBought += curr.totalUsdBought;
      acc.totalBuySettlement += curr.totalUsdBought * curr.avgBuyRate;
      acc.totalUsdSold += curr.totalUsdSold;
      acc.totalSellSettlement += curr.totalUsdSold * curr.avgSellRate;
      acc.totalSpreadProfit += curr.totalSpreadProfit;
      return acc;
    },
    {
      totalVolumeUsd: 0,
      totalUsdBought: 0,
      totalBuySettlement: 0,
      totalUsdSold: 0,
      totalSellSettlement: 0,
      totalSpreadProfit: 0,
    }
  );

  const weightedBuyRate =
    deskTotals.totalUsdBought > 0
      ? Number((deskTotals.totalBuySettlement / deskTotals.totalUsdBought).toFixed(2))
      : 0;

  const weightedSellRate =
    deskTotals.totalUsdSold > 0
      ? Number((deskTotals.totalSellSettlement / deskTotals.totalUsdSold).toFixed(2))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Admin Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            See all dollar transactions, today&apos;s rates, and client balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/entry"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Daily Dollar Entry</span>
          </Link>
        </div>
      </div>

      {/* Global Executive FX KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Dollars"
          value={formatUsd(deskTotals.totalVolumeUsd)}
          subtitle="Total dollars bought and sold"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Dollars Bought"
          value={formatUsd(deskTotals.totalUsdBought)}
          subtitle={weightedBuyRate > 0 ? `Avg Rate: ৳${weightedBuyRate.toFixed(2)}` : "No buys yet"}
          icon={ArrowDownLeft}
          variant="emerald"
          badge="Bought"
        />
        <MetricCard
          title="Dollars Sold"
          value={formatUsd(deskTotals.totalUsdSold)}
          subtitle={weightedSellRate > 0 ? `Avg Rate: ৳${weightedSellRate.toFixed(2)}` : "No sales yet"}
          icon={ArrowUpRight}
          variant="indigo"
          badge="Sold"
        />
        <MetricCard
          title="Total Profit"
          value={formatSettlement(deskTotals.totalSpreadProfit, "BDT")}
          subtitle="Profit made from dollar trades"
          icon={TrendingUp}
          variant="amber"
          badge="Profit"
        />
      </div>

      {/* Client List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Clients
            </h2>
            <p className="text-xs text-slate-500">
              Total dollars, exchange rates, and profit for each client.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
            {tenants.length} Clients
          </span>
        </div>

        {/* Clean 5-Column Interactive Client Table */}
        <ClientFxTable clients={clientSummaries} />
      </div>
    </div>
  );
}

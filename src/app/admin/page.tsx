import Link from "next/link";
import { db } from "@/lib/db";
import { MetricCard } from "@/components/MetricCard";
import { aggregateRecords, formatCurrency } from "@/lib/calculations";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Building2,
  CalendarPlus,
  ArrowUpRight,
  ChevronRight,
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
  });

  // Calculate individual client metrics
  const clientSummaries = tenants.map((tenant) => {
    const agg = aggregateRecords(tenant.dailyRecords);
    const lastRecord = tenant.dailyRecords[tenant.dailyRecords.length - 1];

    return {
      tenant,
      ...agg,
      lastRecordDate: lastRecord?.date || "No entries",
    };
  });

  // Calculate platform-wide totals
  const platformTotals = clientSummaries.reduce(
    (acc, curr) => {
      acc.grossVolume += curr.totalGrossSales;
      acc.clientProfits += curr.totalNetProfit;
      acc.platformFees += curr.totalPlatformFees;
      return acc;
    },
    { grossVolume: 0, clientProfits: 0, platformFees: 0 }
  );

  const avgMargin =
    platformTotals.grossVolume > 0
      ? ((platformTotals.clientProfits / platformTotals.grossVolume) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Admin & Client Overview
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              FYNEX Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor each client&apos;s daily revenue, costs, platform fees, and net profits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/entry"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            Daily Batch Entry
          </Link>
        </div>
      </div>

      {/* Global Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Client Sales"
          value={formatCurrency(platformTotals.grossVolume)}
          subtitle="Combined sales across all clients"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Platform Fees Earned"
          value={formatCurrency(platformTotals.platformFees)}
          subtitle="Your total fee earnings"
          icon={Percent}
          variant="amber"
          badge="Admin Cut"
        />
        <MetricCard
          title="Clients Net Profit"
          value={formatCurrency(platformTotals.clientProfits)}
          subtitle="Combined profits retained by clients"
          icon={TrendingUp}
          variant="emerald"
        />
        <MetricCard
          title="Active Clients"
          value={String(tenants.length)}
          subtitle={`Avg net margin: ${avgMargin}%`}
          icon={Building2}
          variant="indigo"
        />
      </div>

      {/* Individual Client Performance & Profit Monitoring Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Client Profit & Calculation Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Individual business metrics calculated live from daily administrative ledgers
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
            {tenants.length} Active Organizations
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Client Organization</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales</th>
                  <th className="py-3.5 px-4 text-right">COGS & OpEx</th>
                  <th className="py-3.5 px-4 text-center">Fee Rate</th>
                  <th className="py-3.5 px-4 text-right">Platform Fee Earned</th>
                  <th className="py-3.5 px-4 text-right">Client Net Profit</th>
                  <th className="py-3.5 px-4 text-center">Net Margin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientSummaries.map((c) => (
                  <tr key={c.tenant.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {c.tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/admin/clients/${c.tenant.slug}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {c.tenant.name}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {c.tenant.contactEmail} • Last settled: {c.lastRecordDate}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(c.totalGrossSales, c.tenant.currency)}
                    </td>

                    <td className="py-4 px-4 text-right text-xs font-medium text-slate-600">
                      {formatCurrency(c.totalCogs + c.totalOperatingExpenses, c.tenant.currency)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {c.tenant.platformFeePercent}%
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right text-sm font-bold text-amber-700">
                      {formatCurrency(c.totalPlatformFees, c.tenant.currency)}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-sm">
                      <span className={c.totalNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {formatCurrency(c.totalNetProfit, c.tenant.currency)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          c.overallMarginPercent >= 20
                            ? "bg-emerald-50 text-emerald-700"
                            : c.overallMarginPercent > 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {c.overallMarginPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/portal/${c.tenant.slug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                          title="View Portal as Client"
                        >
                          Portal <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/admin/clients/${c.tenant.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                        >
                          Telemetry <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

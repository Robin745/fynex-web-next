import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";
import { MetricCard } from "@/components/MetricCard";
import { aggregateRecords, formatCurrency } from "@/lib/calculations";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Package,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Portal Overview (${slug})`,
  };
}

export default async function ClientOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant, role, isSuperadmin } = await requireTenantAccess(slug);

  const dailyRecords = await db.dailyRecord.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "asc" },
  });

  const transactionsCount = await db.transaction.count({
    where: { tenantId: tenant.id },
  });

  const summary = aggregateRecords(dailyRecords);

  return (
    <div className="space-y-6">
      {/* Impersonation Warning Banner if Superadmin */}
      {isSuperadmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Admin Preview Mode: You are viewing this workspace as the FYNEX Platform Owner.</span>
          </div>
          <Link href="/admin" className="text-amber-800 underline hover:text-amber-900">
            Back to Admin Panel
          </Link>
        </div>
      )}

      {/* Header & Feature Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {tenant.name} Overview
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {role === "CLIENT_ADMIN" ? "Client Access" : "Read-Only"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your daily business performance, expenses, and net profit numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/portal/${tenant.slug}/transactions`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Transactions ({transactionsCount})
          </Link>
          <Link
            href={`/portal/${tenant.slug}/inventory`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            <Package className="h-3.5 w-3.5" /> Products
          </Link>
        </div>
      </div>

      {/* Key Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Gross Revenue"
          value={formatCurrency(summary.totalGrossSales, tenant.currency)}
          subtitle="Cumulative sales recorded"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Operating Costs"
          value={formatCurrency(summary.totalCogs + summary.totalOperatingExpenses, tenant.currency)}
          subtitle={`COGS + Operating Expenses`}
          icon={DollarSign}
          variant="rose"
        />
        <MetricCard
          title="Platform Management Fee"
          value={formatCurrency(summary.totalPlatformFees, tenant.currency)}
          subtitle={`Platform cut (${tenant.platformFeePercent}%)`}
          icon={Percent}
          variant="amber"
        />
        <MetricCard
          title="Your Net Profit"
          value={formatCurrency(summary.totalNetProfit, tenant.currency)}
          subtitle={`Net margin: ${summary.overallMarginPercent}%`}
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* Quick Launch Cards for Data Manipulation Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/portal/${tenant.slug}/transactions`}
          className="group p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                Transaction Manager & Bulk CSV Tools
              </h3>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {transactionsCount} active transactions. Add, edit, filter, export to CSV, or batch import records.
            </p>
          </div>
        </Link>

        <Link
          href={`/portal/${tenant.slug}/inventory`}
          className="group p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition flex items-start gap-4"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
            <Package className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition">
                Product & Inventory Catalog
              </h3>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-600 transition" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Maintain SKUs, unit costs, pricing margins, and monitor available stock quantities.
            </p>
          </div>
        </Link>
      </div>

      {/* Daily Ledger Entries from Administration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Administrative Daily Settlements
            </h3>
            <p className="text-xs text-slate-500">
              Figures entered and calculated daily by central business operations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
            {dailyRecords.length} Settled Dates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Daily Sales</th>
                <th className="py-3 px-4 text-right">COGS</th>
                <th className="py-3 px-4 text-right">Operational Expenses</th>
                <th className="py-3 px-4 text-right">Platform Fee ({tenant.platformFeePercent}%)</th>
                <th className="py-3 px-4 text-right">Your Net Profit</th>
                <th className="py-3 px-4 text-center">Net Margin</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyRecords.slice().reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ${r.grossSales.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    ${r.cogs.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    ${r.operatingExpenses.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-700">
                    ${r.platformFee.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                    ${r.netProfit.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                      {r.marginPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Recorded
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

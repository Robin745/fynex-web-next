import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { updateClientFeeAction } from "@/actions/admin";
import { aggregateRecords, formatCurrency } from "@/lib/calculations";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  ExternalLink,
  Save,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Client Telemetry (${slug})`,
  };
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const tenant = await db.tenant.findUnique({
    where: { slug },
    include: {
      dailyRecords: {
        orderBy: { date: "asc" },
      },
      memberships: {
        include: {
          user: true,
        },
      },
      transactions: {
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!tenant) notFound();

  const summary = aggregateRecords(tenant.dailyRecords);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {tenant.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {tenant.currency}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact: {tenant.contactEmail} • Telemetry & Profit Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/portal/${tenant.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            Open Client Portal <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/entry"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
          >
            <Calendar className="h-3.5 w-3.5" /> Enter Daily Data
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Gross Revenue"
          value={formatCurrency(summary.totalGrossSales, tenant.currency)}
          subtitle="Cumulative sales recorded"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Total Operating Costs"
          value={formatCurrency(summary.totalCogs + summary.totalOperatingExpenses, tenant.currency)}
          subtitle={`COGS: ${formatCurrency(summary.totalCogs)} | OpEx: ${formatCurrency(summary.totalOperatingExpenses)}`}
          icon={DollarSign}
          variant="rose"
        />
        <MetricCard
          title="Platform Fee Earned"
          value={formatCurrency(summary.totalPlatformFees, tenant.currency)}
          subtitle={`Contract rate: ${tenant.platformFeePercent}%`}
          icon={Percent}
          variant="amber"
          badge="Owner Cut"
        />
        <MetricCard
          title="Client Net Profit"
          value={formatCurrency(summary.totalNetProfit, tenant.currency)}
          subtitle={`Net margin: ${summary.overallMarginPercent}%`}
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* Contract Settings & Daily Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract & Fee Configuration Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Commercial Fee Settings</h3>
            <span className="text-[11px] font-semibold text-slate-400">Owner Panel</span>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const fee = parseFloat(formData.get("platformFeePercent") as string);
              if (!isNaN(fee)) {
                await updateClientFeeAction(tenant.id, fee);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Platform Commission Fee (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  name="platformFeePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={tenant.platformFeePercent}
                  className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Changing this fee rate automatically applies to future daily settlements.
              </p>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Settlements:</span>
              <span className="font-semibold">{tenant.dailyRecords.length} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Authorized Users:</span>
              <span className="font-semibold">{tenant.memberships.length} client admins</span>
            </div>
          </div>
        </div>

        {/* Daily Records History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Daily Administrative Settlements</h3>
            <span className="text-xs text-slate-400">{tenant.dailyRecords.length} recorded dates</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Sales</th>
                  <th className="py-2.5 px-3 text-right">COGS</th>
                  <th className="py-2.5 px-3 text-right">OpEx</th>
                  <th className="py-2.5 px-3 text-right">Platform Fee</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-center">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenant.dailyRecords.slice().reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ${r.grossSales.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ${r.cogs.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ${r.operatingExpenses.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                      ${r.platformFee.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                      ${r.netProfit.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {r.marginPercentage.toFixed(1)}%
                      </span>
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

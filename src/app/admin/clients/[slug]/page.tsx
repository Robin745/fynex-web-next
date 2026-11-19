import { db } from "@/lib/db";
import type { DailyRecord, Transaction } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { updateClientRatesAction } from "@/actions/admin";
import { aggregateDollarRecords, formatUsd, formatSettlement, formatRate } from "@/lib/calculations";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  ExternalLink,
  Save,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return {
    title: `Client Details (${slug})`,
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
        take: 30,
      },
    },
  });

  if (!tenant) notFound();

  const summary = aggregateDollarRecords(tenant.dailyRecords);

  const getClientTypeLabel = (type: string) => {
    if (type.includes("EXPORTER")) return "Dollar Seller";
    if (type.includes("IMPORTER")) return "Dollar Buyer";
    return "Buys & Sells";
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to All Clients"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {tenant.name}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {getClientTypeLabel(tenant.clientType)}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Currency: {tenant.settlementCurrency} (৳)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact: {tenant.contactEmail} • Dollar Buy/Sell History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/portal/${tenant.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            Open Client View <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/entry"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
          >
            <Calendar className="h-3.5 w-3.5" /> Daily Dollar Entry
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Dollars Bought"
          value={formatUsd(summary.totalUsdBought)}
          subtitle={`Avg Buy Rate: ৳${summary.avgBuyRate.toFixed(2)}`}
          icon={ArrowDownLeft}
          variant="emerald"
          badge="Client Sold"
        />
        <MetricCard
          title="Total Dollars Sold"
          value={formatUsd(summary.totalUsdSold)}
          subtitle={`Avg Sell Rate: ৳${summary.avgSellRate.toFixed(2)}`}
          icon={ArrowUpRight}
          variant="indigo"
          badge="Client Bought"
        />
        <MetricCard
          title="Total Money Paid"
          value={formatSettlement(summary.totalSettlementAmount, tenant.settlementCurrency)}
          subtitle="Total in local currency"
          icon={DollarSign}
          variant="blue"
        />
        <MetricCard
          title="Total Profit"
          value={formatSettlement(summary.totalSpreadProfit, tenant.settlementCurrency)}
          subtitle="Profit from trades"
          icon={Percent}
          variant="amber"
          badge="Profit"
        />
      </div>

      {/* Settings & Daily Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rate Settings Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Default Rates</h3>
            <span className="text-[11px] font-semibold text-slate-400">Settings</span>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const buyRate = parseFloat(formData.get("defaultBuyRate") as string);
              const sellRate = parseFloat(formData.get("defaultSellRate") as string);
              const clientType = formData.get("clientType") as string;
              if (!isNaN(buyRate) && !isNaN(sellRate)) {
                await updateClientRatesAction(tenant.id, buyRate, sellRate, clientType);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Client Type
              </label>
              <select
                name="clientType"
                defaultValue={tenant.clientType}
                className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="EXPORTER">Dollar Seller (Exporter)</option>
                <option value="IMPORTER">Dollar Buyer (Importer)</option>
                <option value="DUAL_TRADER">Both (Buys & Sells)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Default Buy Rate (৳)
                </label>
                <input
                  name="defaultBuyRate"
                  type="number"
                  step="0.01"
                  defaultValue={tenant.defaultBuyRate}
                  className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Default Sell Rate (৳)
                </label>
                <input
                  name="defaultSellRate"
                  type="number"
                  step="0.01"
                  defaultValue={tenant.defaultSellRate}
                  className="w-full px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" /> Save Rates
            </button>
            <p className="text-[11px] text-slate-500">
              New daily entries will use these rates as default for this client.
            </p>
          </form>

          <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Trading Days:</span>
              <span className="font-semibold">{tenant.dailyRecords.length} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Transactions:</span>
              <span className="font-semibold">{tenant.transactions.length} entries</span>
            </div>
          </div>
        </div>

        {/* Daily Records History Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-2.5 px-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Daily Dollar History</h3>
            <span className="text-[11px] text-slate-400">{tenant.dailyRecords.length} days recorded</span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] sticky top-0">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Dollars Bought</th>
                  <th className="py-2 px-3 text-center">Buy Rate</th>
                  <th className="py-2 px-3 text-right">Dollars Sold</th>
                  <th className="py-2 px-3 text-center">Sell Rate</th>
                  <th className="py-2 px-3 text-right">Total Paid (BDT)</th>
                  <th className="py-2 px-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenant.dailyRecords.slice().reverse().map((r: DailyRecord) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                      {r.usdBought > 0 ? formatUsd(r.usdBought) : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-center text-emerald-800 font-semibold">
                      {r.buyRate > 0 ? formatRate(r.buyRate) : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                      {r.usdSold > 0 ? formatUsd(r.usdSold) : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-center text-blue-800 font-semibold">
                      {r.sellRate > 0 ? formatRate(r.sellRate) : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-semibold text-slate-800">
                      {formatSettlement(r.totalSettlementAmount, tenant.settlementCurrency)}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-700">
                      {formatSettlement(r.netProfit, tenant.settlementCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-2.5 px-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900">All Transactions</h3>
          <span className="text-[11px] text-slate-400">{tenant.transactions.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-2 px-3">Transaction ID</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">USD Amount</th>
                <th className="py-2 px-3 text-center">Rate</th>
                <th className="py-2 px-3 text-right">Total Paid (BDT)</th>
                <th className="py-2 px-3">Payment Method</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Note / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenant.transactions.map((t: Transaction) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-1.5 px-3 font-mono font-semibold text-slate-700">
                    {t.tradeNumber || t.id.substring(0, 10)}
                  </td>
                  <td className="py-1.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.type === "BUY_USD"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {t.type === "BUY_USD" ? "Sold USD" : "Bought USD"}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                    {formatUsd(t.usdAmount)}
                  </td>
                  <td className="py-1.5 px-3 text-center font-bold text-slate-800">
                    {formatRate(t.exchangeRate)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                    {formatSettlement(t.settlementAmount, t.settlementCurrency)}
                  </td>
                  <td className="py-1.5 px-3 text-slate-600 font-medium">
                    {t.paymentMethod}
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> {t.paymentStatus === "COMPLETED" ? "Completed" : t.paymentStatus}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">
                    {t.reference || "—"}
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

import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";
import { FxCalculator } from "@/components/FxCalculator";
import { formatUsd, formatSettlement } from "@/lib/calculations";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Dollar Calculator",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientCalculatorPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant } = await requireTenantAccess(slug);

  const historicalRecords = await db.dailyRecord.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href={`/portal/${tenant.slug}`}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Back to Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Dollar Calculator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Check today&apos;s rates and calculate dollar conversions for {tenant.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Engine */}
      <FxCalculator
        defaultBuyRate={tenant.defaultBuyRate}
        defaultSellRate={tenant.defaultSellRate}
        currency={tenant.settlementCurrency}
        clientName={tenant.name}
      />

      {/* Historical Executed Rates Transparency Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Rate History
            </h3>
            <p className="text-xs text-slate-500">
              Past {historicalRecords.length} days with exchange rates
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4 text-center">Buy Rate (When you sell USD)</th>
                <th className="py-3 px-4 text-center">Sell Rate (When you buy USD)</th>
                <th className="py-3 px-4 text-right">Dollars</th>
                <th className="py-3 px-5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicalRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-5 font-semibold text-slate-800 text-xs">
                    {r.date}
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-semibold text-emerald-800">
                    {r.buyRate > 0 ? `৳${r.buyRate.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-semibold text-blue-800">
                    {r.sellRate > 0 ? `৳${r.sellRate.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 text-xs">
                    {formatUsd(r.totalUsdVolume)}
                  </td>
                  <td className="py-3 px-5 text-right font-bold text-slate-900 text-xs">
                    {formatSettlement(r.totalSettlementAmount, tenant.settlementCurrency)}
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

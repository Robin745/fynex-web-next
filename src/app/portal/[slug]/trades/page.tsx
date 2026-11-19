import { db } from "@/lib/db";
import type { Transaction } from "@prisma/client";
import { requireTenantAccess } from "@/lib/auth";
import { DollarTradeTable, DollarTradeItem } from "@/components/DollarTradeTable";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Transactions",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientTradesPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant, role } = await requireTenantAccess(slug);

  const rawTrades = await db.transaction.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "desc" },
  });

  const trades: DollarTradeItem[] = rawTrades.map((t: Transaction) => ({
    id: t.id,
    tradeNumber: t.tradeNumber,
    type: t.type,
    usdAmount: t.usdAmount,
    exchangeRate: t.exchangeRate,
    settlementAmount: t.settlementAmount,
    settlementCurrency: t.settlementCurrency,
    paymentMethod: t.paymentMethod,
    paymentStatus: t.paymentStatus,
    category: t.category,
    description: t.description,
    reference: t.reference,
    date: t.date,
  }));

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
              Transactions
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              See all your dollar transactions and payment status for {tenant.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <DollarTradeTable
        tenantSlug={tenant.slug}
        trades={trades}
        currency={tenant.settlementCurrency}
        readOnly={role === "CLIENT_VIEWER"}
      />
    </div>
  );
}

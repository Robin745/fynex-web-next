import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";
import { TransactionTable, TransactionItem } from "@/components/TransactionTable";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";


export const metadata = {
  title: "Transactions & Data Tools",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientTransactionsPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant, role } = await requireTenantAccess(slug);

  const rawTransactions = await db.transaction.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "desc" },
  });

  const transactions: TransactionItem[] = rawTransactions.map((t) => ({
    id: t.id,
    type: t.type as "REVENUE" | "EXPENSE",
    category: t.category,
    description: t.description,
    amount: t.amount,
    paymentStatus: t.paymentStatus as "COMPLETED" | "PENDING",
    date: t.date,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/portal/${tenant.slug}`}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              Transaction Ledger & Data Tools
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add, edit, filter, search, export, and bulk import transactions for {tenant.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <TransactionTable
        tenantSlug={tenant.slug}
        transactions={transactions}
        currency="$"
        readOnly={role === "CLIENT_VIEWER"}
      />
    </div>
  );
}

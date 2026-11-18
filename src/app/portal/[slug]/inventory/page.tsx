import { db } from "@/lib/db";
import { requireTenantAccess } from "@/lib/auth";
import { ProductCatalog } from "@/components/ProductCatalog";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";


export const metadata = {
  title: "Products & Catalog",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientInventoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { tenant, role } = await requireTenantAccess(slug);

  const products = await db.product.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
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
              <Package className="h-6 w-6 text-blue-600" />
              Products & Inventory Catalog
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Maintain SKUs, calculate unit margins, and manage stock quantities for {tenant.name}.
            </p>
          </div>
        </div>
      </div>

      <ProductCatalog
        tenantSlug={tenant.slug}
        products={products}
        readOnly={role === "CLIENT_VIEWER"}
      />
    </div>
  );
}

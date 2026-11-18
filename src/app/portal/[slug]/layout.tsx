import { requireTenantAccess } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/Sidebar";
import { TopHeader } from "@/components/TopHeader";

export const dynamic = "force-dynamic";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ClientPortalLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const { tenant, session } = await requireTenantAccess(slug);

  let allTenants: { id: string; name: string; slug: string }[] | undefined;
  if (session.role === "SUPERADMIN") {
    allTenants = await db.tenant.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col lg:flex-row">
      <Sidebar
        session={session}
        currentTenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          currency: tenant.currency,
        }}
        allTenants={allTenants}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          session={session}
          currentTenant={{
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          }}
          allTenants={allTenants}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "SUPERADMIN") {
    redirect("/admin");
  }

  if (session.tenants.length > 0) {
    redirect(`/portal/${session.tenants[0].slug}`);
  }

  redirect("/login");
}

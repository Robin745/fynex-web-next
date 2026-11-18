import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginAction, demoLoginAction } from "@/actions/auth";
import { BarChart3, Shield, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === "SUPERADMIN") redirect("/admin");
    if (session.tenants.length > 0) redirect(`/portal/${session.tenants[0].slug}`);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mb-3">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          FYN<span className="text-emerald-600">EX</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Business Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick Demo Role Switcher */}
        <div className="mb-6 bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Instant 1-Click Role Access (Demo)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Select a role below to log in directly and experience both administrative and client perspectives:
          </p>

          <div className="space-y-2">
            <form action={demoLoginAction.bind(null, "SUPERADMIN", undefined)}>
              <button
                type="submit"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span>👑 Business Owner / Superadmin</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "CLIENT", "apex-retail")}>
              <button
                type="submit"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>🏢 Client 1: Apex Retail Hub (Retailer)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "CLIENT", "nexus-cloud")}>
              <button
                type="submit"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>🏢 Client 2: Nexus Cloud & AI (SaaS)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
              </button>
            </form>

            <form action={demoLoginAction.bind(null, "CLIENT", "vanguard-freight")}>
              <button
                type="submit"
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>🏢 Client 3: Vanguard Freight (Logistics)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
              </button>
            </form>
          </div>
        </div>

        {/* Standard Email/Password Login Form */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form action={async (formData: FormData) => {
            "use server";
            await loginAction(undefined, formData);
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                defaultValue="admin@business.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                defaultValue="admin12345"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Sign In with Credentials
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { BarChart3, Code2 } from "lucide-react";
import { DemoLoginCard } from "@/components/DemoLoginCard";
import { LoginSubmitButton } from "@/components/LoginSubmitButton";

export const metadata = {
  title: "Sign In",
};

interface LoginPageProps {
  searchParams?: Promise<{ switch?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSwitching = params?.switch === "true" || params?.switch === "1";

  const session = await getSession();
  if (session && !isSwitching) {
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
        {/* Quick Demo Role Switcher with instant loading states */}
        <DemoLoginCard />

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

            <LoginSubmitButton />
          </form>
        </div>

        {/* Developer Attribution Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs text-slate-600 font-medium">
            <Code2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Application Designed &amp; Developed by</span>
            <span className="font-bold text-slate-900">Moshiur Robin</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            FynEX FX Currency Settlement &amp; Operations Platform
          </p>
        </div>
      </div>
    </div>
  );
}

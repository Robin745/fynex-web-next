"use client";

import { useState, useTransition } from "react";
import { Shield, Building2, ArrowRight, Loader2 } from "lucide-react";
import { demoLoginAction } from "@/actions/auth";

export function DemoLoginCard() {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDemoClick = (
    role: "SUPERADMIN" | "CLIENT",
    tenantSlug?: string,
    key?: string
  ) => {
    setActiveId(key || role);
    startTransition(async () => {
      try {
        await demoLoginAction(role, tenantSlug);
      } catch (err) {
        // Allow Next.js redirect() signal to bubble up
        if (
          (err as Error)?.message?.includes("NEXT_REDIRECT") ||
          (err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        console.error("Demo login error:", err);
        setActiveId(null);
      }
    });
  };

  return (
    <div className="mb-6 bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Quick Demo Login
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Choose an account below to log in with 1 click:
      </p>

      <div className="space-y-2">
        {/* Shajeev (Superadmin) */}
        <button
          type="button"
          data-nav="true"
          disabled={isPending}
          onClick={() => handleDemoClick("SUPERADMIN", undefined, "owner")}
          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition disabled:opacity-75 cursor-pointer disabled:cursor-wait"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <span>
              {isPending && activeId === "owner"
                ? "👑 Signing in as Shajeev..."
                : "👑 Business Owner / Shajeev"}
            </span>
          </div>
          {isPending && activeId === "owner" ? (
            <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
          )}
        </button>

        {/* Robin Tech */}
        <button
          type="button"
          data-nav="true"
          disabled={isPending}
          onClick={() => handleDemoClick("CLIENT", "robin-tech", "robin")}
          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 text-xs font-bold transition disabled:opacity-75 cursor-pointer disabled:cursor-wait"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>
              {isPending && activeId === "robin"
                ? "🏢 Signing in to Robin Tech..."
                : "🏢 Client 1: Robin Tech (Sells USD)"}
            </span>
          </div>
          {isPending && activeId === "robin" ? (
            <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
          )}
        </button>

        {/* Rigan Travels */}
        <button
          type="button"
          data-nav="true"
          disabled={isPending}
          onClick={() => handleDemoClick("CLIENT", "rigan-travels", "rigan")}
          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 text-xs font-bold transition disabled:opacity-75 cursor-pointer disabled:cursor-wait"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            <span>
              {isPending && activeId === "rigan"
                ? "🏢 Signing in to Rigan Travels..."
                : "🏢 Client 2: Rigan Travels (Buys USD)"}
            </span>
          </div>
          {isPending && activeId === "rigan" ? (
            <Loader2 className="h-3.5 w-3.5 text-purple-600 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
          )}
        </button>

        {/* Rasel Atia */}
        <button
          type="button"
          data-nav="true"
          disabled={isPending}
          onClick={() => handleDemoClick("CLIENT", "rasel-atia", "rasel")}
          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold transition disabled:opacity-75 cursor-pointer disabled:cursor-wait"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>
              {isPending && activeId === "rasel"
                ? "🏢 Signing in to Rasel Atia..."
                : "🏢 Client 3: Rasel Atia (Buys & Sells)"}
            </span>
          </div>
          {isPending && activeId === "rasel" ? (
            <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
          )}
        </button>
      </div>
    </div>
  );
}

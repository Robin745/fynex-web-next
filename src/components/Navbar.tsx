"use server";

import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  LogOut,
  Package,
  Shield,
  Layers,
} from "lucide-react";

interface NavbarProps {
  currentTenantSlug?: string;
  tenantName?: string;
}

export async function Navbar({ currentTenantSlug, tenantName }: NavbarProps) {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Section Title */}
          <div className="flex items-center gap-6">
            <Link
              href={session?.role === "SUPERADMIN" ? "/admin" : currentTenantSlug ? `/portal/${currentTenantSlug}` : "/"}
              className="flex items-center gap-2.5 font-bold text-slate-900 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  FYN<span className="text-emerald-600">EX</span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Business Operations
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {session?.role === "SUPERADMIN" ? (
                <>
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
                  >
                    <Layers className="h-4 w-4" />
                    All Clients Dashboard
                  </Link>
                  <Link
                    href="/admin/entry"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Daily Batch Entry
                  </Link>
                </>
              ) : currentTenantSlug ? (
                <>
                  <Link
                    href={`/portal/${currentTenantSlug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Financial Overview
                  </Link>
                  <Link
                    href={`/portal/${currentTenantSlug}/transactions`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Transactions & Data Tools
                  </Link>
                  <Link
                    href={`/portal/${currentTenantSlug}/inventory`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition"
                  >
                    <Package className="h-4 w-4" />
                    Products & Catalog
                  </Link>
                </>
              ) : null}
            </nav>
          </div>

          {/* Right side: User profile, Organization indicator, and Logout */}
          <div className="flex items-center gap-3">
            {tenantName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-full text-xs font-medium text-blue-800">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span>{tenantName}</span>
              </div>
            )}

            {session ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">
                    {session.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center justify-end gap-1">
                    {session.role === "SUPERADMIN" ? (
                      <span className="text-amber-600 flex items-center gap-0.5 font-semibold">
                        <Shield className="h-3 w-3" /> Business Admin
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Client Workspace</span>
                    )}
                  </span>
                </div>

                {/* Switch to Superadmin if testing */}
                {session.role !== "SUPERADMIN" && (
                  <Link
                    href="/login"
                    className="text-xs text-slate-600 hover:text-blue-600 bg-slate-100 px-2.5 py-1.5 rounded-md hover:bg-slate-200 transition"
                  >
                    Switch Role
                  </Link>
                )}

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

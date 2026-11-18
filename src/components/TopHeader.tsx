"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { SessionUser } from "@/lib/types";
import {
  Shield,
  Building2,
  LogOut,
  ArrowLeftRight,
  ChevronRight,
  User,
} from "lucide-react";

interface TopHeaderProps {
  session: SessionUser;
  currentTenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export function TopHeader({ session, currentTenant }: TopHeaderProps) {
  const pathname = usePathname();
  const isSuperadmin = session.role === "SUPERADMIN";

  // Derive breadcrumb label from pathname
  let pageTitle = "Overview";
  if (pathname.includes("/entry")) pageTitle = "Daily Dollar Entry";
  else if (pathname.includes("/trades") || pathname.includes("/transactions")) pageTitle = "Transactions";
  else if (pathname.includes("/calculator") || pathname.includes("/inventory")) pageTitle = "Dollar Calculator";
  else if (pathname.includes("/clients/")) pageTitle = "Client Details";

  return (
    <header className="hidden lg:flex h-16 w-full items-center justify-between border-b border-[#d6e8de] bg-white px-6 sticky top-0 z-20">
      {/* Left Breadcrumb Context */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500">
          {currentTenant ? currentTenant.name : "Admin"}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{pageTitle}</span>
      </div>

      {/* Right User Info & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {isSuperadmin ? (
            <>
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-amber-800">Admin</span>
            </>
          ) : (
            <>
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-blue-800">Client</span>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {session.name}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {session.email}
            </span>
          </div>
        </div>

        {/* Switch Role Button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Switch test role"
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>Switch Role</span>
        </Link>

        {/* Sign Out Button */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer"
            title="Sign out of platform"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </header>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Check,
  User,
} from "lucide-react";

interface TopHeaderProps {
  session: SessionUser;
  currentTenant?: {
    id: string;
    name: string;
    slug: string;
  };
  allTenants?: {
    id: string;
    name: string;
    slug: string;
  }[];
}

export function TopHeader({ session, currentTenant, allTenants }: TopHeaderProps) {
  const pathname = usePathname();
  const isSuperadmin = session.role === "SUPERADMIN";

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show role switcher when multiple roles/workspaces are available
  const hasMultipleRoles =
    isSuperadmin || (session.tenants && session.tenants.length > 1);

  const availableTenants = isSuperadmin
    ? (allTenants || [])
    : (session.tenants || []);

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

        {/* Switch Role Toggle (Only shown when multiple roles are available) */}
        {hasMultipleRoles && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg transition cursor-pointer"
              title="Switch role or workspace"
            >
              <ArrowLeftRight className="h-3 w-3 text-emerald-700" />
              <span>Switch Role</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>

                {/* If Superadmin, option to return to central admin */}
                {isSuperadmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition ${
                      !currentTenant
                        ? "bg-amber-50/70 text-amber-900 font-bold"
                        : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-amber-600" />
                      <span>👑 Business Owner (Admin)</span>
                    </div>
                    {!currentTenant && <Check className="h-3.5 w-3.5 text-amber-600" />}
                  </Link>
                )}

                {/* Available Client Accounts */}
                {availableTenants.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1">
                      Client Accounts
                    </div>
                    {availableTenants.map((t) => {
                      const isCurrent = currentTenant?.slug === t.slug;
                      return (
                        <Link
                          key={t.id}
                          href={`/portal/${t.slug}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition ${
                            isCurrent
                              ? "bg-emerald-50/70 text-emerald-900 font-bold"
                              : "text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{t.name}</span>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                        </Link>
                      );
                    })}
                  </>
                )}

                {/* Switch Demo Account option */}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <Link
                    href="/login?switch=true"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition text-[11px]"
                  >
                    <ArrowLeftRight className="h-3 w-3 text-slate-400" />
                    <span>Switch Demo Account...</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

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

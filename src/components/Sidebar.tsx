"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { SessionUser } from "@/lib/types";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  LogOut,
  Package,
  Shield,
  Layers,
  Menu,
  X,
  ChevronRight,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface SidebarProps {
  session: SessionUser;
  currentTenant?: {
    id: string;
    name: string;
    slug: string;
    currency?: string;
  };
  allTenants?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function Sidebar({ session, currentTenant, allTenants }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state

  // Load saved collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fynex_sidebar_collapsed") ?? localStorage.getItem("nexus_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fynex_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Keyboard shortcut: Cmd+B or Ctrl+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isSuperadmin = session.role === "SUPERADMIN";
  const hasMultipleRoles =
    isSuperadmin || (session.tenants && session.tenants.length > 1);

  // Navigation Links for Superadmin
  const adminNav = [
    {
      name: "Overview",
      href: "/admin",
      icon: Layers,
    },
    {
      name: "Daily Dollar Entry",
      href: "/admin/entry",
      icon: CalendarDays,
    },
  ];

  // Navigation Links for Client Portal
  const clientNav = currentTenant
    ? [
        {
          name: "Overview",
          href: `/portal/${currentTenant.slug}`,
          icon: BarChart3,
        },
        {
          name: "Transactions",
          href: `/portal/${currentTenant.slug}/trades`,
          icon: FileSpreadsheet,
        },
        {
          name: "Dollar Calculator",
          href: `/portal/${currentTenant.slug}/calculator`,
          icon: ArrowLeftRight,
        },
      ]
    : [];

  const navItems = isSuperadmin && !currentTenant ? adminNav : clientNav;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#d6e8de] bg-[#f2f8f5] px-4">
        <Link href={isSuperadmin ? "/admin" : currentTenant ? `/portal/${currentTenant.slug}` : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">
            FYN<span className="text-emerald-600">EX</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg transition cursor-pointer"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container: Smoothly expands/collapses on desktop between w-64 and w-16 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#d6e8de] bg-[#f2f8f5] text-slate-700 transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } ${isCollapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        {/* Brand Header */}
        <div className={`flex h-16 items-center border-b border-[#d6e8de] bg-[#f2f8f5] transition-all ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg transition cursor-pointer"
              title="Expand sidebar (Ctrl+B)"
            >
              <PanelLeftOpen className="h-5 w-5 text-emerald-700" />
            </button>
          ) : (
            <>
              <Link
                href={isSuperadmin ? "/admin" : currentTenant ? `/portal/${currentTenant.slug}` : "/"}
                className="flex items-center gap-2.5 font-bold text-slate-900 min-w-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
                    FYN<span className="text-emerald-600">EX</span>
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider truncate">
                    Business Operations
                  </span>
                </div>
              </Link>

              {/* Desktop Collapse Toggle Button */}
              <button
                type="button"
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition cursor-pointer"
                title="Collapse sidebar (Ctrl+B)"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Workspace / Context Badge */}
        <div className={`transition-all ${isCollapsed ? "p-2 mx-1.5 mt-3 flex justify-center" : "p-3 mx-3 mt-3.5 rounded-xl bg-white border border-[#d6e8de] shadow-xs"}`}>
          {isCollapsed ? (
            <div
              className="h-8 w-8 rounded-lg bg-white border border-[#d6e8de] flex items-center justify-center shadow-xs cursor-default"
              title={currentTenant ? `${currentTenant.name} (Client Workspace)` : "Central Administration"}
            >
              {currentTenant ? (
                <span className="text-xs font-bold text-emerald-700">
                  {currentTenant.name.substring(0, 2).toUpperCase()}
                </span>
              ) : (
                <Shield className="h-4 w-4 text-amber-600" />
              )}
            </div>
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Account
              </span>
              <div className="flex items-center gap-2 min-w-0">
                {currentTenant ? (
                  <>
                    <div className="h-7 w-7 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentTenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentTenant.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {isSuperadmin ? "Admin View" : "Client Account"}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-7 w-7 rounded-md bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        Admin
                      </div>
                      <div className="text-[10px] text-amber-700 font-semibold truncate">
                        All Clients
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          <nav className="space-y-1">
            {!isCollapsed && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                Menu
              </span>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={item.name}
                  className={`flex items-center rounded-lg text-xs font-semibold transition ${
                    isCollapsed
                      ? "justify-center p-2.5 my-1"
                      : "gap-2.5 px-3 py-2"
                  } ${
                    isActive
                      ? "bg-white text-emerald-800 shadow-xs font-bold border border-[#d6e8de]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}

            {/* Back to all clients button if in tenant view */}
            {isSuperadmin && currentTenant && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                title="Back to All Clients"
                className={`flex items-center rounded-lg text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-white/70 transition ${
                  isCollapsed ? "justify-center p-2.5 my-1" : "gap-2.5 px-3 py-2"
                }`}
              >
                <Layers className="h-4 w-4 text-slate-400 shrink-0" />
                {!isCollapsed && <span className="truncate">Back to All Clients</span>}
              </Link>
            )}
          </nav>

          {/* Quick Clients List (if superadmin) */}
          {isSuperadmin && allTenants && allTenants.length > 0 && (
            <div className="space-y-1 pt-3 border-t border-[#d6e8de]">
              {!isCollapsed ? (
                <>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1.5">
                    Clients
                  </span>
                  <div className="space-y-0.5">
                    {allTenants.map((t) => {
                      const isClientActive = pathname.includes(`/admin/clients/${t.slug}`);
                      return (
                        <Link
                          key={t.id}
                          href={`/admin/clients/${t.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                            isClientActive
                              ? "bg-white text-slate-900 font-bold border border-[#d6e8de] shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{t.name}</span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  {allTenants.map((t) => {
                    const isClientActive = pathname.includes(`/admin/clients/${t.slug}`);
                    return (
                      <Link
                        key={t.id}
                        href={`/admin/clients/${t.slug}`}
                        title={t.name}
                        className={`flex items-center justify-center p-2 rounded-lg text-xs transition ${
                          isClientActive
                            ? "bg-white text-emerald-800 font-bold border border-[#d6e8de] shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                        }`}
                      >
                        <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Profile & Actions (Mobile Drawer Only) */}
        <div className="p-3 border-t border-[#d6e8de] bg-[#f2f8f5] lg:hidden space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{session.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{session.email}</div>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                isSuperadmin ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isSuperadmin ? "Admin" : "Client"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            {hasMultipleRoles && (
              <Link
                href="/login?switch=true"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-[#d6e8de] rounded-lg transition"
              >
                <ArrowLeftRight className="h-3 w-3" />
                <span>Switch Role</span>
              </Link>
            )}

            <form action={logoutAction} className={hasMultipleRoles ? "shrink-0" : "w-full"}>
              <button
                type="submit"
                className={`flex items-center justify-center ${
                  hasMultipleRoles ? "h-7 w-7" : "w-full py-1.5 gap-1.5 text-xs font-semibold"
                } text-rose-600 bg-white border border-[#d6e8de] hover:bg-rose-50 rounded-lg transition cursor-pointer`}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                {!hasMultipleRoles && <span>Sign Out</span>}
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

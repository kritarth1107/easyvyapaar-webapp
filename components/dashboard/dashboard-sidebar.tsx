"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_LOGO } from "@/lib/brand/assets";
import {
  DASHBOARD_NAV_BOTTOM,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_POS,
  DASHBOARD_NAV_TOP,
  DASHBOARD_SETTINGS_GROUP,
  getGroupActive,
  isNavActive,
  type DashboardNavGroup,
  type DashboardNavLink,
} from "@/lib/dashboard/navigation";
import { SITE_NAME } from "@/lib/seo/site-metadata";
import { NavIcon } from "./nav-icon";

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`h-4 w-4 shrink-0 text-brand-primary-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavItemLink({
  item,
  pathname,
  nested,
  onNavigate,
}: {
  item: DashboardNavLink;
  pathname: string;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const active = isNavActive(pathname, item.href);
  const iconId = item.icon ?? "document";

  if (item.highlight) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="group relative mx-2 flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-3.5 py-3 text-[15px] font-semibold text-white transition-all hover:brightness-105"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <NavIcon id={iconId} className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Live
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`relative flex items-center gap-3 rounded-lg font-medium transition-all duration-150 ${
        nested ? "ml-5 mr-2 py-2 pl-3 pr-2 text-[14px]" : "mx-2 px-3 py-2.5 text-[15px]"
      } ${
        active
          ? "bg-brand-primary/[0.06] text-brand-primary"
          : "text-brand-primary-mid hover:bg-slate-100/90 hover:text-brand-primary"
      }`}
    >
      {!nested && (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active
              ? "bg-brand-primary text-white"
              : "bg-slate-100 text-brand-primary-muted group-hover:bg-slate-200/80 group-hover:text-brand-primary"
          }`}
        >
          <NavIcon id={iconId} className="h-[17px] w-[17px]" />
        </span>
      )}
      {nested && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-brand-orange-1" : "bg-slate-300"}`}
        />
      )}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  group: DashboardNavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const groupActive = getGroupActive(pathname, group);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
          groupActive
            ? "bg-brand-primary/[0.04] text-brand-primary"
            : "text-brand-primary hover:bg-slate-100/80"
        }`}
        aria-expanded={open}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            groupActive ? "bg-brand-primary/10 text-brand-orange-2" : "bg-slate-100 text-brand-primary-muted"
          }`}
        >
          <NavIcon id={group.icon} className="h-[17px] w-[17px]" />
        </span>
        <span className="flex-1 truncate text-[14px] font-semibold tracking-tight">{group.label}</span>
        <Chevron open={open} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="relative ml-6 mr-2 border-l border-slate-200/90 py-1 pl-2">
            {group.items.map((item) => (
              <NavItemLink key={item.id} item={item} pathname={pathname} nested onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitialOpenGroups(pathname: string): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  for (const group of [...DASHBOARD_NAV_GROUPS, DASHBOARD_SETTINGS_GROUP]) {
    open[group.id] = group.defaultOpen === true || getGroupActive(pathname, group);
  }
  return open;
}

function SidebarPanel({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenGroups(pathname)
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of [...DASHBOARD_NAV_GROUPS, DASHBOARD_SETTINGS_GROUP]) {
        if (getGroupActive(pathname, group)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="dashboard-sidebar flex h-full w-[268px] shrink-0 flex-col border-r border-slate-200/90 bg-white">
      {/* Brand */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-4">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-surface ring-1 ring-slate-200/80">
            <Image
              src={BRAND_LOGO}
              alt={SITE_NAME}
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold leading-none tracking-tight text-brand-primary">
              EasyVyapaar
            </p>
            <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-brand-orange-2">
              Retail ERP
            </p>
          </div>
        </Link>
      </div>

      <nav className="scrollbar-hidden flex-1 overflow-y-auto py-3" aria-label="Main navigation">
        <div className="mb-2">
          {DASHBOARD_NAV_TOP.map((item) => (
            <NavItemLink key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
          ))}
        </div>

        <p className="mx-4 mb-2 mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary-muted/80">
          Modules
        </p>

        {DASHBOARD_NAV_GROUPS.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            open={openGroups[group.id] ?? false}
            onToggle={() => toggleGroup(group.id)}
            onNavigate={onClose}
          />
        ))}

        <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {DASHBOARD_NAV_BOTTOM.map((item) => (
          <NavItemLink key={item.id} item={item} pathname={pathname} onNavigate={onClose} />
        ))}

        <NavGroupSection
          group={DASHBOARD_SETTINGS_GROUP}
          pathname={pathname}
          open={openGroups[DASHBOARD_SETTINGS_GROUP.id] ?? false}
          onToggle={() => toggleGroup(DASHBOARD_SETTINGS_GROUP.id)}
          onNavigate={onClose}
        />
      </nav>

      <div className="shrink-0 border-t border-slate-100 bg-white px-2 pb-3 pt-2">
        <NavItemLink item={DASHBOARD_NAV_POS} pathname={pathname} onNavigate={onClose} />
        <p className="mt-2 text-center text-[10px] font-medium text-brand-primary-muted">
          GST · Inventory · Billing
        </p>
      </div>
    </aside>
  );
}

export function DashboardSidebar({ mobileOpen, onClose }: DashboardSidebarProps) {
  return (
    <>
      <div className="hidden h-full lg:block">
        <SidebarPanel />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-primary/30 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 left-0 z-50 h-full shadow-2xl">
            <SidebarPanel onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getGroupActive,
  isNavActive,
  useDashboardNav,
  type DashboardNavGroup,
  type DashboardNavLink,
} from "@/lib/dashboard/navigation";
import { useTranslation } from "@/lib/localization";
import { SidebarShopSwitcher } from "./business-switch";
import { NavIcon } from "./nav-icon";

type DashboardSidebarProps = {
  collapsed?: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onOpenBusinessSwitch: () => void;
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
  collapsed,
  onNavigate,
  liveLabel,
  aiBadgeLabel,
}: {
  item: DashboardNavLink;
  pathname: string;
  nested?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  liveLabel?: string;
  aiBadgeLabel?: string;
}) {
  const active = isNavActive(pathname, item.href);
  const iconId = item.icon ?? "document";

  if (item.accent === "ai") {
    if (collapsed) {
      return (
        <Link
          href={item.href}
          onClick={onNavigate}
          title={item.label}
          className={`group relative mx-1.5 flex items-center justify-center rounded-xl border p-2.5 transition-all ${
            active
              ? "border-violet-300/90 bg-gradient-to-r from-violet-100/90 to-indigo-50 text-violet-700"
              : "border-violet-200/70 bg-violet-50/80 text-violet-600 hover:border-violet-300/80"
          }`}
        >
          <NavIcon id={iconId} className="h-[18px] w-[18px]" />
        </Link>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`group relative mx-2 flex items-start gap-3 overflow-hidden rounded-xl border px-3.5 py-3 text-[15px] font-semibold transition-all ${
          active
            ? "border-violet-300/90 bg-gradient-to-r from-violet-100/90 via-indigo-50 to-sky-50 text-brand-primary shadow-[0_2px_12px_-4px_rgba(109,40,217,0.2)]"
            : "border-violet-200/70 bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/50 text-brand-primary hover:border-violet-300/80 hover:from-violet-50 hover:to-indigo-50/80"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-violet-600/15 text-violet-700" : "bg-violet-500/10 text-violet-600"
          }`}
        >
          <NavIcon id={iconId} className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate">{item.label}</span>
            {aiBadgeLabel && (
              <span className="shrink-0 rounded-md bg-violet-600/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                {aiBadgeLabel}
              </span>
            )}
          </span>
          {item.description && (
            <span className="mt-0.5 block truncate text-[11px] font-normal leading-snug text-violet-600/75">
              {item.description}
            </span>
          )}
        </span>
      </Link>
    );
  }

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
        {liveLabel && (
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {liveLabel}
          </span>
        )}
      </Link>
    );
  }

  if (collapsed && !nested) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.label}
        className={`relative mx-1.5 flex items-center justify-center rounded-lg p-2 transition-all duration-150 ${
          active
            ? "bg-brand-primary/[0.06] text-brand-primary"
            : "text-brand-primary-mid hover:bg-slate-100/90 hover:text-brand-primary"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active
              ? "bg-brand-primary text-white"
              : "bg-slate-100 text-brand-primary-muted group-hover:bg-slate-200/80 group-hover:text-brand-primary"
          }`}
        >
          <NavIcon id={iconId} className="h-[17px] w-[17px]" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
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
  collapsed,
  flyoutOpen,
  onToggle,
  onFlyoutToggle,
  onNavigate,
}: {
  group: DashboardNavGroup;
  pathname: string;
  open: boolean;
  collapsed?: boolean;
  flyoutOpen?: boolean;
  onToggle: () => void;
  onFlyoutToggle?: () => void;
  onNavigate?: () => void;
}) {
  const groupActive = getGroupActive(pathname, group);

  if (collapsed) {
    return (
      <div className="relative mb-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFlyoutToggle?.();
          }}
          title={group.label}
          className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center justify-center rounded-lg p-2 transition-colors ${
            groupActive || flyoutOpen
              ? "bg-brand-primary/[0.06] text-brand-primary"
              : "text-brand-primary hover:bg-slate-100/80"
          }`}
          aria-expanded={flyoutOpen}
          aria-haspopup="true"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              groupActive ? "bg-brand-primary/10 text-brand-orange-2" : "bg-slate-100 text-brand-primary-muted"
            }`}
          >
            <NavIcon id={group.icon} className="h-[17px] w-[17px]" />
          </span>
        </button>

        {flyoutOpen && (
          <div
            className="absolute left-full top-0 z-50 ml-1.5 min-w-[200px] rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                pathname={pathname}
                nested
                onNavigate={() => {
                  onNavigate?.();
                  onFlyoutToggle?.();
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

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

function SidebarPanel({
  collapsed,
  onClose,
  onOpenBusinessSwitch,
}: {
  collapsed?: boolean;
  onClose?: () => void;
  onOpenBusinessSwitch: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { top, groups, bottom, settingsGroup } = useDashboardNav();

  const getInitialOpenGroups = (path: string) => {
    const open: Record<string, boolean> = {};
    for (const group of [...groups, settingsGroup]) {
      open[group.id] = group.defaultOpen === true || getGroupActive(path, group);
    }
    return open;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenGroups(pathname)
  );
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!collapsed) {
      setFlyoutGroupId(null);
    }
  }, [collapsed]);

  useEffect(() => {
    if (!flyoutGroupId) return;
    const close = () => setFlyoutGroupId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [flyoutGroupId]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of [...groups, settingsGroup]) {
        if (getGroupActive(pathname, group)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname, groups, settingsGroup]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={`dashboard-sidebar relative flex h-full shrink-0 flex-col overflow-x-hidden border-r border-slate-200/90 bg-white transition-[width] duration-200 ease-out ${
        collapsed ? "w-[72px]" : "w-[268px]"
      }`}
    >
      {/* Business switcher */}
      <div
        className={`shrink-0 border-b border-slate-100 ${collapsed ? "flex justify-center px-2 py-2.5" : "px-3 py-2.5"}`}
      >
        <SidebarShopSwitcher
          collapsed={collapsed}
          onOpen={onOpenBusinessSwitch}
          onNavigate={onClose}
        />
      </div>

      <nav className="scrollbar-hidden flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Main navigation">
        <div className={collapsed ? "mb-2 space-y-1" : "mb-2"}>
          {top.map((item) => (
            <div key={item.id} className={!collapsed && item.accent === "ai" ? "mt-3" : undefined}>
              <NavItemLink
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onClose}
                aiBadgeLabel={
                  !collapsed && item.accent === "ai" ? t("dashboard.aiNavBadge") : undefined
                }
              />
            </div>
          ))}
        </div>

        {!collapsed && (
          <p className="mx-4 mb-2 mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary-muted/80">
            {t("dashboard.modulesLabel")}
          </p>
        )}

        {groups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
            open={openGroups[group.id] ?? false}
            flyoutOpen={flyoutGroupId === group.id}
            onToggle={() => toggleGroup(group.id)}
            onFlyoutToggle={() =>
              setFlyoutGroupId((prev) => (prev === group.id ? null : group.id))
            }
            onNavigate={onClose}
          />
        ))}

        {!collapsed && (
          <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        )}

        {bottom.map((item) => (
          <NavItemLink
            key={item.id}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onClose}
          />
        ))}

        <NavGroupSection
          group={settingsGroup}
          pathname={pathname}
          collapsed={collapsed}
          open={openGroups[settingsGroup.id] ?? false}
          flyoutOpen={flyoutGroupId === settingsGroup.id}
          onToggle={() => toggleGroup(settingsGroup.id)}
          onFlyoutToggle={() =>
            setFlyoutGroupId((prev) => (prev === settingsGroup.id ? null : settingsGroup.id))
          }
          onNavigate={onClose}
        />
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          <p className="text-center text-[10px] font-medium text-brand-primary-muted">
            {t("dashboard.sidebarTagline")}
          </p>
        </div>
      )}
    </aside>
  );
}

export function DashboardSidebar({
  collapsed = false,
  mobileOpen,
  onClose,
  onOpenBusinessSwitch,
}: DashboardSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="hidden h-full lg:block">
        <SidebarPanel collapsed={collapsed} onOpenBusinessSwitch={onOpenBusinessSwitch} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-primary/30 backdrop-blur-[2px]"
            aria-label={t("dashboard.closeMenu")}
            onClick={onClose}
          />
          <div className="absolute inset-y-0 left-0 z-50 h-full shadow-2xl">
            <SidebarPanel onClose={onClose} onOpenBusinessSwitch={onOpenBusinessSwitch} />
          </div>
        </div>
      )}
    </>
  );
}

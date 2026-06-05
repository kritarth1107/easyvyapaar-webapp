"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { UserAccountMenu } from "@/components/dashboard/user-account-menu";
import { useUserMe } from "@/components/providers/user-me-provider";
import { isNavActive, useDashboardNav } from "@/lib/dashboard/use-dashboard-nav";
import { useTranslation } from "@/lib/localization";

type DashboardTopbarProps = {
  onMenuClick: () => void;
  onOpenBusinessSwitch: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      {collapsed ? (
        <>
          <path
            d="M8 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M16 8l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 8l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardTopbar({
  onMenuClick,
  onOpenBusinessSwitch,
  sidebarCollapsed,
  onToggleSidebar,
}: DashboardTopbarProps) {
  const pathname = usePathname();
  const { getPageTitle, getInventoryBreadcrumb, getSalesBreadcrumb, salesInvoice, pos } =
    useDashboardNav();
  const pageTitle = getPageTitle(pathname);
  const inventoryCrumb = getInventoryBreadcrumb(pathname);
  const salesCrumb = getSalesBreadcrumb(pathname);
  const salesInvoiceActive = isNavActive(pathname, salesInvoice.href);
  const posActive = isNavActive(pathname, pos.href);
  const { t } = useTranslation();
  const { user } = useUserMe();
  const canOpenBusinessModal = (user?.organisations.length ?? 0) >= 1;
  const isHome = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md lg:gap-4 lg:px-6">
      {/* Left — menu + page context */}
      <div className="flex min-w-0 items-center gap-2 lg:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50 lg:hidden"
          aria-label={t("dashboard.openMenu")}
        >
          <MenuIcon />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden shrink-0 text-brand-primary-muted transition-colors hover:text-brand-primary lg:inline-flex"
          aria-label={
            sidebarCollapsed ? t("dashboard.expandSidebar") : t("dashboard.collapseSidebar")
          }
          aria-expanded={!sidebarCollapsed}
        >
          <SidebarToggleIcon collapsed={sidebarCollapsed} />
        </button>

        <div className="min-w-0 pl-0 lg:pl-1">
          <nav
            className="mb-0.5 hidden items-center gap-1.5 text-[11px] font-medium text-brand-primary-muted sm:flex"
            aria-label="Breadcrumb"
          >
            <Link href="/dashboard" className="transition-colors hover:text-brand-orange-2">
              {t("dashboard.breadcrumbHome")}
            </Link>
            {!isHome && (
              <>
                {inventoryCrumb && (
                  <>
                    <span className="text-slate-300">/</span>
                    <Link
                      href="/dashboard/inventory/items"
                      className="truncate transition-colors hover:text-brand-orange-2"
                    >
                      {inventoryCrumb}
                    </Link>
                  </>
                )}
                {salesCrumb && (
                  <>
                    <span className="text-slate-300">/</span>
                    <Link
                      href="/dashboard/sales/invoices"
                      className="truncate transition-colors hover:text-brand-orange-2"
                    >
                      {salesCrumb}
                    </Link>
                  </>
                )}
                <span className="text-slate-300">/</span>
                <span className="truncate text-brand-primary">{pageTitle}</span>
              </>
            )}
          </nav>
          <h1 className="truncate text-lg font-bold tracking-tight text-brand-primary lg:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center — search */}
      <div className="hidden flex-1 justify-center px-2 md:flex">
        <label className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder={t("dashboard.searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/80 pl-10 pr-4 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            disabled
            aria-label={t("dashboard.searchPlaceholder")}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-brand-primary-muted lg:inline">
            ⌘K
          </kbd>
        </label>
      </div>

      {/* Right — Sales Invoice, POS, alerts, user */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href={salesInvoice.href}
          className={`inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-primary-light px-3 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-105 sm:px-4 ${
            salesInvoiceActive ? "ring-2 ring-brand-primary/30 ring-offset-1" : ""
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <NavIcon id="document" className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{salesInvoice.label}</span>
        </Link>

        <Link
          href={pos.href}
          className={`inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-3 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.45)] transition-all hover:brightness-105 sm:px-4 ${
            posActive ? "ring-2 ring-brand-orange-1/30 ring-offset-1" : ""
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <NavIcon id="pos" className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">{pos.label}</span>
          <span className="hidden rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider md:inline">
            {t("dashboard.posLive")}
          </span>
        </Link>

        <NotificationsPopover />

        <UserAccountMenu
          onOpenSwitchBusiness={canOpenBusinessModal ? onOpenBusinessSwitch : undefined}
        />
      </div>
    </header>
  );
}

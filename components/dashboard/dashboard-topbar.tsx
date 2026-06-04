"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OrganisationSelectModal } from "@/components/auth/organisation-select-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import { getDashboardPageTitle } from "@/lib/dashboard/navigation";
import { useTranslation } from "@/lib/localization";

type DashboardTopbarProps = {
  onMenuClick: () => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M12 3a5 5 0 00-5 5v3.5L5 14v1h14v-1l-2-2.5V8a5 5 0 00-5-5zM10 18a2 2 0 004 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-brand-primary-muted" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function orgInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function IconButton({
  children,
  label,
  badge,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  badge?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-brand-primary-muted transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-brand-primary"
      aria-label={label}
    >
      {children}
      {badge && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-orange-1 ring-2 ring-white" />
      )}
    </button>
  );
}

function ShopSwitcher({
  orgName,
  initials,
  role,
  canSwitch,
  isLoading,
  isSwitchingShop,
  onOpen,
}: {
  orgName: string;
  initials: string;
  role?: string;
  canSwitch: boolean;
  isLoading: boolean;
  isSwitchingShop: boolean;
  onOpen: () => void;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-mid text-xs font-bold text-white">
        {initials}
      </span>
      <span className="hidden min-w-0 text-left sm:block">
        <span className="block truncate text-sm font-semibold text-brand-primary">
          {isLoading ? "…" : orgName}
        </span>
        <span className="block truncate text-[11px] font-medium text-brand-primary-muted">
          {role ?? "Business"}
        </span>
      </span>
      {canSwitch && <ChevronIcon />}
    </>
  );

  const className =
    "flex max-w-[220px] items-center gap-2.5 rounded-xl border border-slate-200/90 bg-gradient-to-r from-white to-brand-surface/80 px-2.5 py-2 transition-all hover:border-brand-orange-1/30 hover:shadow-[0_2px_12px_-4px_rgba(3,31,73,0.12)] disabled:opacity-60 md:max-w-[260px]";

  if (canSwitch) {
    return (
      <button
        type="button"
        onClick={onOpen}
        disabled={isSwitchingShop}
        className={className}
        aria-label="Switch business"
      >
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const pathname = usePathname();
  const pageTitle = getDashboardPageTitle(pathname);
  const { t } = useTranslation();
  const { user, activeOrganisation, isLoading, isSwitchingShop, switchActiveOrganisation } =
    useUserMe();
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  const orgName = activeOrganisation?.name ?? t("common.brandName");
  const initials = orgInitials(orgName);
  const userInitials = orgInitials(user?.name ?? "U");
  const canSwitch = (user?.organisations.length ?? 0) > 1;
  const isHome = pathname === "/dashboard";

  return (
    <>
      <OrganisationSelectModal
        open={switchModalOpen}
        organisations={user?.organisations ?? []}
        defaultOrganisationId={user?.defaultOrganisationId}
        primaryBadge={t("orgSelect.primaryBadge")}
        title={t("orgSelect.switchTitle")}
        subtitle={t("orgSelect.switchSubtitle")}
        continueLabel={t("orgSelect.loginHint")}
        onSelect={(orgId) => {
          setSwitchModalOpen(false);
          void switchActiveOrganisation(orgId);
        }}
      />

      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md lg:gap-4 lg:px-6">
        {/* Left — menu + page context */}
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0 border-l border-transparent pl-0 lg:border-slate-200/80 lg:pl-3">
            <nav className="mb-0.5 hidden items-center gap-1.5 text-[11px] font-medium text-brand-primary-muted sm:flex" aria-label="Breadcrumb">
              <Link href="/dashboard" className="transition-colors hover:text-brand-orange-2">
                {t("dashboard.breadcrumbHome")}
              </Link>
              {!isHome && (
                <>
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

        {/* Right — shop, alerts, user */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ShopSwitcher
            orgName={orgName}
            initials={initials}
            role={activeOrganisation?.userRole}
            canSwitch={canSwitch}
            isLoading={isLoading}
            isSwitchingShop={isSwitchingShop}
            onOpen={() => setSwitchModalOpen(true)}
          />

          <div className="hidden h-8 w-px bg-slate-200/90 sm:block" aria-hidden />

          <IconButton label="Notifications" badge>
            <BellIcon />
          </IconButton>

          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
            aria-label="Account"
            title={user?.name}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-xs font-bold text-white">
              {userInitials}
            </span>
            <span className="hidden max-w-[120px] truncate text-left md:block">
              <span className="block truncate text-sm font-semibold text-brand-primary">
                {user?.name ?? "User"}
              </span>
              <span className="block truncate text-[11px] text-brand-primary-muted">
                {user?.mobile ? `+91 ${user.mobile}` : t("common.retailErp")}
              </span>
            </span>
          </button>
        </div>
      </header>
    </>
  );
}

"use client";

import Image from "next/image";
import { OrganisationSelectModal } from "@/components/auth/organisation-select-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import { useTranslation } from "@/lib/localization";

export function orgInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-brand-primary-muted" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type BusinessSwitchModalProps = {
  open: boolean;
  onClose: () => void;
};

export function BusinessSwitchModal({ open, onClose }: BusinessSwitchModalProps) {
  const { t } = useTranslation();
  const { user, activeOrganisationId, switchActiveOrganisation } = useUserMe();

  return (
    <OrganisationSelectModal
      variant="dashboard"
      open={open}
      organisations={user?.organisations ?? []}
      activeOrganisationId={activeOrganisationId}
      currentBadge={t("orgSelect.currentBadge")}
      closeLabel={t("common.close")}
      title={t("orgSelect.switchTitle")}
      subtitle={t("orgSelect.switchSubtitle")}
      createBusiness={{
        title: t("orgSelect.createBusinessTitle"),
        subtitle: t("orgSelect.createBusinessSubtitle"),
        cta: t("orgSelect.createBusinessCta"),
        href: "/auth/register",
        onNavigate: onClose,
      }}
      onClose={onClose}
      onSelect={(orgId) => {
        onClose();
        void switchActiveOrganisation(orgId);
      }}
    />
  );
}

type SidebarShopSwitcherProps = {
  onOpen: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
};

export function SidebarShopSwitcher({ onOpen, onNavigate, collapsed }: SidebarShopSwitcherProps) {
  const { t } = useTranslation();
  const { user, activeOrganisation, isLoading, isSwitchingShop } = useUserMe();

  const orgName = activeOrganisation?.name ?? t("common.brandName");
  const initials = orgInitials(orgName);
  const gstNumber = activeOrganisation?.gstNumber?.trim();
  const gstDisplay = gstNumber || t("dashboard.noGst");
  const totalOrgs = user?.organisations.length ?? 0;
  const canOpen = totalOrgs >= 1;

  const handleClick = () => {
    onOpen();
    onNavigate?.();
  };

  const avatar = activeOrganisation?.logo ? (
    <Image
      src={activeOrganisation.logo}
      alt=""
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/90"
      unoptimized
    />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-mid text-sm font-bold text-white">
      {initials}
    </span>
  );

  const inner = (
    <>
      {avatar}
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-brand-primary">
          {isLoading ? "…" : orgName}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] font-medium tracking-wide text-brand-primary-muted">
          {isLoading ? "…" : gstDisplay}
        </p>
      </span>
      {canOpen && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-brand-primary-muted">
          <ChevronIcon />
        </span>
      )}
    </>
  );

  const expandedClassName =
    "flex w-full items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 text-left transition-all hover:border-brand-orange-1/35 hover:bg-brand-surface/50 disabled:opacity-60";
  const collapsedClassName =
    "mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200/90 bg-white transition-all hover:border-brand-orange-1/35 hover:bg-brand-surface/50 disabled:opacity-60";
  const title = isLoading ? undefined : `${orgName} · ${gstDisplay}`;

  if (collapsed) {
    const collapsedAvatar = activeOrganisation?.logo ? (
      <Image
        src={activeOrganisation.logo}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200/90"
        unoptimized
      />
    ) : (
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-mid text-xs font-bold text-white">
        {initials}
      </span>
    );

    if (!canOpen) {
      return (
        <div className={collapsedClassName} title={title}>
          {collapsedAvatar}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isSwitchingShop}
        className={collapsedClassName}
        aria-label={t("dashboard.switchBusiness")}
        title={title}
      >
        {collapsedAvatar}
      </button>
    );
  }

  if (!canOpen) {
    return <div className={expandedClassName}>{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSwitchingShop}
      className={expandedClassName}
      aria-label={t("dashboard.switchBusiness")}
    >
      {inner}
    </button>
  );
}

"use client";

import Image from "next/image";
import { useEffect } from "react";
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

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 10h16v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9zM4 10l2-6h14l2 6M9 14v3M15 14v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const hasOrgs = (user?.organisations.length ?? 0) > 0;
  const requireSelection = hasOrgs && !activeOrganisationId;

  return (
    <OrganisationSelectModal
      variant="dashboard"
      open={open}
      organisations={user?.organisations ?? []}
      activeOrganisationId={activeOrganisationId}
      requireSelection={requireSelection}
      currentBadge={t("orgSelect.currentBadge")}
      closeLabel={t("common.close")}
      title={requireSelection ? t("orgSelect.requiredTitle") : t("orgSelect.switchTitle")}
      subtitle={
        requireSelection ? t("orgSelect.requiredSubtitle") : t("orgSelect.switchSubtitle")
      }
      createBusiness={{
        title: t("orgSelect.createBusinessTitle"),
        subtitle: t("orgSelect.createBusinessSubtitle"),
        cta: t("orgSelect.createBusinessCta"),
        href: "/auth/register",
        onNavigate: onClose,
      }}
      onClose={requireSelection ? undefined : onClose}
      onSelect={(orgId) => {
        onClose();
        void switchActiveOrganisation(orgId);
      }}
    />
  );
}

/** Opens the business picker when the user has shops but none is active. */
export function AutoOpenOrganisationPicker({ onOpen }: { onOpen: () => void }) {
  const { user, activeOrganisationId, isLoading } = useUserMe();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.organisations.length > 0 && !activeOrganisationId) {
      onOpen();
    }
  }, [isLoading, user, activeOrganisationId, onOpen]);

  return null;
}

type SidebarShopSwitcherProps = {
  onOpen: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
};

export function SidebarShopSwitcher({ onOpen, onNavigate, collapsed }: SidebarShopSwitcherProps) {
  const { t } = useTranslation();
  const { user, activeOrganisation, isLoading, isSwitchingShop } = useUserMe();

  const hasActiveOrg = Boolean(activeOrganisation?.orgId);
  const totalOrgs = user?.organisations.length ?? 0;
  const hasOrgs = totalOrgs > 0;
  const needsSelection = hasOrgs && !hasActiveOrg;

  const orgName = isLoading
    ? "…"
    : hasActiveOrg
      ? activeOrganisation!.name
      : hasOrgs
        ? t("orgSelect.noOrganisationSelected")
        : t("dashboard.userSettings.noOrganisations");

  const gstNumber = activeOrganisation?.gstNumber?.trim();
  const gstDisplay = isLoading
    ? "…"
    : hasActiveOrg
      ? gstNumber || t("dashboard.noGst")
      : needsSelection
        ? t("orgSelect.selectOrganisationPrompt")
        : "";

  const canOpen = hasOrgs;

  const handleClick = () => {
    onOpen();
    onNavigate?.();
  };

  const emptyStateAvatar = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg text-amber-800 ${
        collapsed ? "h-9 w-9" : "h-10 w-10"
      } ${needsSelection ? "bg-amber-100 ring-1 ring-amber-300/80" : "bg-slate-100 ring-1 ring-slate-200/90"}`}
    >
      <ShopIcon />
    </span>
  );

  const avatar = hasActiveOrg
    ? activeOrganisation?.logo
      ? (
        <Image
          src={activeOrganisation.logo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/90"
          unoptimized
        />
      )
      : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-mid text-sm font-bold text-white">
          {orgInitials(activeOrganisation!.name)}
        </span>
      )
    : emptyStateAvatar;

  const inner = (
    <>
      {avatar}
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold leading-tight ${
              needsSelection ? "text-amber-900" : "text-brand-primary"
            }`}
          >
            {orgName}
          </p>
          {gstDisplay ? (
            <p
              className={`mt-0.5 truncate text-[11px] font-medium tracking-wide ${
                needsSelection ? "text-amber-800/90" : "font-mono text-brand-primary-muted"
              }`}
            >
              {gstDisplay}
            </p>
          ) : null}
        </span>
      )}
      {canOpen && !collapsed && (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-brand-primary-muted">
          <ChevronIcon />
        </span>
      )}
    </>
  );

  const expandedClassName = `flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all disabled:opacity-60 ${
    needsSelection
      ? "border-amber-300/90 bg-amber-50/80 hover:border-amber-400 hover:bg-amber-50"
      : "border-slate-200/90 bg-white hover:border-brand-orange-1/35 hover:bg-brand-surface/50"
  }`;
  const collapsedClassName = `mx-auto flex h-10 w-10 items-center justify-center rounded-lg border transition-all disabled:opacity-60 ${
    needsSelection
      ? "border-amber-300/90 bg-amber-50/80 hover:border-amber-400"
      : "border-slate-200/90 bg-white hover:border-brand-orange-1/35 hover:bg-brand-surface/50"
  }`;
  const title = isLoading ? undefined : needsSelection ? orgName : `${orgName}${gstDisplay ? ` · ${gstDisplay}` : ""}`;

  if (collapsed) {
    const collapsedAvatar = hasActiveOrg
      ? activeOrganisation?.logo
        ? (
          <Image
            src={activeOrganisation.logo}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200/90"
            unoptimized
          />
        )
        : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-mid text-xs font-bold text-white">
            {orgInitials(activeOrganisation!.name)}
          </span>
        )
      : emptyStateAvatar;

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
        aria-label={needsSelection ? t("orgSelect.noOrganisationSelected") : t("dashboard.switchBusiness")}
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
      aria-label={needsSelection ? t("orgSelect.noOrganisationSelected") : t("dashboard.switchBusiness")}
    >
      {inner}
    </button>
  );
}

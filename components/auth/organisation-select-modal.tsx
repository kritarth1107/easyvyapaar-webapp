"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { OrganisationSummary } from "@/lib/types/user-api";

export type CreateBusinessPrompt = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  onNavigate?: () => void;
};

type OrganisationSelectModalProps = {
  open: boolean;
  organisations: OrganisationSummary[];
  defaultOrganisationId?: string;
  /** Active shop on dashboard — shows "Current" pill instead of primary */
  activeOrganisationId?: string | null;
  primaryBadge?: string;
  currentBadge?: string;
  closeLabel?: string;
  title: string;
  subtitle: string;
  continueLabel?: string;
  /** Dashboard only — ignored when variant is login */
  createBusiness?: CreateBusinessPrompt;
  variant?: "login" | "dashboard";
  /** When true, user must pick an org — no close button or backdrop dismiss */
  requireSelection?: boolean;
  onSelect: (organisationId: string) => void;
  onClose?: () => void;
};

function OrgInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xs bg-brand-primary text-sm font-bold text-white">
      {initials || "?"}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CreateBusinessCta({ prompt }: { prompt: CreateBusinessPrompt }) {
  return (
    <Link
      href={prompt.href}
      onClick={prompt.onNavigate}
      className="group mt-4 flex items-center gap-3 rounded-xl border-2 border-dashed border-brand-orange-1/40 bg-gradient-to-br from-brand-surface-warm/80 via-white to-brand-surface px-4 py-4 transition-colors hover:border-brand-orange-1/70 hover:bg-brand-surface-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-1/50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange-2 to-brand-orange-1 text-white shadow-[0_4px_14px_-4px_rgba(246,62,22,0.45)] transition-transform group-hover:scale-105">
        <PlusIcon />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-bold text-brand-primary">{prompt.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-brand-primary-muted">
          {prompt.subtitle}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-orange-2 transition-colors group-hover:text-brand-orange-1">
          {prompt.cta}
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </Link>
  );
}

export function OrganisationSelectModal({
  open,
  organisations,
  defaultOrganisationId,
  activeOrganisationId,
  primaryBadge = "Primary",
  currentBadge = "Current",
  closeLabel = "Close",
  title,
  subtitle,
  continueLabel,
  createBusiness,
  variant = "login",
  requireSelection = false,
  onSelect,
  onClose,
}: OrganisationSelectModalProps) {
  const [mounted, setMounted] = useState(false);
  const isDashboard = variant === "dashboard";
  const showCreateBusiness = isDashboard && createBusiness && !requireSelection;
  const canDismiss = isDashboard && onClose && !requireSelection;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canDismiss) onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, canDismiss]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-select-title"
      onClick={canDismiss ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
            aria-label={closeLabel}
          >
            <CloseIcon />
          </button>
        )}

        <h2
          id="org-select-title"
          className={`text-lg font-bold text-brand-primary ${isDashboard ? "pr-10" : ""}`}
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

        {organisations.length > 0 && (
          <ul className="mt-5 max-h-[min(40vh,280px)] space-y-2 overflow-y-auto scrollbar-brand">
            {organisations.map((org) => {
              const isPrimary = !isDashboard && org.orgId === defaultOrganisationId;
              const isCurrent = isDashboard && org.orgId === activeOrganisationId;

              return (
                <li key={org.orgId}>
                  <button
                    type="button"
                    onClick={() => onSelect(org.orgId)}
                    disabled={isCurrent}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      isCurrent
                        ? "cursor-default border-brand-primary/25 bg-brand-primary/[0.06]"
                        : "border-slate-200/90 hover:border-brand-orange-1/60 hover:bg-brand-surface-warm"
                    }`}
                  >
                    {org.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-xs object-cover"
                      />
                    ) : (
                      <OrgInitials name={org.name} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-primary">
                        {org.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{org.userRole}</span>
                    </span>
                    {isPrimary && (
                      <span className="shrink-0 rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary-light">
                        {primaryBadge}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {currentBadge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {showCreateBusiness && <CreateBusinessCta prompt={createBusiness} />}

        {continueLabel && (
          <p className="mt-4 text-center text-xs text-slate-500">{continueLabel}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

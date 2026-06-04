"use client";

import type { OrganisationSummary } from "@/lib/types/user-api";

type OrganisationSelectModalProps = {
  open: boolean;
  organisations: OrganisationSummary[];
  defaultOrganisationId?: string;
  primaryBadge?: string;
  title: string;
  subtitle: string;
  continueLabel: string;
  onSelect: (organisationId: string) => void;
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

export function OrganisationSelectModal({
  open,
  organisations,
  defaultOrganisationId,
  primaryBadge = "Primary",
  title,
  subtitle,
  continueLabel,
  onSelect,
}: OrganisationSelectModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-primary/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-select-title"
    >
      <div className="w-full max-w-md rounded-xs border border-slate-200/90 bg-white p-6 shadow-xl">
        <h2 id="org-select-title" className="text-lg font-bold text-brand-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

        <ul className="mt-5 max-h-[min(50vh,320px)] space-y-2 overflow-y-auto">
          {organisations.map((org) => {
            const isDefault = org.orgId === defaultOrganisationId;
            return (
              <li key={org.orgId}>
                <button
                  type="button"
                  onClick={() => onSelect(org.orgId)}
                  className="flex w-full items-center gap-3 rounded-xs border border-slate-200/90 px-3 py-3 text-left transition-colors hover:border-brand-orange-1/60 hover:bg-brand-surface-warm"
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
                  {isDefault && (
                    <span className="shrink-0 rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary-light">
                      {primaryBadge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-center text-xs text-slate-500">{continueLabel}</p>
      </div>
    </div>
  );
}

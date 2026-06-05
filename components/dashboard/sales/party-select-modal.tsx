"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MOCK_PARTIES, WALK_IN_PARTY_ID } from "@/lib/dashboard/mock-parties";
import { formatInr } from "@/lib/sales/create-invoice-form";
import { useTranslation } from "@/lib/localization";

type PartySelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (partyId: string, cashSale?: boolean) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PartySelectModal({ open, onClose, onSelect }: PartySelectModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MOCK_PARTIES.filter((p) => p.id !== WALK_IN_PARTY_ID);
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone?.includes(q)
    );
  }, [query]);

  const walkIn = MOCK_PARTIES.find((p) => p.id === WALK_IN_PARTY_ID);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="party-select-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(520px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="party-select-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.salesInvoices.create.selectPartyTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-slate-100"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.salesInvoices.create.searchParty")}
            className="h-10 w-full shrink-0 rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
            autoFocus
          />

          <button
            type="button"
            onClick={() => {
              onSelect(WALK_IN_PARTY_ID, true);
              onClose();
            }}
            className="flex w-full shrink-0 items-center gap-3 rounded-md border border-dashed border-brand-primary/35 bg-white px-4 py-3 text-left transition-all hover:border-brand-primary/55 hover:bg-brand-primary/[0.04] active:bg-brand-primary/[0.07]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
              <CashIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-brand-primary">
                {t("dashboard.salesInvoices.create.cashWalkIn")}
              </span>
              <span className="mt-0.5 block text-xs text-brand-primary-muted">
                {walkIn?.name} · {formatInr(0)}
              </span>
            </span>
            <span className="shrink-0 text-brand-primary-muted" aria-hidden>
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200/90">
            <div className="grid shrink-0 grid-cols-2 border-b border-slate-100 bg-brand-surface/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
              <span>{t("dashboard.salesInvoices.create.partyName")}</span>
              <span className="text-right">{t("dashboard.salesInvoices.create.balance")}</span>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-brand">
              {filtered.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-brand-primary-muted">
                  {t("dashboard.salesInvoices.create.noPartiesFound")}
                </li>
              ) : (
                filtered.map((party) => (
                  <li key={party.id} className="border-b border-slate-50 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(party.id, false);
                        onClose();
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-blue-50/50"
                    >
                      <span className="font-medium text-brand-primary">{party.name}</span>
                      <span className="tabular-nums text-brand-primary-muted">
                        {formatInr(party.balance)}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            className="w-full rounded-md border border-dashed border-brand-primary/25 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/[0.03]"
          >
            + {t("dashboard.salesInvoices.create.createParty")}
          </button>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

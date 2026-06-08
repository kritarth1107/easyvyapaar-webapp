"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WALK_IN_PARTY_ID } from "@/lib/parties/constants";
import { PARTY_CATEGORIES } from "@/lib/parties/party-categories";
import { createParty, fetchParties } from "@/lib/parties/parties-api-client";
import { formatInr } from "@/lib/sales/create-invoice-form";
import type { PartySummary } from "@/lib/types/parties-api";
import { useTranslation } from "@/lib/localization";

export type SelectedInvoiceParty = {
  partyId: string;
  name: string;
  phone?: string;
  balance: number;
  isCashSale?: boolean;
  billingAddress?: string;
  shippingAddress?: string;
  gstin?: string;
  pan?: string;
};

export function mapPartySummaryToSelected(party: PartySummary): SelectedInvoiceParty {
  return {
    partyId: party.partyId,
    name: party.name,
    phone: party.phone,
    balance: party.balance,
    ...(party.billingAddress?.trim() ? { billingAddress: party.billingAddress.trim() } : {}),
    ...(party.gstin?.trim() ? { gstin: party.gstin.trim() } : {}),
    ...(party.pan?.trim() ? { pan: party.pan.trim().toUpperCase() } : {}),
  };
}

type PartySelectModalProps = {
  open: boolean;
  organisationId: string | null;
  onClose: () => void;
  onSelect: (party: SelectedInvoiceParty) => void;
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

const DEFAULT_CUSTOMER_CATEGORY = PARTY_CATEGORIES[0];

export function PartySelectModal({
  open,
  organisationId,
  onClose,
  onSelect,
}: PartySelectModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setShowCreateForm(false);
      setCreateName("");
      setCreatePhone("");
      setCreateAddress("");
      setCreateError(null);
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

  useEffect(() => {
    const orgId = organisationId?.trim();
    if (!open || !orgId) {
      setParties([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);

      fetchParties(orgId, {
        view: "customers",
        status: "active",
        limit: 100,
        page: 1,
        ...(query.trim() ? { search: query.trim() } : {}),
      })
        .then((data) => {
          if (!cancelled) setParties(data.items);
        })
        .catch((err) => {
          if (!cancelled) {
            setParties([]);
            setLoadError(
              err instanceof Error ? err.message : t("dashboard.salesInvoices.create.noPartiesFound"),
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, organisationId, query, t]);

  const handleCreateParty = async () => {
    const orgId = organisationId?.trim();
    const name = createName.trim();
    if (!orgId) return;
    if (!name) {
      setCreateError(t("dashboard.createParty.partyNamePlaceholder"));
      return;
    }

    setCreateSaving(true);
    setCreateError(null);
    try {
      const party = await createParty({
        organisationId: orgId,
        partyType: "customer",
        partyCategory: DEFAULT_CUSTOMER_CATEGORY,
        name,
        ...(createPhone.trim() ? { phone: createPhone.trim() } : {}),
        ...(createAddress.trim() ? { billingAddress: createAddress.trim() } : {}),
      });
      onSelect({
        partyId: party.partyId,
        name: party.name,
        phone: party.phone,
        balance: party.currentBalance,
        ...(createAddress.trim() ? { billingAddress: createAddress.trim() } : {}),
        ...(createPhone.trim() ? { phone: createPhone.trim() } : {}),
      });
      onClose();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : t("dashboard.createParty.saveError"),
      );
    } finally {
      setCreateSaving(false);
    }
  };

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
        className="flex max-h-[min(560px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="party-select-title" className="text-lg font-bold text-brand-primary">
            {showCreateForm
              ? t("dashboard.salesInvoices.create.quickCreatePartyTitle")
              : t("dashboard.salesInvoices.create.selectPartyTitle")}
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

        {showCreateForm ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 scrollbar-brand">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-brand-primary-muted">
                {t("dashboard.createParty.partyName")}
              </span>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t("dashboard.createParty.partyNamePlaceholder")}
                className="h-10 rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-brand-primary-muted">
                {t("dashboard.createParty.mobile")}
              </span>
              <input
                type="tel"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                placeholder={t("dashboard.createParty.mobile")}
                className="h-10 rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-brand-primary-muted">
                {t("dashboard.createParty.billingAddress")}
              </span>
              <textarea
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                placeholder={t("dashboard.createParty.billingPlaceholder")}
                rows={3}
                className="resize-none rounded-md border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
              />
            </label>
            {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
          </div>
        ) : (
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
                onSelect({
                  partyId: WALK_IN_PARTY_ID,
                  name: t("dashboard.salesInvoices.create.cashWalkIn"),
                  balance: 0,
                  isCashSale: true,
                });
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
                  {formatInr(0)}
                </span>
              </span>
            </button>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200/90">
              <div className="grid shrink-0 grid-cols-2 border-b border-slate-100 bg-brand-surface/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <span>{t("dashboard.salesInvoices.create.partyName")}</span>
                <span className="text-right">{t("dashboard.salesInvoices.create.balance")}</span>
              </div>

              <ul className="min-h-0 flex-1 overflow-y-auto scrollbar-brand">
                {loading ? (
                  <li className="px-4 py-8 text-center text-sm text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </li>
                ) : loadError ? (
                  <li className="px-4 py-8 text-center text-sm text-red-600">{loadError}</li>
                ) : parties.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.salesInvoices.create.noPartiesFound")}
                  </li>
                ) : (
                  parties.map((party) => (
                    <li key={party.partyId} className="border-b border-slate-50 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(mapPartySummaryToSelected(party));
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
        )}

        <div className="shrink-0 border-t border-slate-100 p-3">
          {showCreateForm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                disabled={createSaving}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-slate-200/90 bg-white text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleCreateParty()}
                disabled={createSaving || !createName.trim()}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {createSaving ? t("dashboard.createParty.saving") : t("dashboard.createParty.save")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex w-full items-center justify-center rounded-md border border-dashed border-brand-primary/25 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/[0.03]"
            >
              + {t("dashboard.salesInvoices.create.createParty")}
            </button>
          )}
        </div>

        {!showCreateForm ? (
          <div className="flex shrink-0 justify-end border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

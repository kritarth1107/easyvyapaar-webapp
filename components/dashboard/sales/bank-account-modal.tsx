"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { maskBankAccountNumber } from "@/lib/parties/party-detail-utils";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import { useTranslation } from "@/lib/localization";

type BankAccountModalProps = {
  open: boolean;
  onClose: () => void;
  organisationId: string | null;
  accounts: OrganisationBankAccount[];
  loading?: boolean;
  onRefresh?: () => void | Promise<void>;
  selectedId: string | null;
  onSave: (id: string) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function defaultSelectedId(
  accounts: OrganisationBankAccount[],
  selectedId: string | null,
): string {
  if (selectedId && accounts.some((row) => row.bankAccountId === selectedId)) {
    return selectedId;
  }
  const primary = accounts.find((row) => row.isPrimary);
  return primary?.bankAccountId ?? accounts[0]?.bankAccountId ?? "";
}

export function BankAccountModal({
  open,
  onClose,
  organisationId,
  accounts,
  loading = false,
  onRefresh,
  selectedId,
  onSave,
}: BankAccountModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    void onRefresh?.();
    setDraft(defaultSelectedId(accounts, selectedId));
  }, [open, onRefresh]);

  useEffect(() => {
    if (!open) return;
    setDraft(defaultSelectedId(accounts, selectedId));
  }, [open, accounts, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const canSave = useMemo(
    () => Boolean(draft && accounts.some((row) => row.bankAccountId === draft)),
    [accounts, draft],
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-account-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-sm border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="bank-account-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.salesInvoices.create.selectBankAccount")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        {!organisationId ? (
          <p className="px-5 py-8 text-center text-sm text-brand-primary-muted">
            {t("dashboard.salesInvoices.create.noOrganisation")}
          </p>
        ) : loading ? (
          <p className="px-5 py-8 text-center text-sm text-brand-primary-muted">
            {t("common.pleaseWait")}
          </p>
        ) : accounts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-brand-primary-muted">
              {t("dashboard.businessBankAccounts.subtitle")}
            </p>
            <Link
              href="/dashboard/settings/business-bank-accounts"
              onClick={onClose}
              className="mt-3 inline-block text-sm font-semibold text-brand-orange-2 hover:underline"
            >
              + {t("dashboard.createParty.addBankAccount")}
            </Link>
          </div>
        ) : (
          <ul className="max-h-[min(50vh,320px)] divide-y divide-slate-100 overflow-y-auto px-2 py-2 scrollbar-brand">
            {accounts.map((acc) => (
              <li key={acc.bankAccountId}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="bank-account"
                    checked={draft === acc.bankAccountId}
                    onChange={() => setDraft(acc.bankAccountId)}
                    className="h-4 w-4 accent-brand-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-primary">
                        {acc.bankName || acc.accountHolderName || "—"}
                      </p>
                      {acc.isPrimary ? (
                        <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          {t("dashboard.createParty.primary")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-brand-primary-mid">
                      {t("dashboard.salesInvoices.create.acc")}:{" "}
                      {maskBankAccountNumber(acc.accountNumber)}
                      {acc.ifscCode ? ` • IFSC: ${acc.ifscCode}` : ""}
                    </p>
                    {acc.bankName && acc.accountHolderName ? (
                      <p className="mt-0.5 text-xs text-brand-primary-muted">
                        {acc.accountHolderName}
                      </p>
                    ) : null}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              onSave(draft);
              onClose();
            }}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MOCK_BANK_ACCOUNTS } from "@/lib/dashboard/mock-bank-accounts";
import { useTranslation } from "@/lib/localization";

type BankAccountModalProps = {
  open: boolean;
  onClose: () => void;
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

export function BankAccountModal({ open, onClose, selectedId, onSave }: BankAccountModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(selectedId ?? MOCK_BANK_ACCOUNTS[0]?.id ?? "");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setDraft(selectedId ?? MOCK_BANK_ACCOUNTS[0]?.id ?? "");
  }, [open, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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
        className="w-full max-w-md rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="bank-account-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.salesInvoices.create.selectBankAccount")}
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

        <ul className="divide-y divide-slate-100 px-2 py-2">
          {MOCK_BANK_ACCOUNTS.map((acc) => (
            <li key={acc.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 hover:bg-slate-50">
                <input
                  type="radio"
                  name="bank-account"
                  checked={draft === acc.id}
                  onChange={() => setDraft(acc.id)}
                  className="h-4 w-4 accent-brand-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-primary">{acc.label}</p>
                  <p className="text-xs text-brand-primary-muted">
                    {t("dashboard.salesInvoices.create.acc")}: {acc.accountNo}
                    {acc.ifsc ? ` • IFSC: ${acc.ifsc}` : ""}
                  </p>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

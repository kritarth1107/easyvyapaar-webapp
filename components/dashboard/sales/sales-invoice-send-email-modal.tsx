"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";

type SalesInvoiceSendEmailModalProps = {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
  invoiceNumber: string;
  partyName: string;
  onSend: (email: string) => Promise<void>;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 6h16v12H4V6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SalesInvoiceSendEmailModal({
  open,
  onClose,
  defaultEmail,
  invoiceNumber,
  partyName,
  onSend,
}: SalesInvoiceSendEmailModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState(defaultEmail?.trim() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail?.trim() ?? "");
      setError(null);
      setSending(false);
    }
  }, [open, defaultEmail]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, sending]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t("dashboard.salesInvoices.view.sendEmailInvalid"));
      return;
    }

    setSending(true);
    setError(null);
    try {
      await onSend(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.salesInvoices.view.sendEmailError"));
    } finally {
      setSending(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-send-email-title"
      onClick={() => {
        if (!sending) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-sm border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 id="invoice-send-email-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.salesInvoices.view.sendEmailTitle")}
            </h3>
            <p className="mt-0.5 text-sm text-brand-primary-muted">
              {t("dashboard.salesInvoices.view.sendEmailSubtitle")
                .replace("{number}", invoiceNumber)
                .replace("{party}", partyName)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex h-9 w-9 items-center justify-center rounded-md text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary disabled:opacity-40"
            aria-label={t("common.cancel")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="invoice-send-email-input"
              className="mb-1.5 block text-xs font-medium text-brand-primary-muted"
            >
              {t("dashboard.salesInvoices.view.sendEmailLabel")}
            </label>
            <input
              id="invoice-send-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("dashboard.salesInvoices.view.sendEmailPlaceholder")}
              disabled={sending}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-brand-primary-muted">
              {t("dashboard.salesInvoices.view.sendEmailHint")}
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="h-10 flex-1 rounded-sm border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-40"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={sending}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <EmailIcon />
            {sending
              ? t("dashboard.salesInvoices.view.sendEmailSending")
              : t("dashboard.salesInvoices.view.sendEmailAction")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

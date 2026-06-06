"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { QuotationShareInput } from "@/lib/sales/share-quotation";
import { shareQuotationEmail, shareQuotationWhatsApp } from "@/lib/sales/share-quotation";
import { useTranslation } from "@/lib/localization";

type QuotationSendModalProps = {
  open: boolean;
  onClose: () => void;
  shareInput: QuotationShareInput;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
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

export function QuotationSendModal({ open, onClose, shareInput }: QuotationSendModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleWhatsApp = () => {
    setError(null);
    const result = shareQuotationWhatsApp(shareInput);
    if (!result.ok) {
      setError(t("dashboard.quotations.view.sendNoPhone"));
      return;
    }
    onClose();
  };

  const handleEmail = () => {
    setError(null);
    const result = shareQuotationEmail(shareInput);
    if (!result.ok) {
      setError(t("dashboard.quotations.view.sendNoEmail"));
      return;
    }
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quotation-send-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 id="quotation-send-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.quotations.view.sendTitle")}
            </h3>
            <p className="mt-0.5 text-sm text-brand-primary-muted">
              {t("dashboard.quotations.view.sendSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.cancel")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-4 rounded-md border border-slate-200/90 px-4 py-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <WhatsAppIcon />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-primary">
                {t("dashboard.quotations.view.sendWhatsApp")}
              </span>
              <span className="mt-0.5 block text-xs text-brand-primary-muted">
                {t("dashboard.quotations.view.sendWhatsAppHint")}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            className="flex w-full items-center gap-4 rounded-md border border-slate-200/90 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/60"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <EmailIcon />
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-primary">
                {t("dashboard.quotations.view.sendEmail")}
              </span>
              <span className="mt-0.5 block text-xs text-brand-primary-muted">
                {t("dashboard.quotations.view.sendEmailHint")}
              </span>
            </span>
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-md border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

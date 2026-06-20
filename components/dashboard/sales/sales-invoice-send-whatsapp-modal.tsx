"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/localization";
import { normalizeIndianMobilePhone } from "@/lib/sales/share-payment-reminder";

type SalesInvoiceSendWhatsAppModalProps = {
  open: boolean;
  onClose: () => void;
  defaultPhone?: string | null;
  invoiceNumber: string;
  partyName: string;
  onSend: (phone: string) => Promise<void>;
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
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function SalesInvoiceSendWhatsAppModal({
  open,
  onClose,
  defaultPhone,
  invoiceNumber,
  partyName,
  onSend,
}: SalesInvoiceSendWhatsAppModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState(normalizeIndianMobilePhone(defaultPhone));
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setPhone(normalizeIndianMobilePhone(defaultPhone));
      setError(null);
      setSending(false);
    }
  }, [open, defaultPhone]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, sending]);

  const handleSubmit = async () => {
    const normalized = normalizeIndianMobilePhone(phone);
    if (!normalized) {
      setError(t("dashboard.salesInvoices.view.sendWhatsAppInvalid"));
      return;
    }

    setSending(true);
    setError(null);
    try {
      await onSend(normalized);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("dashboard.salesInvoices.view.sendWhatsAppError"),
      );
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
      aria-labelledby="invoice-send-whatsapp-title"
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
            <h3 id="invoice-send-whatsapp-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.salesInvoices.view.sendWhatsAppTitle")}
            </h3>
            <p className="mt-0.5 text-sm text-brand-primary-muted">
              {t("dashboard.salesInvoices.view.sendWhatsAppSubtitle")
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
              htmlFor="invoice-send-whatsapp-input"
              className="mb-1.5 block text-xs font-medium text-brand-primary-muted"
            >
              {t("dashboard.salesInvoices.view.sendWhatsAppLabel")}
            </label>
            <input
              id="invoice-send-whatsapp-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder={t("dashboard.salesInvoices.view.sendWhatsAppPlaceholder")}
              disabled={sending}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-brand-primary-muted">
              {t("dashboard.salesInvoices.view.sendWhatsAppHint")}
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
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <WhatsAppIcon />
            {sending
              ? t("dashboard.salesInvoices.view.sendWhatsAppSending")
              : t("dashboard.salesInvoices.view.sendWhatsAppAction")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

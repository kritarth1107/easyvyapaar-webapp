"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { InvoiceSettingsPreview } from "@/components/dashboard/sales/invoice-settings-preview";
import type { LiveInvoicePreviewModel } from "@/lib/sales/build-live-invoice-preview";
import { mapQuotationPreviewToDocument } from "@/lib/sales/build-live-quotation-preview";
import { mapLivePreviewToDocument } from "@/lib/sales/invoice-preview-document";
import {
  getAccentHex,
  INVOICE_THEME_CARDS,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import { useTranslation } from "@/lib/localization";

type SalesInvoicePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  model: LiveInvoicePreviewModel | null;
  storedSettings: StoredSalesInvoiceSettings;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  printAreaRef?: RefObject<HTMLDivElement | null>;
  quotation?: boolean;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SalesInvoicePreviewModal({
  open,
  onClose,
  model,
  storedSettings,
  title,
  subtitle,
  footer,
  printAreaRef,
  quotation = false,
}: SalesInvoicePreviewModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  const previewProps = useMemo(() => {
    if (!model) return null;
    const themeLabel =
      INVOICE_THEME_CARDS.find((theme) => theme.id === storedSettings.themeId)?.label ??
      storedSettings.themeId;
    return {
      themeId: storedSettings.themeId,
      themeLabel,
      businessName: model.businessName,
      accentHex: getAccentHex(storedSettings.accentColor),
      showPartyBalance: storedSettings.showPartyBalance,
      showPhoneOnInvoice: storedSettings.showPhoneOnInvoice,
      showItemDescription: storedSettings.showItemDescription,
      showTimeOnInvoice: storedSettings.showTimeOnInvoice,
      enableReceiverSignature: storedSettings.enableReceiverSignature,
      signatureImageUrl: storedSettings.signatureDataUrl,
      document: quotation ? mapQuotationPreviewToDocument(model) : mapLivePreviewToDocument(model),
    };
  }, [model, quotation, storedSettings]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted || !model || !previewProps) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(94vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-md border border-slate-200/90 bg-brand-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/90 bg-white px-4 py-3">
          <div className="min-w-0 pr-3">
            <h2 className="text-lg font-bold text-brand-primary">
              {title ?? t("dashboard.salesInvoices.create.previewInvoice")}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-brand-primary-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>
        <div
          ref={printAreaRef}
          data-invoice-print-source
          className="min-h-0 flex-1 overflow-y-auto bg-white p-4 scrollbar-brand"
        >
          <InvoiceSettingsPreview {...previewProps} />
        </div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/90 bg-white px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

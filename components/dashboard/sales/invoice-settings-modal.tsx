"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import {
  INVOICE_THEMES,
  type InvoiceSettings,
} from "@/lib/sales/create-invoice-form";
import { useTranslation } from "@/lib/localization";

const settingsInputClass =
  "mt-1 h-9 w-full rounded-sm border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

type InvoiceSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  settings: InvoiceSettings;
  invoicePrefix: string;
  invoiceNumber: string;
  onSave: (
    settings: InvoiceSettings,
    invoiceMeta?: { invoicePrefix: string; invoiceNumber: string },
  ) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  badge,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-brand-primary">{label}</span>
        {badge && (
          <span className="rounded-sm bg-brand-orange-1/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange-2">
            {badge}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export function InvoiceSettingsModal({
  open,
  onClose,
  settings,
  invoicePrefix,
  invoiceNumber,
  onSave,
}: InvoiceSettingsModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [prefix, setPrefix] = useState(invoicePrefix);
  const [sequence, setSequence] = useState(invoiceNumber);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setPrefix(invoicePrefix);
      setSequence(invoiceNumber);
    }
  }, [open, settings, invoicePrefix, invoiceNumber]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const save = () => {
    onSave(draft, { invoicePrefix: prefix, invoiceNumber: sequence });
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-settings-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-sm border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="invoice-settings-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.salesInvoices.create.settingsTitle")}
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

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 scrollbar-brand">
          <Toggle
            checked={draft.showPrefixSequence}
            onChange={(v) => setDraft((d) => ({ ...d, showPrefixSequence: v }))}
            label={t("dashboard.salesInvoices.create.settingPrefix")}
          />
          {draft.showPrefixSequence && (
            <div className="mb-3 grid grid-cols-2 gap-3 rounded-md border border-slate-200/90 bg-brand-surface/80 p-3">
              <div>
                <label className="text-xs font-medium text-brand-primary-mid">
                  {t("dashboard.salesInvoices.create.prefix")}
                </label>
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={settingsInputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-primary-mid">
                  {t("dashboard.salesInvoices.create.sequenceNumber")}
                </label>
                <input
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className={settingsInputClass}
                />
              </div>
              <p className="col-span-2 text-xs text-brand-primary-muted">
                {t("dashboard.salesInvoices.create.invoiceNumberPreview")}:{" "}
                <span className="font-semibold text-brand-primary">
                  {prefix}
                  {sequence}
                </span>
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            <Toggle
              checked={draft.showPurchasePrice}
              onChange={(v) => setDraft((d) => ({ ...d, showPurchasePrice: v }))}
              label={t("dashboard.salesInvoices.create.settingPurchasePrice")}
            />
            <Toggle
              checked={draft.showItemImage}
              onChange={(v) => setDraft((d) => ({ ...d, showItemImage: v }))}
              label={t("dashboard.salesInvoices.create.settingItemImage")}
            />
            <Toggle
              checked={draft.priceHistory}
              onChange={(v) => setDraft((d) => ({ ...d, priceHistory: v }))}
              label={t("dashboard.salesInvoices.create.settingPriceHistory")}
              badge={t("dashboard.salesInvoices.create.newBadge")}
            />
          </div>

          <div className="py-4">
            <label className="text-sm font-medium text-brand-primary">
              {t("dashboard.salesInvoices.create.chooseTheme")}
            </label>
            <div className="mt-1.5">
              <ModernSelect
                value={draft.theme}
                onChange={(v) => setDraft((d) => ({ ...d, theme: v }))}
                options={INVOICE_THEMES}
              />
            </div>
          </div>

          <div className="mb-4 rounded-md border border-brand-primary/12 bg-brand-primary/[0.04] p-3">
            <p className="text-sm font-medium text-brand-primary-mid">
              {t("dashboard.salesInvoices.create.customiseHint")}
            </p>
            <Link
              href="/dashboard/sales/invoices/settings"
              onClick={onClose}
              className="mt-2 inline-block text-sm font-semibold text-brand-primary hover:text-brand-primary-light"
            >
              {t("dashboard.salesInvoices.create.fullSettings")} →
            </Link>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-sm border border-brand-primary/20 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-brand-surface/80"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
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

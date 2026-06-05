"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InvoiceSettingsPreview } from "@/components/dashboard/sales/invoice-settings-preview";
import { ModernSelect } from "@/components/ui/modern-select";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  DEFAULT_FULL_INVOICE_SETTINGS,
  getAccentHex,
  getHeaderTextColor,
  INDUSTRY_TYPES,
  INVOICE_THEME_CARDS,
  PAYMENT_QR_OPTIONS,
  TERMS_PRESETS,
  THEME_COLOR_SWATCHES,
  type FullInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={`h-4 w-4 text-brand-primary-muted transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm accent-brand-primary"
      />
      <span className="flex items-center gap-1.5 text-sm text-brand-primary-mid">
        {label}
        {hint && (
          <span
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-brand-primary-muted"
            title="More info"
          >
            i
          </span>
        )}
      </span>
    </label>
  );
}

function SettingsAccordion({
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200/90 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-primary">
          {title}
          {badge && (
            <span className="rounded-sm bg-brand-orange-1/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange-2">
              {badge}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function InvoiceSettingsPage() {
  const { t } = useTranslation();
  const { activeOrganisation } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";

  const [settings, setSettings] = useState<FullInvoiceSettings>(DEFAULT_FULL_INVOICE_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_FULL_INVOICE_SETTINGS);
  const [openSections, setOpenSections] = useState({
    invoiceDetails: true,
    partyDetails: false,
    itemColumns: false,
    miscellaneous: false,
  });

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(saved),
    [settings, saved]
  );

  const patch = (partial: Partial<FullInvoiceSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const accentHex = getAccentHex(settings.accentColor);
  const themeLabel =
    INVOICE_THEME_CARDS.find((th) => th.id === settings.themeId)?.label ?? "GST Advance A4";

  const save = () => setSaved({ ...settings });

  return (
    <div className="flex min-h-full flex-col bg-brand-surface">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/sales/invoices"
            className="text-sm font-medium text-brand-primary-muted hover:text-brand-primary"
          >
            ← {t("dashboard.invoiceSettings.backToInvoices")}
          </Link>
          <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
            {t("dashboard.invoiceSettings.title")}
          </h1>
        </div>
        <button
          type="button"
          disabled={!dirty}
          onClick={save}
          className="inline-flex h-10 shrink-0 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("dashboard.invoiceSettings.saveChanges")}
        </button>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-brand lg:p-6">
          <InvoiceSettingsPreview
            themeId={settings.themeId}
            businessName={businessName}
            accentHex={accentHex}
            themeLabel={themeLabel}
            showPartyBalance={settings.showPartyBalance}
            showPhoneOnInvoice={settings.showPhoneOnInvoice}
            showItemDescription={settings.showItemDescription}
          />
        </div>

        {/* Settings panel */}
        <div className="w-full shrink-0 border-t border-slate-200/90 bg-white lg:w-[400px] lg:border-l lg:border-t-0">
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4 scrollbar-brand lg:px-5">
            {/* Theme mode */}
            <div className="space-y-4 border-b border-slate-200/90 pb-4">
              <div className="flex flex-col gap-2.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="settings-mode"
                    checked={settings.mode === "themes"}
                    onChange={() => patch({ mode: "themes" })}
                    className="accent-brand-primary"
                  />
                  <span className="text-sm font-semibold text-brand-primary">
                    {t("dashboard.invoiceSettings.themes")}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="settings-mode"
                    checked={settings.mode === "custom"}
                    onChange={() => patch({ mode: "custom" })}
                    className="accent-brand-primary"
                  />
                  <span className="text-sm font-semibold text-brand-primary">
                    {t("dashboard.invoiceSettings.createCustomTheme")}
                  </span>
                </label>
              </div>

              <p className="text-xs leading-relaxed text-brand-primary-muted">
                {settings.mode === "themes"
                  ? t("dashboard.invoiceSettings.selectPrebuiltTheme")
                  : t("dashboard.invoiceSettings.customThemeHint")}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {INVOICE_THEME_CARDS.map((theme) => {
                  const selected = settings.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => patch({ themeId: theme.id })}
                      className={`overflow-hidden rounded-md border text-left transition-all ${
                        selected
                          ? "border-brand-primary ring-2 ring-brand-primary/20"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex h-8 flex-col justify-center gap-1 bg-slate-50 px-2">
                        <div className="h-1.5 w-full rounded-sm bg-slate-200" />
                        <div className="h-2 w-3/4 rounded-sm bg-slate-100" />
                      </div>
                      <p className="px-1.5 py-1.5 text-[10px] font-semibold text-brand-primary">
                        {theme.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color — custom mode customization */}
            <div className="border-b border-slate-200/90 py-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-primary">
                {t("dashboard.invoiceSettings.selectColor")}
                {settings.mode === "custom" && (
                  <span className="rounded-sm bg-brand-orange-1/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange-2">
                    {t("dashboard.invoiceSettings.customBadge")}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {THEME_COLOR_SWATCHES.map((color) => {
                  const selected = settings.accentColor === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      title={color.label}
                      onClick={() => patch({ accentColor: color.id })}
                      className={`relative h-9 w-9 rounded-md border-2 transition-transform hover:scale-105 ${
                        selected ? "border-brand-orange-2" : "border-slate-200/80"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selected && (
                        <span
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: getHeaderTextColor(color.hex) }}
                        >
                          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
                            <path
                              d="M4 8l3 3 5-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme settings checkboxes */}
            <div className="border-b border-slate-200/90 py-4">
              <p className="mb-2 text-sm font-semibold text-brand-primary">
                {t("dashboard.invoiceSettings.themeSettings")}
              </p>
              <CheckRow
                checked={settings.showPartyBalance}
                onChange={(v) => patch({ showPartyBalance: v })}
                label={t("dashboard.invoiceSettings.showPartyBalance")}
              />
              <CheckRow
                checked={settings.enableFreeQty}
                onChange={(v) => patch({ enableFreeQty: v })}
                label={t("dashboard.invoiceSettings.enableFreeQty")}
              />
              <CheckRow
                checked={settings.showItemDescription}
                onChange={(v) => patch({ showItemDescription: v })}
                label={t("dashboard.invoiceSettings.showItemDescription")}
              />
              <CheckRow
                checked={settings.showAlternateUnit}
                onChange={(v) => patch({ showAlternateUnit: v })}
                label={t("dashboard.invoiceSettings.showAlternateUnit")}
              />
              <CheckRow
                checked={settings.showPhoneOnInvoice}
                onChange={(v) => patch({ showPhoneOnInvoice: v })}
                label={t("dashboard.invoiceSettings.showPhone")}
              />
              <CheckRow
                checked={settings.showTimeOnInvoice}
                onChange={(v) => patch({ showTimeOnInvoice: v })}
                label={t("dashboard.invoiceSettings.showTime")}
                hint
              />
              <CheckRow
                checked={settings.priceHistory}
                onChange={(v) => patch({ priceHistory: v })}
                label={t("dashboard.invoiceSettings.priceHistory")}
                hint
              />
              <CheckRow
                checked={settings.autoApplyLuxuryShare}
                onChange={(v) => patch({ autoApplyLuxuryShare: v })}
                label={t("dashboard.invoiceSettings.autoLuxuryShare")}
              />
            </div>

            {/* Accordions */}
            <SettingsAccordion
              title={t("dashboard.invoiceSettings.invoiceDetails")}
              open={openSections.invoiceDetails}
              onToggle={() => toggleSection("invoiceDetails")}
            >
              <label className="mb-3 block text-xs font-medium text-brand-primary-muted">
                {t("dashboard.invoiceSettings.industryType")}
              </label>
              <ModernSelect
                value={settings.industryType}
                onChange={(v) => patch({ industryType: v })}
                options={INDUSTRY_TYPES.map((o) => ({ value: o.value, label: o.label }))}
              />
              <div className="mt-3 space-y-0">
                <CheckRow
                  checked={settings.showPoNumber}
                  onChange={(v) => patch({ showPoNumber: v })}
                  label={t("dashboard.invoiceSettings.poNumber")}
                />
                <CheckRow
                  checked={settings.showEwayBill}
                  onChange={(v) => patch({ showEwayBill: v })}
                  label={t("dashboard.invoiceSettings.ewayBill")}
                />
                <CheckRow
                  checked={settings.showVehicleNumber}
                  onChange={(v) => patch({ showVehicleNumber: v })}
                  label={t("dashboard.invoiceSettings.vehicleNumber")}
                />
              </div>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.invoiceSettings.addCustomField")}
              </button>
            </SettingsAccordion>

            <SettingsAccordion
              title={t("dashboard.invoiceSettings.partyDetails")}
              open={openSections.partyDetails}
              onToggle={() => toggleSection("partyDetails")}
            >
              <div className="flex gap-2">
                <input
                  value={settings.partyCustomField}
                  onChange={(e) => patch({ partyCustomField: e.target.value })}
                  placeholder={t("dashboard.invoiceSettings.customField")}
                  className={inputClass}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-brand-primary/20 bg-brand-primary/[0.06] px-3 text-sm font-semibold text-brand-primary hover:bg-brand-primary/10"
                >
                  {t("dashboard.invoiceSettings.add")}
                </button>
              </div>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.invoiceSettings.addCustomField")}
              </button>
            </SettingsAccordion>

            <SettingsAccordion
              title={t("dashboard.invoiceSettings.itemTableColumns")}
              open={openSections.itemColumns}
              onToggle={() => toggleSection("itemColumns")}
            >
              <CheckRow
                checked={settings.itemColumns.price}
                onChange={(v) =>
                  patch({ itemColumns: { ...settings.itemColumns, price: v } })
                }
                label={t("dashboard.invoiceSettings.colPrice")}
              />
              <CheckRow
                checked={settings.itemColumns.quantity}
                onChange={(v) =>
                  patch({ itemColumns: { ...settings.itemColumns, quantity: v } })
                }
                label={t("dashboard.invoiceSettings.colQuantity")}
              />
              <CheckRow
                checked={settings.itemColumns.batchNo}
                onChange={(v) =>
                  patch({ itemColumns: { ...settings.itemColumns, batchNo: v } })
                }
                label={t("dashboard.invoiceSettings.colBatch")}
              />
              <CheckRow
                checked={settings.itemColumns.expDate}
                onChange={(v) =>
                  patch({ itemColumns: { ...settings.itemColumns, expDate: v } })
                }
                label={t("dashboard.invoiceSettings.colExpDate")}
              />
              <CheckRow
                checked={settings.itemColumns.mfgDate}
                onChange={(v) =>
                  patch({ itemColumns: { ...settings.itemColumns, mfgDate: v } })
                }
                label={t("dashboard.invoiceSettings.colMfgDate")}
              />
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.invoiceSettings.addCustomColumn")}
              </button>
            </SettingsAccordion>

            <SettingsAccordion
              title={t("dashboard.invoiceSettings.miscellaneous")}
              badge={t("dashboard.salesInvoices.create.newBadge")}
              open={openSections.miscellaneous}
              onToggle={() => toggleSection("miscellaneous")}
            >
              <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
                {t("dashboard.invoiceSettings.paymentQr")}
              </label>
              <ModernSelect
                value={settings.paymentQr}
                onChange={(v) => patch({ paymentQr: v })}
                options={PAYMENT_QR_OPTIONS}
                placeholder={t("dashboard.invoiceSettings.selectPaymentQr")}
              />

              <label className="mb-1 mt-4 block text-xs font-medium text-brand-primary-muted">
                {t("dashboard.invoiceSettings.termsAndConditions")}
              </label>
              <ModernSelect
                value={settings.termsPreset}
                onChange={(v) => patch({ termsPreset: v })}
                options={TERMS_PRESETS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <textarea
                value={settings.termsText}
                onChange={(e) => patch({ termsText: e.target.value })}
                placeholder={t("dashboard.invoiceSettings.termsPlaceholder")}
                rows={3}
                className="mt-2 w-full rounded-md border border-slate-200/90 px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
              />
              <button
                type="button"
                className="mt-2 rounded-md border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-brand-primary-muted"
              >
                {t("common.save")}
              </button>

              <label className="mb-1 mt-4 block text-xs font-medium text-brand-primary-muted">
                {t("dashboard.invoiceSettings.signature")}
              </label>
              <ModernSelect
                value={settings.signatureSource}
                onChange={(v) => patch({ signatureSource: v })}
                options={[
                  { value: "desktop", label: t("dashboard.invoiceSettings.uploadDesktop") },
                  { value: "draw", label: t("dashboard.invoiceSettings.drawSignature") },
                ]}
              />
              <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200/90 bg-slate-50/60 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-xs text-brand-primary-muted">
                  ✒
                </span>
                <span className="flex-1 text-sm text-brand-primary">{t("dashboard.invoiceSettings.signature")}</span>
                <button type="button" className="text-brand-primary-muted hover:text-red-600">
                  ×
                </button>
              </div>
              <p className="mt-1 text-[11px] text-brand-primary-muted">
                {t("dashboard.invoiceSettings.signatureHint")}
              </p>
              <CheckRow
                checked={settings.enableReceiverSignature}
                onChange={(v) => patch({ enableReceiverSignature: v })}
                label={t("dashboard.invoiceSettings.receiverSignature")}
              />
            </SettingsAccordion>
          </div>
        </div>
      </div>
    </div>
  );
}

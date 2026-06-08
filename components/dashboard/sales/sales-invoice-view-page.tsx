"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InvoiceSettingsPreview } from "@/components/dashboard/sales/invoice-settings-preview";
import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import { useUserMe } from "@/components/providers/user-me-provider";
import { fetchBusinessProfile } from "@/lib/business/business-profile-api-client";
import { fetchPartyDetail } from "@/lib/parties/parties-api-client";
import { buildLiveInvoicePreviewFromDetail } from "@/lib/sales/build-live-invoice-preview";
import { formatInr, PAYMENT_MODES } from "@/lib/sales/create-invoice-form";
import { mapLivePreviewToDocument } from "@/lib/sales/invoice-preview-document";
import {
  formatGstinOrPanLine,
  organisationProfileToSnapshot,
  type InvoiceOrganisationSnapshot,
} from "@/lib/sales/invoice-preview-formatters";
import {
  DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  getAccentHex,
  INVOICE_THEME_CARDS,
  normalizeThemeId,
  resolveInvoicePageSizeFromTheme,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import { printInvoiceElement, triggerInvoiceSavePdf } from "@/lib/sales/print-invoice";
import { sharePaymentReminderWhatsApp } from "@/lib/sales/share-payment-reminder";
import { fetchSalesInvoiceDetail, recordSalesInvoicePayment } from "@/lib/sales/sales-api-client";
import { fetchSalesInvoiceSettings } from "@/lib/sales/sales-invoice-settings-api-client";
import type { SalesInvoiceDetail, SalesInvoiceStatus } from "@/lib/types/sales-api";
import type { PartyDetail } from "@/lib/types/parties-api";
import { useTranslation } from "@/lib/localization";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: SalesInvoiceStatus }) {
  const { t } = useTranslation();
  const styles: Record<SalesInvoiceStatus, string> = {
    paid: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    partial: "bg-amber-50 text-amber-900 ring-amber-600/15",
    unpaid: "bg-red-50 text-red-800 ring-red-600/15",
    partial_return: "bg-violet-50 text-violet-800 ring-violet-600/15",
    returned: "bg-slate-200/80 text-slate-800 ring-slate-500/20",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-400/20",
  };
  const labels: Record<SalesInvoiceStatus, string> = {
    paid: t("dashboard.salesInvoices.statusPaid"),
    partial: t("dashboard.salesInvoices.statusPartial"),
    unpaid: t("dashboard.salesInvoices.statusUnpaid"),
    partial_return: t("dashboard.salesInvoices.statusPartialReturn"),
    returned: t("dashboard.salesInvoices.statusReturned"),
    cancelled: t("dashboard.salesInvoices.statusCancelled"),
  };

  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function partyDetailToSelected(party: PartyDetail): SelectedInvoiceParty {
  return {
    partyId: party.partyId,
    name: party.name,
    phone: party.phone,
    balance: party.currentBalance,
    ...(party.billingAddress?.trim() ? { billingAddress: party.billingAddress.trim() } : {}),
    ...(party.shippingAddress?.trim() ? { shippingAddress: party.shippingAddress.trim() } : {}),
    ...(party.gstin?.trim() ? { gstin: party.gstin.trim() } : {}),
    ...(party.pan?.trim() ? { pan: party.pan.trim().toUpperCase() } : {}),
  };
}

export function SalesInvoiceViewPage({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation();
  const { activeOrganisation, activeOrganisationId } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [party, setParty] = useState<SelectedInvoiceParty | null>(null);
  const [storedSettings, setStoredSettings] = useState<StoredSalesInvoiceSettings>(
    DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  );
  const [organisationSnapshot, setOrganisationSnapshot] = useState<InvoiceOrganisationSnapshot>({
    businessAddress: "",
    businessPhone: "",
    businessTaxLine: formatGstinOrPanLine(activeOrganisation?.gstNumber, activeOrganisation?.pan),
    placeOfSupply: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !invoiceId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [invoiceDetail, settings, profile] = await Promise.all([
        fetchSalesInvoiceDetail(orgId, invoiceId.trim()),
        fetchSalesInvoiceSettings(orgId).catch(() => DEFAULT_STORED_SALES_INVOICE_SETTINGS),
        fetchBusinessProfile(orgId).catch(() => null),
      ]);

      setInvoice(invoiceDetail);
      setPaymentAmount(invoiceDetail.balanceAmount);
      setPaymentMode(invoiceDetail.paymentMode || "cash");
      setPaymentError(null);
      setReminderError(null);
      setStoredSettings({
        ...settings,
        themeId: normalizeThemeId(invoiceDetail.theme),
      });
      if (profile) {
        setOrganisationSnapshot(organisationProfileToSnapshot(profile));
      }

      if (invoiceDetail.partyId) {
        try {
          const partyDetail = await fetchPartyDetail(orgId, invoiceDetail.partyId);
          setParty(partyDetailToSelected(partyDetail));
        } catch {
          setParty(null);
        }
      } else {
        setParty(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.salesInvoices.view.loadError"));
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [activeOrganisation?.gstNumber, activeOrganisation?.pan, activeOrganisationId, invoiceId, t]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const canRecordPayment =
    invoice != null &&
    invoice.balanceAmount > 0 &&
    invoice.status !== "cancelled" &&
    invoice.status !== "returned" &&
    (invoice.status === "unpaid" ||
      invoice.status === "partial" ||
      invoice.status === "partial_return");

  const canSendPaymentReminder = canRecordPayment;

  const sendPaymentReminder = () => {
    if (!invoice) return;

    setReminderError(null);
    const result = sharePaymentReminderWhatsApp({
      partyName: invoice.partyName,
      partyPhone: party?.phone ?? invoice.partyPhone,
      invoiceNumber: invoice.displayNumber,
      balanceAmount: invoice.balanceAmount,
      dueDate: invoice.dueDate,
      businessName,
      businessPhone: organisationSnapshot.businessPhone,
    });

    if (!result.ok) {
      setReminderError(t("dashboard.salesInvoices.view.reminderNoPhone"));
    }
  };

  const submitPayment = async (fullyPaid: boolean) => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !invoice) return;

    setRecordingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const amount = fullyPaid ? invoice.balanceAmount : paymentAmount;
      if (!fullyPaid && (amount <= 0 || amount > invoice.balanceAmount)) {
        setPaymentError(t("dashboard.salesInvoices.view.paymentError"));
        return;
      }

      const updated = await recordSalesInvoicePayment(orgId, invoice.invoiceId, {
        ...(fullyPaid ? { fullyPaid: true } : { amount }),
        paymentMode,
      });

      setInvoice(updated);
      setPaymentAmount(updated.balanceAmount);
      setPaymentMode(updated.paymentMode || paymentMode);
      setPaymentSuccess(t("dashboard.salesInvoices.view.paymentRecorded"));

      if (updated.partyId) {
        try {
          const partyDetail = await fetchPartyDetail(orgId, updated.partyId);
          setParty(partyDetailToSelected(partyDetail));
        } catch {
          // Keep existing party snapshot if refresh fails.
        }
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : t("dashboard.salesInvoices.view.paymentError"),
      );
    } finally {
      setRecordingPayment(false);
    }
  };

  const previewModel = useMemo(() => {
    if (!invoice) return null;
    return buildLiveInvoicePreviewFromDetail(invoice, businessName, organisationSnapshot, party);
  }, [invoice, businessName, organisationSnapshot, party]);

  const themeLabel =
    INVOICE_THEME_CARDS.find((theme) => theme.id === storedSettings.themeId)?.label ??
    storedSettings.themeId;

  const printTitle = invoice ? `Invoice ${invoice.displayNumber}` : "Invoice";
  const printOptions = {
    documentTitle: printTitle,
    pageSize: resolveInvoicePageSizeFromTheme(storedSettings.themeId),
  };

  const previewProps = useMemo(() => {
    if (!previewModel) return null;
    return {
      themeId: storedSettings.themeId,
      themeLabel,
      embedded: true,
      businessName: previewModel.businessName,
      accentHex: getAccentHex(storedSettings.accentColor),
      showPartyBalance: storedSettings.showPartyBalance,
      showPhoneOnInvoice: storedSettings.showPhoneOnInvoice,
      showItemDescription: storedSettings.showItemDescription,
      showTimeOnInvoice: storedSettings.showTimeOnInvoice,
      enableReceiverSignature: storedSettings.enableReceiverSignature,
      signatureImageUrl: storedSettings.signatureDataUrl,
      document: mapLivePreviewToDocument(previewModel),
    };
  }, [previewModel, storedSettings, themeLabel]);

  if (!activeOrganisationId) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-sm text-brand-primary-muted">
        {t("dashboard.salesInvoices.create.noOrganisation")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-sm text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  if (error || !invoice || !previewProps) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">{error ?? t("dashboard.salesInvoices.view.loadError")}</p>
        <Link
          href="/dashboard/sales/invoices"
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          {t("dashboard.invoiceSettings.backToInvoices")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-brand-surface">
      <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/sales/invoices"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50"
              aria-label={t("common.back")}
            >
              <BackIcon />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
                  {t("dashboard.salesInvoices.view.title").replace("{number}", invoice.displayNumber)}
                </h1>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => printInvoiceElement(printAreaRef.current, printOptions)}
              className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110"
            >
              {t("dashboard.salesInvoices.create.printInvoice")}
            </button>
            <button
              type="button"
              onClick={() => triggerInvoiceSavePdf(printAreaRef.current, printOptions)}
              className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
            >
              {t("dashboard.salesInvoices.create.saveAsPdf")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:items-start lg:p-6">
        <div className="min-w-0 flex-1">
          <div
            ref={printAreaRef}
            data-invoice-print-source
            className="flex justify-center rounded-md bg-[#eceff3] px-4 py-8 sm:px-8 sm:py-10 lg:py-12"
          >
            <InvoiceSettingsPreview {...previewProps} />
          </div>
        </div>

        <aside className="w-full shrink-0 lg:w-72 lg:self-start">
          <div className="space-y-4 lg:sticky lg:top-[3.625rem] lg:max-h-[calc(100dvh-4rem-3.625rem-1rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
          <div className="rounded-sm border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-brand-primary">
              {t("dashboard.salesInvoices.view.paymentHistory")}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-brand-primary-muted">
                  {t("dashboard.salesInvoices.view.invoiceAmount")}
                </span>
                <span className="font-semibold tabular-nums text-brand-primary">
                  {formatInr(invoice.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-brand-primary-muted">
                  {t("dashboard.salesInvoices.create.amountReceived")}
                </span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {formatInr(invoice.amountReceived)}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-brand-primary">
                    {t("dashboard.salesInvoices.create.balanceAmount")}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${invoice.balanceAmount > 0 ? "text-amber-700" : "text-emerald-700"}`}
                  >
                    {formatInr(invoice.balanceAmount)}
                  </span>
                </div>
              </div>
            </div>
            {canSendPaymentReminder ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {reminderError ? <p className="mb-2 text-xs text-red-600">{reminderError}</p> : null}
                <button
                  type="button"
                  onClick={sendPaymentReminder}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-600/25 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <WhatsAppIcon />
                  {t("dashboard.salesInvoices.view.sendPaymentReminder")}
                </button>
              </div>
            ) : null}
          </div>

          {canRecordPayment ? (
            <div className="rounded-sm border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-brand-primary">
                {t("dashboard.salesInvoices.view.recordPayment")}
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.salesInvoices.view.paymentAmount")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={invoice.balanceAmount}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
                  />
                  <p className="mt-1 text-xs text-brand-primary-muted">
                    {t("dashboard.salesInvoices.create.balanceAmount")}: {formatInr(invoice.balanceAmount)}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
                    {t("dashboard.salesInvoices.view.paymentMode")}
                  </label>
                  <ModernSelect
                    value={paymentMode}
                    onChange={setPaymentMode}
                    options={PAYMENT_MODES.map((mode) => ({
                      value: mode.value,
                      label: mode.label,
                    }))}
                  />
                </div>
                {paymentError ? <p className="text-sm text-red-600">{paymentError}</p> : null}
                {paymentSuccess ? <p className="text-sm text-emerald-700">{paymentSuccess}</p> : null}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    disabled={recordingPayment || paymentAmount <= 0}
                    onClick={() => void submitPayment(false)}
                    className="inline-flex h-10 items-center justify-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {recordingPayment
                      ? t("dashboard.salesInvoices.view.recordingPayment")
                      : t("dashboard.salesInvoices.view.recordPayment")}
                  </button>
                  <button
                    type="button"
                    disabled={recordingPayment}
                    onClick={() => void submitPayment(true)}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {recordingPayment
                      ? t("dashboard.salesInvoices.view.recordingPayment")
                      : t("dashboard.salesInvoices.view.markAsPaid")}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

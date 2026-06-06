"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InvoiceSettingsPreview } from "@/components/dashboard/sales/invoice-settings-preview";
import { QuotationSendModal } from "@/components/dashboard/sales/quotation-send-modal";
import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import { fetchBusinessProfile } from "@/lib/business/business-profile-api-client";
import { fetchPartyDetail } from "@/lib/parties/parties-api-client";
import {
  buildLiveQuotationPreviewFromDetail,
  mapQuotationPreviewToDocument,
} from "@/lib/sales/build-live-quotation-preview";
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
import { fetchQuotationDetail } from "@/lib/sales/quotations-api-client";
import { fetchSalesInvoiceSettings } from "@/lib/sales/sales-invoice-settings-api-client";
import type { QuotationDetail, QuotationStatus } from "@/lib/types/quotations-api";
import type { PartyDetail } from "@/lib/types/parties-api";
import { useTranslation } from "@/lib/localization";

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

function StatusBadge({ status }: { status: QuotationStatus }) {
  const { t } = useTranslation();
  const styles: Record<QuotationStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    sent: "bg-blue-50 text-blue-800 ring-blue-600/15",
    accepted: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    rejected: "bg-red-50 text-red-800 ring-red-600/15",
    expired: "bg-amber-50 text-amber-900 ring-amber-600/15",
    converted: "bg-violet-50 text-violet-800 ring-violet-600/15",
  };
  const labels: Record<QuotationStatus, string> = {
    draft: t("dashboard.quotations.statusDraft"),
    sent: t("dashboard.quotations.statusSent"),
    accepted: t("dashboard.quotations.statusAccepted"),
    rejected: t("dashboard.quotations.statusRejected"),
    expired: t("dashboard.quotations.statusExpired"),
    converted: t("dashboard.quotations.statusConverted"),
  };

  return (
    <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
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

export function QuotationViewPage({ quotationId }: { quotationId: string }) {
  const { t } = useTranslation();
  const { activeOrganisation, activeOrganisationId } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
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
  const [partyEmail, setPartyEmail] = useState<string | undefined>();
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotation = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !quotationId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [quotationDetail, settings, profile] = await Promise.all([
        fetchQuotationDetail(orgId, quotationId.trim()),
        fetchSalesInvoiceSettings(orgId).catch(() => DEFAULT_STORED_SALES_INVOICE_SETTINGS),
        fetchBusinessProfile(orgId).catch(() => null),
      ]);

      setQuotation(quotationDetail);
      setStoredSettings({
        ...settings,
        themeId: normalizeThemeId(quotationDetail.theme),
      });
      if (profile) {
        setOrganisationSnapshot(organisationProfileToSnapshot(profile));
      }

      if (quotationDetail.partyId) {
        try {
          const partyDetail = await fetchPartyDetail(orgId, quotationDetail.partyId);
          setParty(partyDetailToSelected(partyDetail));
          setPartyEmail(partyDetail.email?.trim() || undefined);
        } catch {
          setParty(null);
          setPartyEmail(undefined);
        }
      } else {
        setParty(null);
        setPartyEmail(undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.quotations.view.loadError"));
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  }, [activeOrganisation?.gstNumber, activeOrganisation?.pan, activeOrganisationId, quotationId, t]);

  useEffect(() => {
    void loadQuotation();
  }, [loadQuotation]);

  const previewModel = useMemo(() => {
    if (!quotation) return null;
    return buildLiveQuotationPreviewFromDetail(quotation, businessName, organisationSnapshot, party);
  }, [quotation, businessName, organisationSnapshot, party]);

  const themeLabel =
    INVOICE_THEME_CARDS.find((theme) => theme.id === storedSettings.themeId)?.label ??
    storedSettings.themeId;

  const printTitle = quotation ? `Quotation ${quotation.displayNumber}` : "Quotation";
  const printOptions = {
    documentTitle: printTitle,
    pageSize: resolveInvoicePageSizeFromTheme(storedSettings.themeId),
  };

  const shareInput = useMemo(() => {
    if (!quotation) return null;
    return {
      partyName: quotation.partyName,
      partyPhone: party?.phone ?? quotation.partyPhone,
      partyEmail,
      quotationNumber: quotation.displayNumber,
      totalAmount: quotation.totalAmount,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      businessName,
      notes: quotation.notes,
    };
  }, [quotation, party?.phone, partyEmail, businessName]);

  const previewProps = useMemo(() => {
    if (!previewModel) return null;
    return {
      themeId: storedSettings.themeId,
      themeLabel,
      embedded: true,
      businessName: previewModel.businessName,
      accentHex: getAccentHex(storedSettings.accentColor),
      showPartyBalance: false,
      showPhoneOnInvoice: storedSettings.showPhoneOnInvoice,
      showItemDescription: storedSettings.showItemDescription,
      showTimeOnInvoice: storedSettings.showTimeOnInvoice,
      enableReceiverSignature: storedSettings.enableReceiverSignature,
      signatureImageUrl: storedSettings.signatureDataUrl,
      document: mapQuotationPreviewToDocument(previewModel),
    };
  }, [previewModel, storedSettings, themeLabel]);

  if (!activeOrganisationId) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-sm text-brand-primary-muted">
        {t("dashboard.quotations.create.noOrganisation")}
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

  if (error || !quotation || !previewProps) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-600">{error ?? t("dashboard.quotations.view.loadError")}</p>
        <Link
          href="/dashboard/sales/quotations"
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          {t("dashboard.quotations.backToList")}
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
              href="/dashboard/sales/quotations"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50"
              aria-label={t("common.back")}
            >
              <BackIcon />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
                  {t("dashboard.quotations.view.title").replace("{number}", quotation.displayNumber)}
                </h1>
                <StatusBadge status={quotation.status} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quotation.status !== "converted" ? (
              <Link
                href={`/dashboard/sales/quotations/${encodeURIComponent(quotation.quotationId)}/edit`}
                className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
              >
                {t("dashboard.quotations.view.edit")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSendModalOpen(true)}
              className="inline-flex h-10 items-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {t("dashboard.quotations.view.send")}
            </button>
            <button
              type="button"
              onClick={() => printInvoiceElement(printAreaRef.current, printOptions)}
              className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110"
            >
              {t("dashboard.quotations.create.printQuotation")}
            </button>
            <button
              type="button"
              onClick={() => triggerInvoiceSavePdf(printAreaRef.current, printOptions)}
              className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
            >
              {t("dashboard.quotations.create.saveAsPdf")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-center p-4 lg:p-6">
        <div ref={printAreaRef} className="w-full max-w-[210mm]">
          <InvoiceSettingsPreview {...previewProps} />
        </div>
      </div>

      {shareInput ? (
        <QuotationSendModal
          open={sendModalOpen}
          onClose={() => setSendModalOpen(false)}
          shareInput={shareInput}
        />
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemsToBillModal } from "@/components/dashboard/sales/add-items-to-bill-modal";
import { InvoiceSettingsModal } from "@/components/dashboard/sales/invoice-settings-modal";
import { SalesInvoicePreviewModal } from "@/components/dashboard/sales/sales-invoice-preview-modal";
import {
  PartySelectModal,
  type SelectedInvoiceParty,
} from "@/components/dashboard/sales/party-select-modal";
import type { InventoryBillPick } from "@/lib/dashboard/mock-inventory-items";
import { fetchBusinessProfile } from "@/lib/business/business-profile-api-client";
import { fetchPartyDetail } from "@/lib/parties/parties-api-client";
import {
  getInvoiceLineDisplay,
  invoiceLinePriceFromInput,
  invoiceLinePriceInputValue,
  normalizeSalesTaxMode,
} from "@/lib/sales/invoice-tax";
import {
  calcInvoiceTotals,
  clampInvoiceLineQty,
  createInitialInvoiceForm,
  formatInr,
  getMaxQtyForLine,
  mergeInventoryPickIntoLines,
  type CreateInvoiceFormState,
  type InvoiceLineItem,
  type InvoiceSettings,
} from "@/lib/sales/create-invoice-form";
import { buildLiveQuotationPreviewFromForm } from "@/lib/sales/build-live-quotation-preview";
import {
  mergeInvoiceSettingsIntoStored,
  storedSettingsToInvoiceSettings,
} from "@/lib/sales/map-stored-invoice-settings";
import {
  mapCreateQuotationFormToRequest,
  mapUpdateQuotationFormToRequest,
} from "@/lib/sales/map-create-quotation-request";
import { mapQuotationDetailToFormState } from "@/lib/sales/map-quotation-detail-to-form";
import { fetchInventoryItemDetail } from "@/lib/inventory/inventory-api-client";
import {
  DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  normalizeThemeId,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import {
  formatGstinOrPanLine,
  organisationProfileToSnapshot,
  type InvoiceOrganisationSnapshot,
} from "@/lib/sales/invoice-preview-formatters";
import {
  fetchSalesInvoiceSettings,
  updateSalesInvoiceSettings,
} from "@/lib/sales/sales-invoice-settings-api-client";
import {
  createQuotation,
  fetchNextQuotationNumber,
  fetchQuotationDetail,
  updateQuotation,
} from "@/lib/sales/quotations-api-client";
import type { QuotationStatus } from "@/lib/types/quotations-api";
import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import { useTranslation } from "@/lib/localization";
import { useUserMe } from "@/components/providers/user-me-provider";

const inputSmClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const inputGroupClass =
  "flex h-9 overflow-hidden rounded-md border border-slate-200/90 bg-white focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15";
const inputGroupInnerClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm text-brand-primary outline-none tabular-nums placeholder:text-brand-primary-muted/60";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function FieldCell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <label className="mb-1 min-h-[16px] text-xs font-medium leading-4 text-brand-primary-muted">
        {label}
      </label>
      <div className="min-h-9">{children}</div>
    </div>
  );
}

function TotalsRow({
  label,
  value,
  valueTone = "default",
  bold,
}: {
  label: React.ReactNode;
  value: string;
  valueTone?: "default" | "discount";
  bold?: boolean;
}) {
  const valueClass =
    valueTone === "discount" ? "text-red-600" : "text-brand-primary";

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2.5">
      <div className={bold ? "text-base font-bold text-brand-primary" : "text-sm text-brand-primary-mid"}>
        {label}
      </div>
      <span
        className={`shrink-0 tabular-nums ${bold ? "text-xl font-bold" : "text-sm font-semibold"} ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CreateQuotationPage({ quotationId }: { quotationId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisation, activeOrganisationId } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";
  const editQuotationId = quotationId?.trim() ?? "";
  const isEditMode = editQuotationId.length > 0;

  const [form, setForm] = useState<CreateInvoiceFormState>(() => ({
    ...createInitialInvoiceForm(),
    showPaymentTerms: true,
    cashSaleDefault: false,
  }));
  const [selectedParty, setSelectedParty] = useState<SelectedInvoiceParty | null>(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [editStatus, setEditStatus] = useState<QuotationStatus>("draft");
  const [storedInvoiceSettings, setStoredInvoiceSettings] = useState<StoredSalesInvoiceSettings>(
    DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<LiveInvoicePreviewModel | null>(null);
  const [organisationSnapshot, setOrganisationSnapshot] = useState<InvoiceOrganisationSnapshot>({
    businessAddress: "",
    businessPhone: "",
    businessTaxLine: "",
    placeOfSupply: "",
  });

  const patch = useCallback((partial: Partial<CreateInvoiceFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const totals = useMemo(() => calcInvoiceTotals(form), [form]);

  const canSave =
    !saving &&
    !loadingMeta &&
    Boolean(activeOrganisationId) &&
    selectedParty !== null &&
    form.lineItems.length > 0 &&
    form.lineItems.every((line) => !line.serialised || line.serialNumbers.length === 1);

  const fallbackOrganisationSnapshot = useMemo(
    (): InvoiceOrganisationSnapshot => ({
      businessAddress: "",
      businessPhone: "",
      businessTaxLine: formatGstinOrPanLine(activeOrganisation?.gstNumber, activeOrganisation?.pan),
      placeOfSupply: "",
    }),
    [activeOrganisation?.gstNumber, activeOrganisation?.pan],
  );

  const resolvedOrganisationSnapshot =
    organisationSnapshot.businessAddress ||
    organisationSnapshot.businessPhone ||
    organisationSnapshot.placeOfSupply
      ? organisationSnapshot
      : fallbackOrganisationSnapshot;

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;

    let cancelled = false;
    fetchBusinessProfile(orgId)
      .then((profile) => {
        if (!cancelled) setOrganisationSnapshot(organisationProfileToSnapshot(profile));
      })
      .catch(() => {
        if (!cancelled) setOrganisationSnapshot(fallbackOrganisationSnapshot);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, fallbackOrganisationSnapshot]);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setLoadingMeta(false);
      return;
    }

    if (isEditMode) {
      let cancelled = false;
      setLoadingMeta(true);
      setError(null);

      Promise.all([
        fetchQuotationDetail(orgId, editQuotationId),
        fetchSalesInvoiceSettings(orgId).catch(() => DEFAULT_STORED_SALES_INVOICE_SETTINGS),
      ])
        .then(async ([quotation, settings]) => {
          if (cancelled) return;
          if (quotation.status === "converted") {
            throw new Error(t("dashboard.quotations.edit.notEditable"));
          }

          const uniqueItemIds = [...new Set(quotation.lineItems.map((line) => line.itemId))];
          const itemDetails = new Map(
            (
              await Promise.all(
                uniqueItemIds.map(async (itemId) => {
                  try {
                    const detail = await fetchInventoryItemDetail(orgId, itemId);
                    return [itemId, detail] as const;
                  } catch {
                    return null;
                  }
                }),
              )
            ).filter((entry): entry is readonly [string, Awaited<ReturnType<typeof fetchInventoryItemDetail>>] =>
              entry !== null,
            ),
          );

          const mergedSettings: StoredSalesInvoiceSettings = {
            ...settings,
            themeId: normalizeThemeId(quotation.theme),
          };
          setStoredInvoiceSettings(mergedSettings);
          setForm(mapQuotationDetailToFormState(quotation, itemDetails, mergedSettings));
          setEditStatus(quotation.status);

          if (quotation.partyId) {
            try {
              const partyDetail = await fetchPartyDetail(orgId, quotation.partyId);
              if (!cancelled) {
                setSelectedParty({
                  partyId: partyDetail.partyId,
                  name: partyDetail.name,
                  phone: partyDetail.phone,
                  balance: partyDetail.currentBalance,
                  ...(partyDetail.billingAddress?.trim()
                    ? { billingAddress: partyDetail.billingAddress.trim() }
                    : {}),
                  ...(partyDetail.shippingAddress?.trim()
                    ? { shippingAddress: partyDetail.shippingAddress.trim() }
                    : {}),
                  ...(partyDetail.gstin?.trim() ? { gstin: partyDetail.gstin.trim() } : {}),
                  ...(partyDetail.pan?.trim()
                    ? { pan: partyDetail.pan.trim().toUpperCase() }
                    : {}),
                });
              }
            } catch {
              if (!cancelled) {
                setSelectedParty({
                  partyId: quotation.partyId,
                  name: quotation.partyName,
                  phone: quotation.partyPhone,
                  balance: 0,
                });
              }
            }
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : t("dashboard.quotations.edit.loadError"));
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingMeta(false);
        });

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    setLoadingMeta(true);

    fetchNextQuotationNumber(orgId)
      .then((next) => {
        if (!cancelled) {
          patch({
            invoicePrefix: next.quotationPrefix,
            invoiceNumber: next.quotationNumber,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, editQuotationId, isEditMode, patch, t]);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;

    let cancelled = false;
    fetchSalesInvoiceSettings(orgId)
      .then((data) => {
        if (cancelled) return;
        setStoredInvoiceSettings(data);
        patch({ settings: storedSettingsToInvoiceSettings(data) });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, patch]);

  const handleAddItems = (picks: InventoryBillPick[]) => {
    setForm((prev) => {
      let lineItems = prev.lineItems;
      for (const pick of picks) {
        lineItems = mergeInventoryPickIntoLines(lineItems, pick);
      }
      if (lineItems === prev.lineItems) return prev;
      return { ...prev, lineItems };
    });
  };

  const updateLine = (id: string, partial: Partial<InvoiceLineItem>) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((line) => {
        if (line.id !== id) return line;
        const next = { ...line, ...partial };
        if ("qty" in partial && !line.serialised) {
          next.qty = clampInvoiceLineQty(line, Number(partial.qty) || 1, prev.lineItems);
        }
        return next;
      }),
    }));
  };

  const adjustLineQty = (id: string, delta: number) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((line) => {
        if (line.id !== id || line.serialised) return line;
        return {
          ...line,
          qty: clampInvoiceLineQty(line, line.qty + delta, prev.lineItems),
        };
      }),
    }));
  };

  const removeLine = (id: string) => {
    patch({ lineItems: form.lineItems.filter((l) => l.id !== id) });
  };

  const handleQuotationDateChange = (date: string) => {
    patch({
      invoiceDate: date,
      dueDate: addDays(date, form.paymentTermsDays),
    });
  };

  const handleValidUntilDaysChange = (days: number) => {
    patch({
      paymentTermsDays: days,
      dueDate: addDays(form.invoiceDate, days),
    });
  };

  const handlePartySelect = (party: SelectedInvoiceParty) => {
    setSelectedParty(party);
    patch({ partyId: party.partyId });

    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;

    void fetchPartyDetail(orgId, party.partyId)
      .then((detail) => {
        setSelectedParty((current) => {
          if (!current || current.partyId !== party.partyId) return current;
          return {
            ...current,
            phone: detail.phone ?? current.phone,
            ...(detail.billingAddress?.trim() ? { billingAddress: detail.billingAddress.trim() } : {}),
            ...(detail.shippingAddress?.trim() ? { shippingAddress: detail.shippingAddress.trim() } : {}),
            ...(detail.gstin?.trim() ? { gstin: detail.gstin.trim() } : {}),
            ...(detail.pan?.trim() ? { pan: detail.pan.trim().toUpperCase() } : {}),
            balance: detail.currentBalance,
          };
        });
      })
      .catch(() => {});
  };

  const handleInvoiceSettingsSave = async (
    nextSettings: InvoiceSettings,
    invoiceMeta?: { invoicePrefix: string; invoiceNumber: string },
  ) => {
    const orgId = activeOrganisationId?.trim();
    patch({
      settings: nextSettings,
      ...(invoiceMeta
        ? { invoicePrefix: invoiceMeta.invoicePrefix, invoiceNumber: invoiceMeta.invoiceNumber }
        : {}),
    });
    if (!orgId) return;

    const merged = mergeInvoiceSettingsIntoStored(storedInvoiceSettings, nextSettings);
    try {
      const updated = await updateSalesInvoiceSettings(orgId, merged);
      setStoredInvoiceSettings(updated);
      patch({ settings: storedSettingsToInvoiceSettings(updated) });
    } catch {
      setStoredInvoiceSettings(merged);
    }
  };

  const livePreviewModel = useMemo(
    () =>
      buildLiveQuotationPreviewFromForm({
        form,
        party: selectedParty,
        businessName,
        organisation: resolvedOrganisationSnapshot,
        storedSettings: storedInvoiceSettings,
      }),
    [form, selectedParty, businessName, resolvedOrganisationSnapshot, storedInvoiceSettings],
  );

  const validateAndSave = async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setError(t("dashboard.quotations.create.noOrganisation"));
      return;
    }
    if (!selectedParty) {
      setError(t("dashboard.quotations.create.validationParty"));
      return;
    }
    if (form.lineItems.length === 0) {
      setError(t("dashboard.quotations.create.validationItems"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const quotation = isEditMode
        ? await updateQuotation(
            orgId,
            editQuotationId,
            mapUpdateQuotationFormToRequest(
              form,
              selectedParty.partyId,
              null,
              storedInvoiceSettings,
              { status: editStatus },
            ),
          )
        : await createQuotation(
            orgId,
            mapCreateQuotationFormToRequest(form, selectedParty.partyId, null, storedInvoiceSettings),
          );
      router.push(`/dashboard/sales/quotations/${encodeURIComponent(quotation.quotationId)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? t("dashboard.quotations.edit.saveError")
            : t("dashboard.quotations.create.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingMeta && isEditMode) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-sm text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={
              isEditMode
                ? `/dashboard/sales/quotations/${encodeURIComponent(editQuotationId)}`
                : "/dashboard/sales/quotations"
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50"
            aria-label={t("common.back")}
          >
            <BackIcon />
          </Link>
          <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
            {isEditMode ? t("dashboard.quotations.editTitle") : t("dashboard.quotations.createTitle")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={form.lineItems.length === 0}
            onClick={() => {
              setPreviewModel(livePreviewModel);
              setPreviewOpen(true);
            }}
            className="hidden h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            {t("dashboard.quotations.create.previewQuotation")}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200/90 bg-white px-3 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">{t("dashboard.salesInvoices.create.settings")}</span>
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void validateAndSave()}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? t("dashboard.quotations.create.saving")
              : isEditMode
                ? t("dashboard.quotations.edit.saveQuotation")
                : t("dashboard.quotations.create.saveQuotation")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 lg:mx-6">
          {error}
        </div>
      )}

      <div className="flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <h2 className="mb-2 text-sm font-semibold text-brand-primary">
              {t("dashboard.salesInvoices.create.billTo")}
            </h2>
            {selectedParty ? (
              <div className="min-h-[140px] rounded-md border border-slate-200/90 bg-slate-50/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-primary">{selectedParty.name}</p>
                    {selectedParty.phone && (
                      <p className="text-xs text-brand-primary-muted">{selectedParty.phone}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPartyModalOpen(true)}
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPartyModalOpen(true)}
                className="flex min-h-[140px] w-full items-center justify-center rounded-md border border-dashed border-brand-primary/25 bg-brand-primary/[0.02] text-sm font-semibold text-brand-primary transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/[0.04]"
              >
                + {t("dashboard.salesInvoices.create.addParty")}
              </button>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FieldCell label={t("dashboard.quotations.create.quotationPrefix")}>
                <input
                  value={form.invoicePrefix}
                  onChange={(e) => patch({ invoicePrefix: e.target.value })}
                  readOnly={isEditMode}
                  className={`${inputSmClass}${isEditMode ? " cursor-not-allowed bg-slate-50 text-brand-primary-muted" : ""}`}
                />
              </FieldCell>
              <FieldCell label={t("dashboard.quotations.create.quotationNumber")}>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => patch({ invoiceNumber: e.target.value })}
                  readOnly={isEditMode}
                  className={`${inputSmClass}${isEditMode ? " cursor-not-allowed bg-slate-50 text-brand-primary-muted" : ""}`}
                />
              </FieldCell>
              <FieldCell label={t("dashboard.quotations.create.quotationDate")}>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => handleQuotationDateChange(e.target.value)}
                  className={inputSmClass}
                />
              </FieldCell>
            </div>

            <div className="rounded-md border border-slate-200/90 bg-slate-50/40 p-3">
              <div className="grid grid-cols-2 gap-4">
                <FieldCell label={t("dashboard.quotations.create.validForDays")} className="min-w-0">
                  <div className={inputGroupClass}>
                    <input
                      type="number"
                      min={0}
                      value={form.paymentTermsDays}
                      onChange={(e) => handleValidUntilDaysChange(Number(e.target.value) || 0)}
                      className={inputGroupInnerClass}
                    />
                    <span className="flex shrink-0 items-center border-l border-slate-200/90 bg-slate-50/80 px-3 text-xs font-medium text-brand-primary-muted">
                      {t("dashboard.salesInvoices.create.days")}
                    </span>
                  </div>
                </FieldCell>
                <FieldCell label={t("dashboard.quotations.create.validUntil")} className="min-w-0">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => patch({ dueDate: e.target.value })}
                    className={inputSmClass}
                  />
                </FieldCell>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-md border border-slate-200/90">
          <div className="flex items-center justify-end gap-2 border-b border-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={() => setAddItemsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white hover:brightness-110"
              aria-label={t("dashboard.salesInvoices.create.addItem")}
            >
              +
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-brand-surface/50 text-[10px] font-bold uppercase tracking-wide text-brand-primary-muted">
                  <th className="w-10 px-3 py-2">{t("dashboard.salesInvoices.create.colNo")}</th>
                  <th className="min-w-[200px] px-3 py-2">{t("dashboard.salesInvoices.create.colItems")}</th>
                  <th className="w-24 px-3 py-2">{t("dashboard.salesInvoices.create.colHsn")}</th>
                  <th className="w-28 px-3 py-2">{t("dashboard.salesInvoices.create.colQty")}</th>
                  <th className="w-28 px-3 py-2">{t("dashboard.salesInvoices.create.colPrice")}</th>
                  <th className="w-20 px-3 py-2">{t("dashboard.salesInvoices.create.colTax")}</th>
                  <th className="w-28 px-3 py-2 text-right">{t("dashboard.salesInvoices.create.colAmount")}</th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody>
                {form.lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <button
                        type="button"
                        onClick={() => setAddItemsOpen(true)}
                        className="flex min-h-[140px] w-full items-center justify-center rounded-md border border-dashed border-brand-primary/25 py-10 text-sm font-semibold text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]"
                      >
                        + {t("dashboard.salesInvoices.create.addItem")}
                      </button>
                    </td>
                  </tr>
                ) : (
                  form.lineItems.map((line, idx) => {
                    const salesTaxMode = normalizeSalesTaxMode(line.salesTaxMode);
                    const lineDisplay = getInvoiceLineDisplay({
                      qty: line.qty,
                      pricePerItem: line.pricePerItem,
                      discount: line.discount,
                      discountType: line.discountType,
                      gstPercent: line.gstPercent,
                      salesTaxMode,
                    });
                    const maxQty = getMaxQtyForLine(line, form.lineItems);
                    return (
                      <tr key={line.id} className="border-b border-slate-50 hover:bg-blue-50/20">
                        <td className="align-top px-3 py-2 tabular-nums text-brand-primary-muted">{idx + 1}</td>
                        <td className="align-top px-3 py-2">
                          <p className="font-medium text-brand-primary">{line.name}</p>
                        </td>
                        <td className="align-top px-3 py-2">
                          <input
                            value={line.hsn}
                            onChange={(e) => updateLine(line.id, { hsn: e.target.value })}
                            className={inputSmClass}
                          />
                        </td>
                        <td className="align-top px-3 py-2">
                          {line.serialised ? (
                            <div className={`${inputSmClass} w-10 text-center tabular-nums`}>1</div>
                          ) : (
                            <div className={inputGroupClass}>
                              <button
                                type="button"
                                disabled={line.qty <= 1}
                                onClick={() => adjustLineQty(line.id, -1)}
                                className="flex h-9 w-8 shrink-0 items-center justify-center border-r border-slate-200/90 text-base font-medium text-brand-primary hover:bg-slate-50 disabled:opacity-40"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={maxQty > 0 ? maxQty : 1}
                                value={line.qty}
                                onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) || 1 })}
                                className={`${inputGroupInnerClass} w-10 min-w-0 text-center`}
                              />
                              <button
                                type="button"
                                disabled={maxQty <= 0 || line.qty >= maxQty}
                                onClick={() => adjustLineQty(line.id, 1)}
                                className="flex h-9 w-8 shrink-0 items-center justify-center border-l border-slate-200/90 text-base font-medium text-brand-primary hover:bg-slate-50 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="align-top px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={invoiceLinePriceInputValue(line.pricePerItem, line.gstPercent, salesTaxMode)}
                            onChange={(e) =>
                              updateLine(line.id, {
                                pricePerItem: invoiceLinePriceFromInput(
                                  Number(e.target.value) || 0,
                                  line.gstPercent,
                                  salesTaxMode,
                                ),
                              })
                            }
                            className={`${inputSmClass} tabular-nums`}
                          />
                        </td>
                        <td className="align-top px-3 py-2 pt-[10px] text-right tabular-nums text-brand-primary-muted">
                          <p>{formatInr(lineDisplay.tax)}</p>
                          <p className="text-[10px]">({line.gstPercent}%)</p>
                        </td>
                        <td className="align-top px-3 py-2 pt-[10px] text-right font-semibold tabular-nums text-brand-primary">
                          {formatInr(lineDisplay.amount)}
                        </td>
                        <td className="align-top px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-red-50 hover:text-red-600"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {form.showNotes ? (
              <div>
                <label className="text-xs font-medium text-brand-primary-muted">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  placeholder={t("dashboard.salesInvoices.create.notesPlaceholder")}
                  rows={3}
                  className={`mt-1 ${textareaClass}`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => patch({ showNotes: true })}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.salesInvoices.create.addNotes")}
              </button>
            )}
            {form.showTerms ? (
              <div>
                <label className="text-xs font-medium text-brand-primary-muted">Terms</label>
                <textarea
                  value={form.terms}
                  onChange={(e) => patch({ terms: e.target.value })}
                  placeholder={t("dashboard.salesInvoices.create.termsPlaceholder")}
                  rows={3}
                  className={`mt-1 ${textareaClass}`}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => patch({ showTerms: true })}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.salesInvoices.create.addTerms")}
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
            <div className="divide-y divide-slate-100 px-4">
              <TotalsRow
                label={t("dashboard.salesInvoices.create.taxableAmount")}
                value={formatInr(totals.taxableAmount)}
              />
              {totals.gstSplit.map((row) => (
                <div key={`gst-${row.gstPercent}`}>
                  <TotalsRow
                    label={`${t("dashboard.salesInvoices.create.cgst")} (${row.cgstPercent}%)`}
                    value={formatInr(row.cgst)}
                  />
                  <TotalsRow
                    label={`${t("dashboard.salesInvoices.create.sgst")} (${row.sgstPercent}%)`}
                    value={formatInr(row.sgst)}
                  />
                </div>
              ))}
              <TotalsRow
                label={t("dashboard.salesInvoices.create.totalAmount")}
                value={formatInr(totals.totalAmount)}
                bold
              />
            </div>
          </div>
        </div>
      </div>

      <PartySelectModal
        open={partyModalOpen}
        organisationId={activeOrganisationId}
        onClose={() => setPartyModalOpen(false)}
        onSelect={handlePartySelect}
      />
      <AddItemsToBillModal
        open={addItemsOpen}
        organisationId={activeOrganisationId}
        onClose={() => setAddItemsOpen(false)}
        onAdd={handleAddItems}
      />
      <InvoiceSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={form.settings}
        invoicePrefix={form.invoicePrefix}
        invoiceNumber={form.invoiceNumber}
        onSave={handleInvoiceSettingsSave}
      />
      <SalesInvoicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        model={previewModel}
        storedSettings={storedInvoiceSettings}
        title={t("dashboard.quotations.create.previewQuotation")}
        quotation
      />
    </div>
  );
}

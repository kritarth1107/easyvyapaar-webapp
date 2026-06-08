"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddItemsToBillModal } from "@/components/dashboard/sales/add-items-to-bill-modal";
import { BankAccountModal } from "@/components/dashboard/sales/bank-account-modal";
import { InvoiceSettingsModal } from "@/components/dashboard/sales/invoice-settings-modal";
import { SalesInvoicePreviewModal } from "@/components/dashboard/sales/sales-invoice-preview-modal";
import {
  PartySelectModal,
  type SelectedInvoiceParty,
} from "@/components/dashboard/sales/party-select-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import type { InventoryBillPick } from "@/lib/types/inventory-ui";
import { WALK_IN_PARTY_ID } from "@/lib/parties/constants";
import { fetchOrganisationBankAccounts } from "@/lib/organisations/organisation-bank-api-client";
import { fetchBusinessProfile } from "@/lib/business/business-profile-api-client";
import { fetchPartyDetail } from "@/lib/parties/parties-api-client";
import { maskBankAccountNumber } from "@/lib/parties/party-detail-utils";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
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
  PAYMENT_MODES,
  type CreateInvoiceFormState,
  type InvoiceLineItem,
} from "@/lib/sales/create-invoice-form";
import { mapCreateInvoiceFormToRequest } from "@/lib/sales/map-create-invoice-request";
import {
  mergeInvoiceSettingsIntoStored,
  storedSettingsToInvoiceSettings,
} from "@/lib/sales/map-stored-invoice-settings";
import {
  DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import {
  fetchSalesInvoiceSettings,
  updateSalesInvoiceSettings,
} from "@/lib/sales/sales-invoice-settings-api-client";
import { buildLiveInvoicePreviewModel } from "@/lib/sales/build-live-invoice-preview";
import {
  formatGstinOrPanLine,
  organisationProfileToSnapshot,
  type InvoiceOrganisationSnapshot,
} from "@/lib/sales/invoice-preview-formatters";
import { createSalesInvoice, fetchNextInvoiceNumber } from "@/lib/sales/sales-api-client";
import type { InvoiceSettings } from "@/lib/sales/create-invoice-form";
import type { LiveInvoicePreviewModel } from "@/lib/sales/build-live-invoice-preview";
import { useTranslation } from "@/lib/localization";
import { useUserMe } from "@/components/providers/user-me-provider";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}

const inputSmClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const inputGroupClass =
  "flex h-9 overflow-hidden rounded-md border border-slate-200/90 bg-white focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15";
const inputGroupInnerClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm text-brand-primary outline-none tabular-nums placeholder:text-brand-primary-muted/60";

function TotalsRow({
  label,
  value,
  valueTone = "default",
  bold,
}: {
  label: React.ReactNode;
  value: string;
  valueTone?: "default" | "discount" | "balance-due" | "balance-clear";
  bold?: boolean;
}) {
  const valueClass =
    valueTone === "discount"
      ? "text-red-600"
      : valueTone === "balance-due"
        ? "text-amber-700"
        : valueTone === "balance-clear"
          ? "text-emerald-700"
          : "text-brand-primary";

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

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M4 7v10M7 7v10M10 7v10M13 7v4M16 7v10M19 7v10M22 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CreateSalesInvoicePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisation, activeOrganisationId } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";

  const [form, setForm] = useState<CreateInvoiceFormState>(createInitialInvoiceForm);
  const [selectedParty, setSelectedParty] = useState<SelectedInvoiceParty | null>(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<OrganisationBankAccount[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [storedInvoiceSettings, setStoredInvoiceSettings] = useState<StoredSalesInvoiceSettings>(
    DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<LiveInvoicePreviewModel | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [organisationSnapshot, setOrganisationSnapshot] = useState<InvoiceOrganisationSnapshot>({
    businessAddress: "",
    businessPhone: "",
    businessTaxLine: "",
    placeOfSupply: "",
  });

  const fallbackOrganisationSnapshot = useMemo(
    (): InvoiceOrganisationSnapshot => ({
      businessAddress: "",
      businessPhone: "",
      businessTaxLine: formatGstinOrPanLine(
        activeOrganisation?.gstNumber,
        activeOrganisation?.pan,
      ),
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

  const patch = useCallback((partial: Partial<CreateInvoiceFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const totals = useMemo(() => calcInvoiceTotals(form), [form]);

  const canSave =
    !saving &&
    !loadingMeta &&
    Boolean(activeOrganisationId) &&
    form.lineItems.length > 0 &&
    form.lineItems.every((line) => !line.serialised || line.serialNumbers.length === 1) &&
    (selectedParty !== null || form.cashSaleDefault);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setOrganisationSnapshot({
        businessAddress: "",
        businessPhone: "",
        businessTaxLine: formatGstinOrPanLine(
          activeOrganisation?.gstNumber,
          activeOrganisation?.pan,
        ),
        placeOfSupply: "",
      });
      return;
    }

    let cancelled = false;

    fetchBusinessProfile(orgId)
      .then((profile) => {
        if (!cancelled) setOrganisationSnapshot(organisationProfileToSnapshot(profile));
      })
      .catch(() => {
        if (!cancelled) {
          setOrganisationSnapshot({
            businessAddress: "",
            businessPhone: "",
            businessTaxLine: formatGstinOrPanLine(
              activeOrganisation?.gstNumber,
              activeOrganisation?.pan,
            ),
            placeOfSupply: "",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisation?.gstNumber, activeOrganisation?.pan, activeOrganisationId]);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setLoadingMeta(false);
      return;
    }

    let cancelled = false;
    setLoadingMeta(true);

    fetchNextInvoiceNumber(orgId)
      .then((next) => {
        if (!cancelled) {
          patch({
            invoicePrefix: next.invoicePrefix,
            invoiceNumber: next.invoiceNumber,
          });
        }
      })
      .catch(() => {
        // Keep default prefix/number from initial form if API fails.
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, patch]);

  const loadBankAccounts = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setBankAccounts([]);
      return;
    }

    setBankAccountsLoading(true);
    try {
      const data = await fetchOrganisationBankAccounts(orgId);
      setBankAccounts(data);
    } catch {
      setBankAccounts([]);
    } finally {
      setBankAccountsLoading(false);
    }
  }, [activeOrganisationId]);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

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
      .catch(() => {
        // Keep form defaults if settings API fails.
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, patch]);

  const handleInvoiceSettingsSave = async (
    nextSettings: InvoiceSettings,
    invoiceMeta?: { invoicePrefix: string; invoiceNumber: string },
  ) => {
    const orgId = activeOrganisationId?.trim();
    patch({
      settings: nextSettings,
      ...(invoiceMeta
        ? {
            invoicePrefix: invoiceMeta.invoicePrefix,
            invoiceNumber: invoiceMeta.invoiceNumber,
          }
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

  const handleInvoiceDateChange = (date: string) => {
    patch({
      invoiceDate: date,
      dueDate: addDays(date, form.paymentTermsDays),
    });
  };

  const handlePaymentTermsChange = (days: number) => {
    patch({
      paymentTermsDays: days,
      dueDate: addDays(form.invoiceDate, days),
    });
  };

  const handleCashSaleToggle = (checked: boolean) => {
    if (checked) {
      const walkIn: SelectedInvoiceParty = {
        partyId: WALK_IN_PARTY_ID,
        name: t("dashboard.salesInvoices.create.cashWalkIn"),
        balance: 0,
        isCashSale: true,
      };
      setSelectedParty(walkIn);
      patch({ partyId: WALK_IN_PARTY_ID, cashSaleDefault: true });
      return;
    }

    if (selectedParty?.isCashSale) {
      setSelectedParty(null);
      patch({ partyId: null, cashSaleDefault: false });
    } else {
      patch({ cashSaleDefault: false });
    }
  };

  const handlePartySelect = (party: SelectedInvoiceParty) => {
    setSelectedParty(party);
    patch({
      partyId: party.partyId,
      cashSaleDefault: Boolean(party.isCashSale),
    });

    const orgId = activeOrganisationId?.trim();
    if (!orgId || party.isCashSale || party.partyId === WALK_IN_PARTY_ID) return;

    void fetchPartyDetail(orgId, party.partyId)
      .then((detail) => {
        setSelectedParty((current) => {
          if (!current || current.partyId !== party.partyId) return current;
          return {
            ...current,
            phone: detail.phone ?? current.phone,
            ...(detail.billingAddress?.trim()
              ? { billingAddress: detail.billingAddress.trim() }
              : {}),
            ...(detail.shippingAddress?.trim()
              ? { shippingAddress: detail.shippingAddress.trim() }
              : {}),
            ...(detail.gstin?.trim() ? { gstin: detail.gstin.trim() } : {}),
            ...(detail.pan?.trim() ? { pan: detail.pan.trim().toUpperCase() } : {}),
            balance: detail.currentBalance,
          };
        });
      })
      .catch(() => {
        // Keep summary data from party picker.
      });
  };

  const handleFullyPaidToggle = (checked: boolean) => {
    patch({
      fullyPaid: checked,
      amountReceived: checked ? totals.totalAmount : form.amountReceived,
    });
  };

  const resetForNewInvoice = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    setSelectedParty(null);
    const fresh = createInitialInvoiceForm();
    if (orgId) {
      try {
        const next = await fetchNextInvoiceNumber(orgId);
        fresh.invoicePrefix = next.invoicePrefix;
        fresh.invoiceNumber = next.invoiceNumber;
      } catch {
        // Keep defaults.
      }
    }
    setForm(fresh);
  }, [activeOrganisationId]);

  const selectedBank = bankAccounts.find((b) => b.bankAccountId === form.bankAccountId) ?? null;
  const selectedBankLabel = selectedBank
    ? [selectedBank.bankName, maskBankAccountNumber(selectedBank.accountNumber)]
        .filter(Boolean)
        .join(" · ")
    : null;

  const livePreviewModel = useMemo(
    () =>
      buildLiveInvoicePreviewModel({
        form,
        party: selectedParty,
        businessName,
        organisation: resolvedOrganisationSnapshot,
        bankAccount: selectedBank,
        storedSettings: storedInvoiceSettings,
      }),
    [
      form,
      selectedParty,
      businessName,
      resolvedOrganisationSnapshot,
      selectedBank,
      storedInvoiceSettings,
    ],
  );

  const openDraftPreview = () => {
    setPreviewModel(livePreviewModel);
    setPreviewOpen(true);
  };

  const validateAndSave = async (saveAndNew: boolean) => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setError(t("dashboard.salesInvoices.create.noOrganisation"));
      return;
    }
    if (!selectedParty && !form.cashSaleDefault) {
      setError(t("dashboard.salesInvoices.create.validationParty"));
      return;
    }
    if (form.lineItems.length === 0) {
      setError(t("dashboard.salesInvoices.create.validationItems"));
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccessMessage(null);
    try {
      const invoice = await createSalesInvoice(
        orgId,
        mapCreateInvoiceFormToRequest(
          form,
          selectedParty?.name,
          selectedBank,
          storedInvoiceSettings,
        ),
      );
      if (saveAndNew) {
        setSaveSuccessMessage(t("dashboard.salesInvoices.create.savedSuccess"));
        await resetForNewInvoice();
      } else {
        router.push(`/dashboard/sales/invoices/${encodeURIComponent(invoice.invoiceId)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.salesInvoices.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/sales/invoices"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50"
            aria-label={t("common.back")}
          >
            <BackIcon />
          </Link>
          <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
            {t("dashboard.salesInvoices.createTitle")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={form.lineItems.length === 0}
            onClick={openDraftPreview}
            className="hidden h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            {t("dashboard.salesInvoices.create.previewInvoice")}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="relative inline-flex h-10 items-center gap-2 rounded-md border border-slate-200/90 bg-white px-3 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">{t("dashboard.salesInvoices.create.settings")}</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void validateAndSave(true)}
            className="hidden h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            {t("dashboard.salesInvoices.create.saveAndNew")}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void validateAndSave(false)}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.35)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? t("dashboard.salesInvoices.create.saving") : t("dashboard.salesInvoices.create.saveInvoice")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 lg:mx-6">
          {error}
        </div>
      )}
      {saveSuccessMessage && !error ? (
        <div className="mx-4 mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 lg:mx-6">
          {saveSuccessMessage}
        </div>
      ) : null}

      <div className="flex-1 p-4 lg:p-6">
        {/* Top section: Bill To + Invoice meta — 50/50 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <h2 className="mb-2 min-h-[20px] text-sm font-semibold text-brand-primary">
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
                    <p className="mt-1 text-xs text-brand-primary-muted">
                      {t("dashboard.salesInvoices.create.balance")}: {formatInr(selectedParty.balance)}
                    </p>
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
            <div className="flex min-h-[20px] items-center justify-end">
              <label className="flex items-center gap-2 text-xs text-brand-primary-mid">
                <input
                  type="checkbox"
                  checked={form.cashSaleDefault}
                  onChange={(e) => handleCashSaleToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm accent-brand-primary"
                />
                {t("dashboard.salesInvoices.create.cashSaleDefault")}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FieldCell label={t("dashboard.salesInvoices.create.invoicePrefix")}>
                <input
                  value={form.invoicePrefix}
                  onChange={(e) => patch({ invoicePrefix: e.target.value })}
                  className={inputSmClass}
                />
              </FieldCell>
              <FieldCell label={t("dashboard.salesInvoices.create.invoiceNumber")}>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => patch({ invoiceNumber: e.target.value })}
                  className={inputSmClass}
                />
              </FieldCell>
              <FieldCell label={t("dashboard.salesInvoices.create.salesDate")}>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => handleInvoiceDateChange(e.target.value)}
                  className={inputSmClass}
                />
              </FieldCell>
            </div>

            {form.showPaymentTerms && (
              <div className="relative rounded-md border border-slate-200/90 bg-slate-50/40 p-3">
                <button
                  type="button"
                  onClick={() => patch({ showPaymentTerms: false })}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-white"
                  aria-label={t("common.close")}
                >
                  ×
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <FieldCell
                    label={t("dashboard.salesInvoices.create.paymentTerms")}
                    className="min-w-0"
                  >
                    <div className={inputGroupClass}>
                      <input
                        type="number"
                        min={0}
                        value={form.paymentTermsDays}
                        onChange={(e) =>
                          handlePaymentTermsChange(Number(e.target.value) || 0)
                        }
                        className={inputGroupInnerClass}
                      />
                      <span className="flex shrink-0 items-center border-l border-slate-200/90 bg-slate-50/80 px-3 text-xs font-medium text-brand-primary-muted">
                        {t("dashboard.salesInvoices.create.days")}
                      </span>
                    </div>
                  </FieldCell>
                  <FieldCell
                    label={t("dashboard.salesInvoices.create.dueDate")}
                    className="min-w-0"
                  >
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => patch({ dueDate: e.target.value })}
                      className={inputSmClass}
                    />
                  </FieldCell>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
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
                      <div className="flex min-h-[140px] items-center justify-center gap-4 p-4">
                        <button
                          type="button"
                          onClick={() => setAddItemsOpen(true)}
                          className="flex flex-1 items-center justify-center rounded-md border border-dashed border-brand-primary/25 py-10 text-sm font-semibold text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]"
                        >
                          + {t("dashboard.salesInvoices.create.addItem")}
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-slate-200/90 bg-white px-4 text-sm font-medium text-brand-primary hover:bg-slate-50"
                        >
                          <BarcodeIcon />
                          {t("dashboard.salesInvoices.create.scanBarcode")}
                        </button>
                      </div>
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
                    return (
                      <tr key={line.id} className="border-b border-slate-50 hover:bg-blue-50/20">
                        <td className="align-top px-3 py-2 tabular-nums text-brand-primary-muted">{idx + 1}</td>
                        <td className="align-top px-3 py-2">
                          <p className="font-medium text-brand-primary">{line.name}</p>
                          {line.serialised && line.serialNumbers[0] ? (
                            <p className="mt-0.5 font-mono text-[11px] text-violet-700">
                              {line.serialNumbers[0]}
                            </p>
                          ) : (
                            <p className="text-[11px] text-brand-primary-muted">{line.unit}</p>
                          )}
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
                            (() => {
                              const maxQty = getMaxQtyForLine(line, form.lineItems);
                              return (
                                <div className={inputGroupClass}>
                                  <button
                                    type="button"
                                    disabled={line.qty <= 1}
                                    onClick={() => adjustLineQty(line.id, -1)}
                                    className="flex h-9 w-8 shrink-0 items-center justify-center border-r border-slate-200/90 text-base font-medium text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={t("dashboard.salesInvoices.create.decreaseQty")}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={maxQty > 0 ? maxQty : 1}
                                    value={line.qty}
                                    onChange={(e) =>
                                      updateLine(line.id, { qty: Number(e.target.value) || 1 })
                                    }
                                    className={`${inputGroupInnerClass} w-10 min-w-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                  />
                                  <button
                                    type="button"
                                    disabled={maxQty <= 0 || line.qty >= maxQty}
                                    onClick={() => adjustLineQty(line.id, 1)}
                                    className="flex h-9 w-8 shrink-0 items-center justify-center border-l border-slate-200/90 text-base font-medium text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={t("dashboard.salesInvoices.create.increaseQty")}
                                  >
                                    +
                                  </button>
                                </div>
                              );
                            })()
                          )}
                        </td>
                        <td className="align-top px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={invoiceLinePriceInputValue(
                              line.pricePerItem,
                              line.gstPercent,
                              salesTaxMode,
                            )}
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
                            aria-label={t("common.close")}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/50">
                  <td colSpan={6} className="px-3 py-2 text-xs font-bold uppercase text-brand-primary-muted">
                    {t("dashboard.salesInvoices.create.subtotal")}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-brand-primary">
                    {formatInr(totals.subtotal + totals.lineTax)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom section — 50/50 */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-4">
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
                className="block w-full text-left text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.salesInvoices.create.addNotes")}
              </button>
            )}

            {form.showTerms ? (
              <div>
                <label className="text-xs font-medium text-brand-primary-muted">
                  Terms and Conditions
                </label>
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
                className="block w-full text-left text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.salesInvoices.create.addTerms")}
              </button>
            )}

            {form.showBankAccount ? (
              <div className="rounded-md border border-slate-200/90 bg-slate-50/40 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-primary-muted">
                      {t("dashboard.createParty.bankName")}
                    </p>
                    <p className="font-semibold text-brand-primary">
                      {selectedBank?.bankName || selectedBank?.accountHolderName || "—"}
                    </p>
                    {selectedBank ? (
                      <p className="mt-1 text-xs text-brand-primary-mid">
                        {t("dashboard.salesInvoices.create.acc")}:{" "}
                        {maskBankAccountNumber(selectedBank.accountNumber)}
                        {selectedBank.ifscCode ? ` • IFSC: ${selectedBank.ifscCode}` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-brand-primary-mid">{selectedBankLabel ?? "—"}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBankModalOpen(true)}
                      className="text-xs font-semibold text-brand-primary hover:underline"
                    >
                      {t("dashboard.businessProfile.change")}
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ showBankAccount: false, bankAccountId: null })}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      {t("dashboard.createParty.removeBank")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBankModalOpen(true)}
                className="block w-full text-left text-sm font-semibold text-brand-primary hover:underline"
              >
                + {t("dashboard.salesInvoices.create.addBankAccount")}
              </button>
            )}

            <button
              type="button"
              className="block w-full text-left text-sm font-semibold text-brand-primary hover:underline"
            >
              + {t("dashboard.salesInvoices.create.addPaymentQr")}
            </button>
          </div>

          <div className="min-w-0">
            <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
              <div className="px-4 pt-3">
                {form.additionalCharges.length === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      patch({
                        additionalCharges: [
                          {
                            id: `ch-${Date.now()}`,
                            label: "",
                            amount: 0,
                            taxPercent: 0,
                          },
                        ],
                      })
                    }
                    className="text-sm font-semibold text-brand-primary hover:underline"
                  >
                    + {t("dashboard.salesInvoices.create.addAdditionalCharges")}
                  </button>
                ) : (
                  <div className="space-y-2 pb-1">
                    {form.additionalCharges.map((ch) => (
                      <div key={ch.id} className={inputGroupClass}>
                        <input
                          value={ch.label}
                          onChange={(e) =>
                            patch({
                              additionalCharges: form.additionalCharges.map((c) =>
                                c.id === ch.id ? { ...c, label: e.target.value } : c
                              ),
                            })
                          }
                          placeholder={t("dashboard.salesInvoices.create.chargePlaceholder")}
                          className={`${inputGroupInnerClass} px-3`}
                        />
                        <span className="flex shrink-0 items-center border-l border-slate-200/90 bg-slate-50/80 px-2 text-xs text-brand-primary-muted">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={ch.amount}
                          onChange={(e) =>
                            patch({
                              additionalCharges: form.additionalCharges.map((c) =>
                                c.id === ch.id ? { ...c, amount: Number(e.target.value) || 0 } : c
                              ),
                            })
                          }
                          className={`${inputGroupInnerClass} w-24 shrink-0 border-l border-slate-200/90`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 px-4">
                <TotalsRow
                  label={t("dashboard.salesInvoices.create.taxableAmount")}
                  value={formatInr(
                    form.discountTiming === "before_tax" && totals.discountAmount > 0
                      ? totals.subtotal + totals.additionalChargesTotal
                      : totals.taxableAmount,
                  )}
                />

                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="shrink-0 text-sm font-medium text-brand-primary">
                      + {t("dashboard.salesInvoices.create.addDiscount")}
                    </span>
                    <div className="h-9 w-[128px] shrink-0">
                      <ModernSelect
                        value={form.discountTiming}
                        onChange={(v) =>
                          patch({ discountTiming: v as "after_tax" | "before_tax" })
                        }
                        options={[
                          {
                            value: "after_tax",
                            label: t("dashboard.salesInvoices.create.discountAfterTax"),
                          },
                          {
                            value: "before_tax",
                            label: t("dashboard.salesInvoices.create.discountBeforeTax"),
                          },
                        ]}
                        variant="compact"
                        className="h-full w-full"
                      />
                    </div>
                    <div className={`${inputGroupClass} w-[148px] shrink-0`}>
                      <div className="h-full w-[52px] shrink-0">
                        <ModernSelect
                          value={form.discountType}
                          onChange={(v) => patch({ discountType: v as "percent" | "amount" })}
                          options={[
                            { value: "percent", label: "%" },
                            { value: "amount", label: "₹" },
                          ]}
                          variant="compact"
                          compactAttached
                          className="h-full w-full"
                        />
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={form.discountAfterTax}
                        onChange={(e) =>
                          patch({ discountAfterTax: Number(e.target.value) || 0 })
                        }
                        className={`${inputGroupInnerClass} border-l border-slate-200/90`}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-red-600">
                    {totals.discountAmount > 0 ? `- ${formatInr(totals.discountAmount)}` : formatInr(0)}
                  </span>
                </div>

                {form.discountTiming === "before_tax" && totals.discountAmount > 0 ? (
                  <TotalsRow
                    label={t("dashboard.salesInvoices.create.netTaxable")}
                    value={formatInr(totals.taxableAmount)}
                  />
                ) : null}

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

                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <label className="flex shrink-0 items-center gap-2 text-sm text-brand-primary-mid">
                      <input
                        type="checkbox"
                        checked={form.autoRoundOff}
                        onChange={(e) => patch({ autoRoundOff: e.target.checked })}
                        className="h-3.5 w-3.5 rounded-sm accent-brand-primary"
                      />
                      {t("dashboard.salesInvoices.create.autoRoundOff")}
                    </label>
                    <input
                      type="number"
                      value={form.roundOffAmount}
                      onChange={(e) => patch({ roundOffAmount: Number(e.target.value) || 0 })}
                      disabled={form.autoRoundOff}
                      className={`w-24 shrink-0 ${inputSmClass} tabular-nums disabled:bg-slate-50 disabled:opacity-60`}
                    />
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-primary">
                    {formatInr(totals.roundOff)}
                  </span>
                </div>

                <TotalsRow
                  label={t("dashboard.salesInvoices.create.totalAmount")}
                  value={formatInr(totals.totalAmount)}
                  bold
                />
              </div>

              <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-brand-primary">
                    {t("dashboard.salesInvoices.create.amountReceived")}
                  </span>
                  <label className="flex shrink-0 items-center gap-2 text-xs text-brand-primary-mid">
                    <input
                      type="checkbox"
                      checked={form.fullyPaid}
                      onChange={(e) => handleFullyPaidToggle(e.target.checked)}
                      className="h-3.5 w-3.5 rounded-sm accent-brand-primary"
                    />
                    {t("dashboard.salesInvoices.create.markFullyPaid")}
                  </label>
                </div>

                <div className={`${inputGroupClass} h-10`}>
                  <span className="flex shrink-0 items-center border-r border-slate-200/90 bg-slate-50/80 px-3 text-sm font-medium text-brand-primary-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.fullyPaid ? totals.totalAmount : form.amountReceived}
                    onChange={(e) =>
                      patch({ amountReceived: Number(e.target.value) || 0, fullyPaid: false })
                    }
                    disabled={form.fullyPaid}
                    className={`${inputGroupInnerClass} h-10 disabled:bg-slate-50 disabled:text-brand-primary-muted`}
                  />
                  <div className="h-full w-[108px] shrink-0">
                    <ModernSelect
                      value={form.paymentMode}
                      onChange={(v) => patch({ paymentMode: v })}
                      options={PAYMENT_MODES}
                      variant="compact"
                      compactAttached
                      alignMenu="end"
                      className="h-full w-full"
                    />
                  </div>
                </div>

                <TotalsRow
                  label={t("dashboard.salesInvoices.create.balanceAmount")}
                  value={formatInr(totals.balanceAmount)}
                  valueTone={totals.balanceAmount > 0 ? "balance-due" : "balance-clear"}
                />
              </div>
            </div>

            <p className="pt-3 text-right text-xs text-brand-primary-muted">
              {formatMessage(t("dashboard.salesInvoices.create.authorizedSignatory"), {
                business: businessName,
              })}
            </p>
          </div>
        </div>
      </div>

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
        onSave={(settings, invoiceMeta) => void handleInvoiceSettingsSave(settings, invoiceMeta)}
      />

      <SalesInvoicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        model={previewModel}
        storedSettings={storedInvoiceSettings}
        footer={
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
        }
      />

      <BankAccountModal
        open={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        organisationId={activeOrganisationId}
        accounts={bankAccounts}
        loading={bankAccountsLoading}
        onRefresh={loadBankAccounts}
        selectedId={form.bankAccountId}
        onSave={(id) => patch({ bankAccountId: id, showBankAccount: true })}
      />

      <PartySelectModal
        open={partyModalOpen}
        organisationId={activeOrganisationId}
        onClose={() => setPartyModalOpen(false)}
        onSelect={handlePartySelect}
      />
    </div>
  );
}

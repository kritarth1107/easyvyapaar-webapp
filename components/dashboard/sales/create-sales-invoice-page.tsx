"use client";

import { saveErrorMessage } from "@/lib/api/conflict";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { extractPanFromGstin } from "@/lib/parties/create-party-form";
import { fetchPartyDetail } from "@/lib/parties/parties-api-client";
import { lookupGstin } from "@/lib/gst/lookup-gst";
import { placeOfSupplyFromGstin } from "@/lib/gst/gst-state";
import { syncPartyFromGstLookup } from "@/lib/gst/sync-party-from-gst";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";
import { stateCodeToLabel } from "@/lib/constants/indian-state-codes";
import { maskBankAccountNumber } from "@/lib/parties/party-detail-utils";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import { SalesInvoiceLineCard } from "@/components/dashboard/sales/sales-invoice-line-card";
import {
  clampLineDiscount,
  lineGrossAmount,
} from "@/lib/sales/invoice-tax";
import {
  calcInvoiceTotals,
  counterSalePaymentPatch,
  enforceInvoiceTypeRules,
  enforceShopGstRules,
  isCounterSale,
  namedPartyCreditPatch,
  type SalesInvoiceDocumentType,
  capInvoiceLineQty,
  createInitialInvoiceForm,
  formatInr,
  getMaxQtyForLine,
  mergeInventoryPickIntoLines,
  PAYMENT_MODES,
  type CreateInvoiceFormState,
  type InvoiceLineItem,
} from "@/lib/sales/create-invoice-form";
import { isShopGstRegistered } from "@/lib/dashboard/shop-gst";
import {
  mapCreateInvoiceFormToRequest,
  mapInvoiceFormToUpdateRequest,
} from "@/lib/sales/map-create-invoice-request";
import {
  isSalesInvoiceEditable,
  mapSalesInvoiceDetailToFormState,
} from "@/lib/sales/map-sales-invoice-detail-to-form";
import { fetchInventoryItemDetail } from "@/lib/inventory/inventory-api-client";
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
import {
  buildLiveInvoicePreviewModel,
  localizeInvoiceSummaryRows,
} from "@/lib/sales/build-live-invoice-preview";
import { useInvoiceSummaryLabels } from "@/lib/sales/use-invoice-summary-labels";
import {
  formatGstinOrPanLine,
  organisationProfileToSnapshot,
  type InvoiceOrganisationSnapshot,
} from "@/lib/sales/invoice-preview-formatters";
import {
  createSalesInvoice,
  fetchNextInvoiceNumber,
  fetchSalesInvoiceDetail,
  updateSalesInvoice,
} from "@/lib/sales/sales-api-client";
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
  "h-9 w-full rounded-sm border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const textareaClass =
  "w-full rounded-sm border border-slate-200/90 bg-white px-3 py-2 text-sm text-brand-primary outline-none placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";
const inputGroupClass =
  "flex h-9 overflow-hidden rounded-sm border border-slate-200/90 bg-white focus-within:border-brand-orange-1/50 focus-within:ring-2 focus-within:ring-brand-orange-1/15";
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

export function CreateSalesInvoicePage({ editInvoiceId }: { editInvoiceId?: string } = {}) {
  const isEdit = Boolean(editInvoiceId);
  const { t } = useTranslation();
  const summaryLabels = useInvoiceSummaryLabels();
  const router = useRouter();
  const { activeOrganisation, activeOrganisationId } = useUserMe();
  const businessName = activeOrganisation?.name ?? "Your Business";
  const shopGstRegistered = isShopGstRegistered(activeOrganisation?.gstNumber);

  const [form, setFormRaw] = useState<CreateInvoiceFormState>(createInitialInvoiceForm);
  // Bill of Supply and new bills on a non-GST shop zero GST. Edits keep stored tax.
  const setForm = useCallback(
    (update: CreateInvoiceFormState | ((prev: CreateInvoiceFormState) => CreateInvoiceFormState)) =>
      setFormRaw((prev) => {
        const next = typeof update === "function" ? update(prev) : update;
        if (isEdit) return enforceInvoiceTypeRules(next);
        return enforceShopGstRules(next, shopGstRegistered);
      }),
    [isEdit, shopGstRegistered],
  );
  const [selectedParty, setSelectedParty] = useState<SelectedInvoiceParty | null>(() =>
    editInvoiceId
      ? null
      : {
          partyId: WALK_IN_PARTY_ID,
          name: t("dashboard.salesInvoices.create.cashWalkIn"),
          balance: 0,
          isCashSale: true,
        },
  );
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
  const [partyGstinInput, setPartyGstinInput] = useState("");
  const [partyGstinLoading, setPartyGstinLoading] = useState(false);
  const [partyGstVerified, setPartyGstVerified] = useState(false);
  const [orgGstScheme, setOrgGstScheme] = useState<"regular" | "composition" | null>(null);
  const compositionDefaultApplied = useRef(false);
  const [editLoading, setEditLoading] = useState(Boolean(editInvoiceId));
  const [editBlocked, setEditBlocked] = useState<string | null>(null);
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
      ...(activeOrganisation?.logo?.trim() ? { logoUrl: activeOrganisation.logo.trim() } : {}),
    }),
    [activeOrganisation?.gstNumber, activeOrganisation?.logo, activeOrganisation?.pan],
  );

  const resolvedOrganisationSnapshot =
    organisationSnapshot.businessAddress ||
    organisationSnapshot.businessPhone ||
    organisationSnapshot.placeOfSupply ||
    organisationSnapshot.logoUrl
      ? organisationSnapshot
      : fallbackOrganisationSnapshot;

  const patch = useCallback((partial: Partial<CreateInvoiceFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, [setForm]);

  const totals = useMemo(() => calcInvoiceTotals(form), [form]);
  const isWalkInBill = isCounterSale(
    form.partyId,
    form.cashSaleDefault,
    selectedParty?.isCashSale,
  );

  useEffect(() => {
    if (isEdit) return;
    setFormRaw((prev) => enforceShopGstRules(prev, shopGstRegistered));
  }, [isEdit, shopGstRegistered]);

  useEffect(() => {
    if (isEdit || !isWalkInBill) return;
    const next = counterSalePaymentPatch(totals.totalAmount);
    if (
      form.showPaymentTerms === false &&
      form.fullyPaid === true &&
      form.amountReceived === next.amountReceived &&
      form.paymentMode === "cash"
    ) {
      return;
    }
    patch(next);
  }, [
    form.amountReceived,
    form.fullyPaid,
    form.paymentMode,
    form.showPaymentTerms,
    isEdit,
    isWalkInBill,
    patch,
    totals.totalAmount,
  ]);

  const isGstInvoice = form.invoiceType === "gst_invoice";
  const isBillOfSupply = form.invoiceType === "bill_of_supply";
  const hasRealParty =
    selectedParty !== null &&
    selectedParty.partyId !== WALK_IN_PARTY_ID &&
    !selectedParty.isCashSale;
  const partyGstReady =
    Boolean(selectedParty?.gstin?.trim()) ||
    (partyGstinInput.trim() && isValidGstin(normalizeGstin(partyGstinInput)));
  const partyRequirementMet = isGstInvoice
    ? hasRealParty && partyGstReady
    : selectedParty !== null || form.cashSaleDefault;

  const canSave =
    !saving &&
    !editLoading &&
    !editBlocked &&
    !loadingMeta &&
    Boolean(activeOrganisationId) &&
    form.lineItems.length > 0 &&
    form.lineItems.every((line) => !line.serialised || line.serialNumbers.length === 1) &&
    partyRequirementMet;

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
        if (!cancelled) {
          setOrganisationSnapshot(organisationProfileToSnapshot(profile));
          setOrgGstScheme(profile.gstScheme ?? "regular");
        }
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

    if (editInvoiceId) {
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
  }, [activeOrganisationId, editInvoiceId, patch]);

  // Composition dealers cannot charge GST: start new invoices as Bill of Supply (own number series).
  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (editInvoiceId || !orgId || orgGstScheme !== "composition" || compositionDefaultApplied.current) return;
    compositionDefaultApplied.current = true;
    patch({ invoiceType: "bill_of_supply" });
    void fetchNextInvoiceNumber(orgId, "bill_of_supply")
      .then((next) => patch({ invoicePrefix: next.invoicePrefix, invoiceNumber: next.invoiceNumber }))
      .catch(() => undefined);
  }, [activeOrganisationId, editInvoiceId, orgGstScheme, patch]);

  // Edit: load the invoice (after settings, so its own theme/settings win) and its party.
  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!editInvoiceId || !orgId) return;
    let cancelled = false;
    setEditLoading(true);
    Promise.all([fetchSalesInvoiceDetail(orgId, editInvoiceId), fetchSalesInvoiceSettings(orgId).catch(() => null)])
      .then(async ([invoice, settings]) => {
        if (cancelled) return;
        if (!isSalesInvoiceEditable(invoice)) {
          setEditBlocked(t("dashboard.invoiceEdit.notEditable"));
        }
        const itemIds = [...new Set(invoice.lineItems.map((line) => line.itemId))];
        const details = await Promise.all(
          itemIds.map((itemId) =>
            fetchInventoryItemDetail(orgId, itemId)
              .then((detail) => [itemId, detail] as const)
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        const itemMap = new Map(details.filter((entry) => entry !== null));
        if (settings) setStoredInvoiceSettings(settings);
        setForm(mapSalesInvoiceDetailToFormState(invoice, itemMap, settings));
        if (invoice.partyGstin) setPartyGstinInput(invoice.partyGstin);
        if (invoice.isCashSale || !invoice.partyId) {
          setSelectedParty({
            partyId: WALK_IN_PARTY_ID,
            name: invoice.partyName,
            isCashSale: true,
          } as SelectedInvoiceParty);
        } else {
          const party = await fetchPartyDetail(orgId, invoice.partyId).catch(() => null);
          if (cancelled) return;
          setSelectedParty({
            partyId: invoice.partyId,
            name: party?.name ?? invoice.partyName,
            phone: party?.phone,
            ...(party?.billingAddress?.trim() ? { billingAddress: party.billingAddress.trim() } : {}),
            ...(party?.shippingAddress?.trim() ? { shippingAddress: party.shippingAddress.trim() } : {}),
            ...((party?.gstin ?? invoice.partyGstin)?.trim()
              ? { gstin: (party?.gstin ?? invoice.partyGstin)!.trim() }
              : {}),
            ...(party?.billingStateCode?.trim()
              ? {
                  billingStateCode: party.billingStateCode.trim(),
                  placeOfSupply: stateCodeToLabel(party.billingStateCode.trim()),
                }
              : {}),
            balance: party?.currentBalance,
          } as SelectedInvoiceParty);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("dashboard.invoiceEdit.loadError"));
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, editInvoiceId, setForm, t]);

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
        if (editInvoiceId) return; // edit load applies settings + the invoice's own theme
        setStoredInvoiceSettings(data);
        patch({ settings: storedSettingsToInvoiceSettings(data) });
      })
      .catch(() => {
        // Keep form defaults if settings API fails.
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganisationId, editInvoiceId, patch]);

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
        lineItems = mergeInventoryPickIntoLines(lineItems, pick, {
          applyItemGst: shopGstRegistered,
        });
      }
      if (lineItems === prev.lineItems) return prev;
      return { ...prev, lineItems };
    });
  };

  const clampInvoiceDiscountValue = (
    value: number,
    discountType: CreateInvoiceFormState["discountType"],
  ) => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (discountType === "percent") return Math.min(value, 100);
    return value;
  };

  const withClampedLineDiscount = (line: InvoiceLineItem): InvoiceLineItem => {
    const discount = clampLineDiscount(
      line.discount,
      line.discountType,
      lineGrossAmount(line.qty, line.pricePerItem),
    );
    return discount === line.discount ? line : { ...line, discount };
  };

  const updateLine = (id: string, partial: Partial<InvoiceLineItem>) => {
    setForm((prev) => {
      if ("qty" in partial) {
        const current = prev.lineItems.find((line) => line.id === id);
        if (current && !current.serialised) {
          const qty = capInvoiceLineQty(current, Number(partial.qty), prev.lineItems);
          if (qty <= 0) {
            return { ...prev, lineItems: prev.lineItems.filter((line) => line.id !== id) };
          }
          partial = { ...partial, qty };
        } else if (current?.serialised) {
          const { qty: _ignoredQty, ...rest } = partial;
          partial = rest;
        }
      }
      return {
        ...prev,
        lineItems: prev.lineItems.map((line) => {
          if (line.id !== id) return line;
          return withClampedLineDiscount({ ...line, ...partial });
        }),
      };
    });
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

  const handleInvoiceTypeChange = (invoiceType: SalesInvoiceDocumentType) => {
    // Bill of Supply runs its own number series; refresh the suggested number when crossing it.
    const orgIdForNumber = activeOrganisationId?.trim();
    if (orgIdForNumber && (invoiceType === "bill_of_supply") !== (form.invoiceType === "bill_of_supply")) {
      void fetchNextInvoiceNumber(orgIdForNumber, invoiceType)
        .then((next) => patch({ invoicePrefix: next.invoicePrefix, invoiceNumber: next.invoiceNumber }))
        .catch(() => undefined);
    }
    if (invoiceType === "gst_invoice") {
      const walkInSelected =
        selectedParty?.isCashSale || selectedParty?.partyId === WALK_IN_PARTY_ID;
      if (walkInSelected) {
        setSelectedParty(null);
        patch({
          invoiceType,
          cashSaleDefault: false,
          partyId: null,
          ...namedPartyCreditPatch(form.invoiceDate, form.paymentTermsDays),
        });
      } else {
        patch({
          invoiceType,
          cashSaleDefault: false,
          partyId: selectedParty?.partyId ?? null,
          ...namedPartyCreditPatch(form.invoiceDate, form.paymentTermsDays),
        });
      }
      setPartyGstinInput("");
      setPartyGstVerified(false);
      return;
    }

    patch({ invoiceType, cashSaleDefault: form.cashSaleDefault });
    setPartyGstinInput("");
    setPartyGstVerified(false);
  };

  const handlePartyGstVerify = async () => {
    const orgId = activeOrganisationId?.trim();
    const gstin = normalizeGstin(partyGstinInput);
    if (!isValidGstin(gstin)) {
      setError(t("dashboard.salesInvoices.create.gstinInvalid"));
      return;
    }
    if (!orgId || !selectedParty) {
      setError(t("dashboard.salesInvoices.create.validationGstPartyRequired"));
      return;
    }

    setPartyGstinLoading(true);
    setError(null);
    try {
      const data = await lookupGstin(gstin);
      const verifiedGstin = data.gstin?.trim().toUpperCase() || gstin;
      const { selected } = await syncPartyFromGstLookup(
        orgId,
        selectedParty.partyId,
        data,
        verifiedGstin,
      );
      setPartyGstinInput(verifiedGstin);
      setPartyGstVerified(true);
      setSelectedParty(selected);
    } catch (err) {
      setPartyGstVerified(false);
      setError(err instanceof Error ? err.message : t("dashboard.createParty.gstLookupError"));
    } finally {
      setPartyGstinLoading(false);
    }
  };

  const handleCashSaleToggle = (checked: boolean) => {
    if (isGstInvoice) return;
    if (checked) {
      const walkIn: SelectedInvoiceParty = {
        partyId: WALK_IN_PARTY_ID,
        name: t("dashboard.salesInvoices.create.cashWalkIn"),
        balance: 0,
        isCashSale: true,
      };
      setSelectedParty(walkIn);
      patch({
        partyId: WALK_IN_PARTY_ID,
        cashSaleDefault: true,
        ...counterSalePaymentPatch(totals.totalAmount),
      });
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
    setPartyGstinInput("");
    setPartyGstVerified(false);
    const walkIn = Boolean(party.isCashSale) || party.partyId === WALK_IN_PARTY_ID;
    patch({
      partyId: party.partyId,
      cashSaleDefault: isGstInvoice ? false : walkIn,
      ...(isGstInvoice || !walkIn
        ? namedPartyCreditPatch(form.invoiceDate, form.paymentTermsDays)
        : counterSalePaymentPatch(totals.totalAmount)),
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
            ...(detail.billingStateCode?.trim()
              ? {
                  billingStateCode: detail.billingStateCode.trim(),
                  placeOfSupply: stateCodeToLabel(detail.billingStateCode.trim()),
                }
              : detail.gstin?.trim()
                ? { placeOfSupply: placeOfSupplyFromGstin(detail.gstin.trim()) }
                : {}),
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
    const fresh = { ...createInitialInvoiceForm(), invoiceType: form.invoiceType };
    if (orgId) {
      try {
        const next = await fetchNextInvoiceNumber(orgId, form.invoiceType);
        fresh.invoicePrefix = next.invoicePrefix;
        fresh.invoiceNumber = next.invoiceNumber;
      } catch {
        // Keep defaults.
      }
    }
    setForm(fresh);
  }, [activeOrganisationId, form.invoiceType, setForm]);

  const selectedBank = bankAccounts.find((b) => b.bankAccountId === form.bankAccountId) ?? null;
  const selectedBankLabel = selectedBank
    ? [selectedBank.bankName, maskBankAccountNumber(selectedBank.accountNumber)]
        .filter(Boolean)
        .join(" · ")
    : null;

  const previewParty: SelectedInvoiceParty | null = useMemo(() => {
    if (!selectedParty) return null;
    if (form.invoiceType !== "gst_invoice") return selectedParty;
    if (selectedParty.gstin?.trim()) return selectedParty;
    const gstin = partyGstinInput.trim();
    if (!gstin) return selectedParty;
    const normalizedGstin = normalizeGstin(gstin);
    const pan = extractPanFromGstin(normalizedGstin);
    return {
      ...selectedParty,
      gstin: normalizedGstin,
      placeOfSupply: placeOfSupplyFromGstin(normalizedGstin),
      ...(pan ? { pan } : {}),
    };
  }, [selectedParty, form.invoiceType, partyGstinInput]);

  const livePreviewModel = useMemo(
    () =>
      localizeInvoiceSummaryRows(
        buildLiveInvoicePreviewModel({
          form,
          party: previewParty,
          businessName,
          organisation: resolvedOrganisationSnapshot,
          bankAccount: selectedBank,
          storedSettings: storedInvoiceSettings,
        }),
        summaryLabels,
      ),
    [
      summaryLabels,
      form,
      previewParty,
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
    if (isGstInvoice) {
      if (!hasRealParty) {
        setError(t("dashboard.salesInvoices.create.validationGstPartyRequired"));
        return;
      }
      if (!partyGstReady) {
        setError(t("dashboard.salesInvoices.create.validationPartyGstRequired"));
        return;
      }
    } else if (!selectedParty && !form.cashSaleDefault) {
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
      if (editInvoiceId) {
        const updated = await updateSalesInvoice(
          orgId,
          editInvoiceId,
          mapInvoiceFormToUpdateRequest(form, selectedParty?.name, selectedBank, storedInvoiceSettings, {
            partyGstin: selectedParty?.gstin?.trim() || (isGstInvoice ? partyGstinInput : undefined),
          }),
        );
        router.push(`/dashboard/sales/invoices/${encodeURIComponent(updated.invoiceId)}`);
        return;
      }
      const invoice = await createSalesInvoice(
        orgId,
        mapCreateInvoiceFormToRequest(
          form,
          selectedParty?.name,
          selectedBank,
          storedInvoiceSettings,
          {
            partyGstin:
              selectedParty?.gstin?.trim() ||
              (isGstInvoice ? partyGstinInput : undefined),
          },
        ),
      );
      if (saveAndNew) {
        setSaveSuccessMessage(t("dashboard.salesInvoices.create.savedSuccess"));
        await resetForNewInvoice();
      } else {
        router.push(`/dashboard/sales/invoices/${encodeURIComponent(invoice.invoiceId)}`);
      }
    } catch (err) {
      setError(saveErrorMessage(err, t, t("dashboard.salesInvoices.create.saveError")));
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-200/90 text-brand-primary transition-colors hover:bg-slate-50"
            aria-label={t("common.back")}
          >
            <BackIcon />
          </Link>
          <h1 className="truncate text-lg font-bold text-brand-primary lg:text-xl">
            {isEdit
              ? t("dashboard.invoiceEdit.title").replace("{number}", `${form.invoicePrefix}${form.invoiceNumber}`)
              : t("dashboard.salesInvoices.createTitle")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="hidden items-center rounded-md border border-slate-200/90 p-0.5 text-xs font-semibold sm:flex"
            role="group"
            aria-label="Invoice type"
            hidden={isEdit}
          >
            <button
              type="button"
              onClick={() => handleInvoiceTypeChange("cash_memo")}
              className={`rounded px-3 py-1.5 transition-colors ${
                form.invoiceType === "cash_memo"
                  ? "bg-brand-primary text-white"
                  : "text-brand-primary hover:bg-slate-50"
              }`}
              aria-pressed={form.invoiceType === "cash_memo"}
            >
              {t("dashboard.salesInvoices.create.invoiceTypeCashMemo")}
            </button>
            {shopGstRegistered || form.invoiceType === "gst_invoice" ? (
            <button
              type="button"
              onClick={() => handleInvoiceTypeChange("gst_invoice")}
              className={`rounded px-3 py-1.5 transition-colors ${
                form.invoiceType === "gst_invoice"
                  ? "bg-brand-primary text-white"
                  : "text-brand-primary hover:bg-slate-50"
              }`}
              aria-pressed={form.invoiceType === "gst_invoice"}
            >
              {t("dashboard.salesInvoices.create.invoiceTypeGstInvoice")}
            </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleInvoiceTypeChange("bill_of_supply")}
              title={t("dashboard.billOfSupply.hint")}
              className={`rounded px-3 py-1.5 transition-colors ${
                form.invoiceType === "bill_of_supply"
                  ? "bg-brand-primary text-white"
                  : "text-brand-primary hover:bg-slate-50"
              }`}
              aria-pressed={form.invoiceType === "bill_of_supply"}
            >
              {t("dashboard.billOfSupply.label")}
            </button>
          </div>
          <button
            type="button"
            disabled={form.lineItems.length === 0}
            onClick={openDraftPreview}
            className="hidden h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            {t("dashboard.salesInvoices.create.previewInvoice")}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="relative inline-flex h-10 items-center gap-2 rounded-sm border border-slate-200/90 bg-white px-3 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">{t("dashboard.salesInvoices.create.settings")}</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void validateAndSave(true)}
            hidden={isEdit}
            className="hidden h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
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

      {editBlocked ? (
        <div className="mx-4 mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 lg:mx-6">
          {editBlocked}
        </div>
      ) : null}
      {error && (
        <div className="mx-4 mt-3 rounded-sm border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 lg:mx-6">
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
                    {isGstInvoice && selectedParty.gstin?.trim() ? (
                      <p className="mt-1 text-xs font-medium text-brand-primary">
                        GSTIN: {selectedParty.gstin.trim()}
                      </p>
                    ) : null}
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

            {isGstInvoice &&
            hasRealParty &&
            !selectedParty?.gstin?.trim() ? (
              <div className="mt-3 rounded-md border border-amber-200/90 bg-amber-50/80 px-3 py-3">
                <p className="text-xs font-semibold text-amber-900">
                  {t("dashboard.salesInvoices.create.partyGstRequired")}
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={partyGstinInput}
                    onChange={(e) => {
                      setPartyGstinInput(e.target.value.toUpperCase());
                      setPartyGstVerified(false);
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    className="h-9 min-w-0 flex-1 rounded-sm border border-slate-200/90 bg-white px-2.5 font-mono text-sm uppercase text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
                  />
                  <button
                    type="button"
                    disabled={
                      partyGstinLoading ||
                      !partyGstinInput.trim() ||
                      !isValidGstin(normalizeGstin(partyGstinInput))
                    }
                    onClick={() => void handlePartyGstVerify()}
                    className="h-9 shrink-0 rounded-md border border-brand-primary/20 bg-brand-primary/[0.04] px-3 text-xs font-semibold text-brand-primary hover:bg-brand-primary/[0.08] disabled:opacity-60"
                  >
                    {partyGstinLoading
                      ? t("common.pleaseWait")
                      : t("dashboard.salesInvoices.create.verifyGst")}
                  </button>
                </div>
                {partyGstVerified ? (
                  <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                    {t("dashboard.salesInvoices.create.gstVerified")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex min-h-[20px] items-center justify-end">
              <label className="flex items-center gap-2 text-xs text-brand-primary-mid">
                <input
                  type="checkbox"
                  checked={isGstInvoice ? false : form.cashSaleDefault}
                  disabled={isGstInvoice}
                  onChange={(e) => handleCashSaleToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm accent-brand-primary disabled:opacity-50"
                />
                {t("dashboard.salesInvoices.create.cashSaleDefault")}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FieldCell label={t("dashboard.salesInvoices.create.invoicePrefix")}>
                <input
                  value={form.invoicePrefix}
                  onChange={(e) => patch({ invoicePrefix: e.target.value })}
                  disabled={isEdit}
                  className={inputSmClass}
                />
              </FieldCell>
              <FieldCell label={t("dashboard.salesInvoices.create.invoiceNumber")}>
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => patch({ invoiceNumber: e.target.value })}
                  disabled={isEdit}
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

        {/* Items */}
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
          {form.lineItems.length === 0 ? (
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
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-medium text-brand-primary hover:bg-slate-50"
              >
                <BarcodeIcon />
                {t("dashboard.salesInvoices.create.scanBarcode")}
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {form.lineItems.map((line) => (
                <SalesInvoiceLineCard
                  key={line.id}
                  line={line}
                  maxQty={getMaxQtyForLine(line, form.lineItems)}
                  onChange={(patch) => updateLine(line.id, patch)}
                  onRemove={() => removeLine(line.id)}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-3 py-2">
            <p className="text-xs font-bold uppercase text-brand-primary-muted">
              {t("dashboard.salesInvoices.create.subtotal")}
            </p>
            <p className="text-right font-bold tabular-nums text-brand-primary">
              {formatInr(totals.subtotal + totals.lineTax)}
            </p>
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
            <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
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
                          onChange={(v) => {
                            const discountType = v as "percent" | "amount";
                            patch({
                              discountType,
                              discountAfterTax: clampInvoiceDiscountValue(
                                form.discountAfterTax,
                                discountType,
                              ),
                            });
                          }}
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
                        max={form.discountType === "percent" ? 100 : undefined}
                        step="0.01"
                        value={form.discountAfterTax}
                        onChange={(e) =>
                          patch({
                            discountAfterTax: clampInvoiceDiscountValue(
                              Number(e.target.value) || 0,
                              form.discountType,
                            ),
                          })
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

                {(isBillOfSupply ? [] : totals.gstSplit).map((row) => (
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
                      disabled={isEdit}
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
                    disabled={form.fullyPaid || isEdit}
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
        organisation={resolvedOrganisationSnapshot}
        footer={
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
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
        hideWalkIn={isGstInvoice}
      />
    </div>
  );
}

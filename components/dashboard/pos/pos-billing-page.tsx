"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  PartySelectModal,
  type SelectedInvoiceParty,
} from "@/components/dashboard/sales/party-select-modal";
import { SalesInvoicePreviewModal } from "@/components/dashboard/sales/sales-invoice-preview-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchInventoryCategories, fetchInventoryItems } from "@/lib/inventory/inventory-api-client";
import { fetchBusinessProfile } from "@/lib/business/business-profile-api-client";
import { buildLiveInvoicePreviewModel } from "@/lib/sales/build-live-invoice-preview";
import { organisationProfileToSnapshot } from "@/lib/sales/invoice-preview-formatters";
import {
  calcInvoiceTotals,
  calcLineItem,
  clampInvoiceLineQty,
  formatInr,
  lineItemFromInventory,
  lineItemFromSerial,
  PAYMENT_MODES,
} from "@/lib/sales/create-invoice-form";
import { mapCreateInvoiceFormToRequest } from "@/lib/sales/map-create-invoice-request";
import {
  DEFAULT_STORED_SALES_INVOICE_SETTINGS,
  type StoredSalesInvoiceSettings,
} from "@/lib/sales/invoice-settings-config";
import { posPrinterToTheme } from "@/lib/pos/pos-settings";
import {
  applyPosSettingsToBill,
  createPosBill,
  getCustomerLabel,
  patchBillForm,
  updateBillLineItems,
  type PosBillTab,
} from "@/lib/pos/pos-bill";
import {
  DEFAULT_POS_SETTINGS,
  loadPosSettings,
  savePosSettings,
  type PosSettings,
} from "@/lib/pos/pos-settings";
import { createSalesInvoice, fetchNextInvoiceNumber } from "@/lib/sales/sales-api-client";
import {
  expandPosSearchRows,
  inventoryItemIsBillable,
  posSearchRowKey,
  type PosSearchRow,
} from "@/lib/pos/pos-search-rows";
import type { InventoryItem } from "@/lib/types/inventory-ui";
import type { LiveInvoicePreviewModel } from "@/lib/sales/invoice-preview-document-types";
import { useTranslation } from "@/lib/localization";
import { PosChargeModal } from "./pos-charge-modal";
import { PosDiscountModal } from "./pos-discount-modal";
import { PosLineEditModal, type PosLineEditField } from "./pos-line-edit-modal";
import { PosSettingsModal } from "./pos-settings-modal";
import { ShortcutBadge } from "./shortcut-badge";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function EmptyItemsIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="mx-auto h-16 w-16 text-slate-300" aria-hidden>
      <rect x="12" y="20" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20V16a12 12 0 0124 0v4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 28h40" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PosBillingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId, activeOrganisation } = useUserMe();

  const [posSettings, setPosSettings] = useState<PosSettings>(DEFAULT_POS_SETTINGS);
  const [bills, setBills] = useState<PosBillTab[]>([]);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [searchItems, setSearchItems] = useState<InventoryItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: "all", label: "All" },
  ]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [lineEditOpen, setLineEditOpen] = useState(false);
  const [lineEditField, setLineEditField] = useState<PosLineEditField>("price");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<LiveInvoicePreviewModel | null>(null);
  const [storedInvoiceSettings] = useState<StoredSalesInvoiceSettings>({
    ...DEFAULT_STORED_SALES_INVOICE_SETTINGS,
    themeId: "gst-advance-a4",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [itemSkuById, setItemSkuById] = useState<Record<string, string>>({});

  const searchRef = useRef<HTMLInputElement>(null);
  const receivedRef = useRef<HTMLInputElement>(null);

  const activeBill = useMemo(
    () => bills.find((b) => b.id === activeBillId) ?? bills[0] ?? null,
    [bills, activeBillId],
  );

  const totals = useMemo(
    () => (activeBill ? calcInvoiceTotals(activeBill.form) : null),
    [activeBill],
  );

  const selectedLine = useMemo(() => {
    if (!activeBill?.selectedLineId) return null;
    return activeBill.form.lineItems.find((l) => l.id === activeBill.selectedLineId) ?? null;
  }, [activeBill]);

  const searchRows = useMemo(
    () => expandPosSearchRows(searchItems, activeBill?.form.lineItems ?? []),
    [searchItems, activeBill?.form.lineItems],
  );

  useEffect(() => {
    if (searchHighlight >= searchRows.length) {
      setSearchHighlight(Math.max(0, searchRows.length - 1));
    }
  }, [searchRows.length, searchHighlight]);

  const anyModalOpen =
    settingsOpen || discountOpen || chargeOpen || partyOpen || lineEditOpen || previewOpen;

  const updateActiveBill = useCallback((updater: (bill: PosBillTab) => PosBillTab) => {
    setBills((prev) =>
      prev.map((bill) => (bill.id === activeBillId ? updater(bill) : bill)),
    );
  }, [activeBillId]);

  const initBillWithNumber = useCallback(
    async (index: number, settings: PosSettings) => {
      const bill = createPosBill(index, settings);
      const orgId = activeOrganisationId?.trim();
      if (orgId) {
        try {
          const next = await fetchNextInvoiceNumber(orgId);
          bill.form.invoicePrefix = next.invoicePrefix;
          bill.form.invoiceNumber = next.invoiceNumber;
        } catch {
          // Keep defaults.
        }
      }
      return bill;
    },
    [activeOrganisationId],
  );

  useEffect(() => {
    const settings = loadPosSettings();
    setPosSettings(settings);
    void initBillWithNumber(1, settings).then((bill) => {
      setBills([bill]);
      setActiveBillId(bill.id);
      setInitialized(true);
    });
  }, [initBillWithNumber]);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    void fetchInventoryCategories(orgId)
      .then((list) => {
        setCategories([
          { value: "all", label: t("dashboard.pos.allCategories") },
          ...list.map((c) => ({ value: c.categoryId, label: c.name })),
        ]);
      })
      .catch(() => {
        // Keep default.
      });
  }, [activeOrganisationId, t]);

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    const q = searchQuery.trim();
    if (!orgId || q.length < 1) {
      setSearchItems([]);
      setSearchOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      void fetchInventoryItems(orgId, {
        search: q,
        ...(searchCategory !== "all" ? { categoryId: searchCategory } : {}),
        limit: 20,
        page: 1,
      })
        .then((res) => {
          setSearchItems(res.tableItems.filter(inventoryItemIsBillable));
          setSearchOpen(true);
          setSearchHighlight(0);
        })
        .catch(() => setSearchItems([]))
        .finally(() => setSearchLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeOrganisationId, searchQuery, searchCategory]);

  const addSearchRowToBill = useCallback(
    (row: PosSearchRow) => {
      if (!activeBill) return;
      const lineItems = activeBill.form.lineItems;
      const item = row.item;
      let nextLines = lineItems;
      let newLineId: string | null = null;

      if (row.type === "serial") {
        const line = lineItemFromSerial(item, lineItems, row.serialNumber);
        if (!line) return;
        nextLines = [...lineItems, line];
        newLineId = line.id;
      } else {
        const existing = lineItems.find((l) => l.itemId === item.id && !l.serialised);
        if (existing) {
          const qty = clampInvoiceLineQty(existing, existing.qty + 1, lineItems);
          nextLines = lineItems.map((l) => (l.id === existing.id ? { ...l, qty } : l));
          newLineId = existing.id;
        } else {
          const line = lineItemFromInventory(item, lineItems);
          if (!line) return;
          nextLines = [...lineItems, line];
          newLineId = line.id;
        }
      }

      updateActiveBill((bill) =>
        updateBillLineItems(bill, nextLines, newLineId ?? bill.selectedLineId),
      );
      if (item.sku) {
        setItemSkuById((prev) => ({ ...prev, [item.id]: item.sku }));
      }
      setSearchQuery("");
      setSearchOpen(false);
      setSearchHighlight(0);
      searchRef.current?.focus();
    },
    [activeBill, updateActiveBill],
  );

  const handleSearchEnter = useCallback(() => {
    if (searchRows.length > 0) {
      addSearchRowToBill(searchRows[searchHighlight] ?? searchRows[0]);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const exactSerial = searchItems.flatMap((item) =>
      (item.availableSerials ?? []).map((serial) => ({ item, serial })),
    ).find(({ serial }) => serial.toLowerCase() === q);
    if (exactSerial) {
      addSearchRowToBill({ type: "serial", item: exactSerial.item, serialNumber: exactSerial.serial });
    }
  }, [searchRows, searchHighlight, searchQuery, searchItems, addSearchRowToBill]);

  const holdAndCreateBill = useCallback(async () => {
    const settings = posSettings;
    const nextIndex = bills.length + 1;
    const newBill = await initBillWithNumber(nextIndex, settings);
    setBills((prev) => [...prev, newBill]);
    setActiveBillId(newBill.id);
    setSearchQuery("");
    setError(null);
    setSuccess(null);
    searchRef.current?.focus();
  }, [bills.length, initBillWithNumber, posSettings]);

  const closeBillTab = useCallback(
    (billId: string) => {
      if (bills.length <= 1) return;
      const nextBills = bills.filter((b) => b.id !== billId);
      setBills(nextBills);
      if (activeBillId === billId) {
        setActiveBillId(nextBills[0]?.id ?? null);
      }
    },
    [bills, activeBillId],
  );

  const clearAllItems = useCallback(() => {
    updateActiveBill((bill) => updateBillLineItems(bill, [], null));
  }, [updateActiveBill]);

  const deleteSelectedLine = useCallback(() => {
    if (!activeBill?.selectedLineId) return;
    const next = activeBill.form.lineItems.filter((l) => l.id !== activeBill.selectedLineId);
    updateActiveBill((bill) => updateBillLineItems(bill, next, next[0]?.id ?? null));
  }, [activeBill, updateActiveBill]);

  const moveSelection = useCallback(
    (delta: number) => {
      if (!activeBill || activeBill.form.lineItems.length === 0) return;
      const lines = activeBill.form.lineItems;
      const currentIndex = activeBill.selectedLineId
        ? lines.findIndex((l) => l.id === activeBill.selectedLineId)
        : -1;
      const nextIndex = Math.min(
        lines.length - 1,
        Math.max(0, currentIndex < 0 ? (delta > 0 ? 0 : lines.length - 1) : currentIndex + delta),
      );
      updateActiveBill((bill) => ({ ...bill, selectedLineId: lines[nextIndex].id }));
    },
    [activeBill, updateActiveBill],
  );

  const openLineEdit = useCallback(
    (field: PosLineEditField) => {
      if (!selectedLine) return;
      setLineEditField(field);
      setLineEditOpen(true);
    },
    [selectedLine],
  );

  const handleSaveBill = useCallback(
    async (withPrint: boolean) => {
      const orgId = activeOrganisationId?.trim();
      if (!orgId || !activeBill) {
        setError(t("dashboard.salesInvoices.create.noOrganisation"));
        return;
      }
      if (activeBill.form.lineItems.length === 0) {
        setError(t("dashboard.salesInvoices.create.validationItems"));
        return;
      }
      if (!activeBill.party && !activeBill.form.cashSaleDefault) {
        setError(t("dashboard.salesInvoices.create.validationParty"));
        return;
      }

      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const invoice = await createSalesInvoice(
          orgId,
          mapCreateInvoiceFormToRequest(
            activeBill.form,
            activeBill.party?.name,
            null,
            { ...storedInvoiceSettings, themeId: posPrinterToTheme(posSettings.printerType) },
          ),
        );

        if (withPrint) {
          let orgSnapshot = {
            businessAddress: "",
            businessPhone: "",
            businessTaxLine: "",
            placeOfSupply: "",
          };
          try {
            const profile = await fetchBusinessProfile(orgId);
            orgSnapshot = organisationProfileToSnapshot(profile);
          } catch {
            // Preview still works with minimal header data.
          }
          const model = buildLiveInvoicePreviewModel({
            form: activeBill.form,
            party: activeBill.party,
            businessName: activeOrganisation?.name ?? "",
            organisation: orgSnapshot,
            bankAccount: null,
            storedSettings: {
              ...storedInvoiceSettings,
              themeId: posPrinterToTheme(posSettings.printerType),
            },
          });
          setPreviewModel(model);
          setPreviewOpen(true);
        }

        setSuccess(t("dashboard.pos.savedSuccess"));
        const freshBill = await initBillWithNumber(
          bills.findIndex((b) => b.id === activeBill.id) + 1,
          posSettings,
        );
        setBills((prev) => prev.map((b) => (b.id === activeBill.id ? freshBill : b)));
        setActiveBillId(freshBill.id);
        setSearchQuery("");
        searchRef.current?.focus();

        if (!withPrint) {
          router.push(`/dashboard/sales/invoices/${encodeURIComponent(invoice.invoiceId)}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.salesInvoices.create.saveError"));
      } finally {
        setSaving(false);
      }
    },
    [
      activeBill,
      activeOrganisationId,
      activeOrganisation?.name,
      bills,
      initBillWithNumber,
      posSettings,
      router,
      storedInvoiceSettings,
      t,
    ],
  );

  useEffect(() => {
    if (!initialized) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);
      const modalOpen = anyModalOpen;

      if (event.ctrlKey && event.key === "Escape") {
        event.preventDefault();
        router.push("/dashboard");
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setSettingsOpen(true);
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        void holdAndCreateBill();
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        router.push("/dashboard/inventory/items/new");
        return;
      }

      if (event.ctrlKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        clearAllItems();
        return;
      }

      if (event.ctrlKey && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (bills[index]) setActiveBillId(bills[index].id);
        return;
      }

      if (modalOpen) return;

      if (event.key === "F1") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === "F2") {
        event.preventDefault();
        setDiscountOpen(true);
        return;
      }

      if (event.key === "F3") {
        event.preventDefault();
        setChargeOpen(true);
        return;
      }

      if (event.key === "F4") {
        event.preventDefault();
        receivedRef.current?.focus();
        return;
      }

      if (event.key === "F5") {
        event.preventDefault();
        if (!posSettings.hideCustomer) setPartyOpen(true);
        return;
      }

      if (event.key === "F6") {
        event.preventDefault();
        void handleSaveBill(true);
        return;
      }

      if (event.key === "F7") {
        event.preventDefault();
        void handleSaveBill(false);
        return;
      }

      const searchFocused = document.activeElement === searchRef.current;
      if (searchFocused) {
        if (event.key === "ArrowDown" && searchRows.length > 0) {
          event.preventDefault();
          setSearchOpen(true);
          setSearchHighlight((h) => Math.min(searchRows.length - 1, h + 1));
          return;
        }
        if (event.key === "ArrowUp" && searchRows.length > 0) {
          event.preventDefault();
          setSearchOpen(true);
          setSearchHighlight((h) => Math.max(0, h - 1));
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          handleSearchEnter();
          return;
        }
      }

      if (typing) return;

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        openLineEdit("price");
        return;
      }

      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        openLineEdit("qty");
        return;
      }

      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        if (event.shiftKey) {
          setDiscountOpen(true);
        } else {
          openLineEdit("discount");
        }
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        deleteSelectedLine();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    initialized,
    anyModalOpen,
    bills,
    searchRows,
    searchHighlight,
    router,
    holdAndCreateBill,
    clearAllItems,
    handleSaveBill,
    openLineEdit,
    deleteSelectedLine,
    moveSelection,
    handleSearchEnter,
  ]);

  useEffect(() => {
    if (!initialized) return;
    searchRef.current?.focus();
  }, [initialized, activeBillId]);

  if (!initialized || !activeBill || !totals) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  const toolbarBtn =
    "inline-flex h-9 items-center rounded-sm border border-slate-200/90 bg-white px-3 text-xs font-semibold text-brand-primary hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-brand-primary">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center rounded-sm border border-slate-200/90 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-slate-50"
        >
          {t("dashboard.pos.exit")}
          <ShortcutBadge keys="CTRL + ESC" />
        </button>
        <h1 className="text-lg font-bold">{t("dashboard.pos.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center rounded-sm border border-slate-200/90 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.pos.settings")}
            <ShortcutBadge keys="CTRL + S" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white px-4 py-2">
        {bills.map((bill, index) => (
          <div key={bill.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveBillId(bill.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${
                bill.id === activeBillId
                  ? "border-brand-orange-1/40 bg-brand-orange-1/10 text-brand-orange-1"
                  : "border-slate-200/90 bg-white text-brand-primary hover:bg-slate-50"
              }`}
            >
              {bill.title}
              {index < 9 ? <ShortcutBadge keys={`CTRL + ${index + 1}`} /> : null}
            </button>
            {bills.length > 1 ? (
              <button
                type="button"
                onClick={() => closeBillTab(bill.id)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded text-brand-primary-muted hover:bg-slate-100"
                aria-label={t("common.close")}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => void holdAndCreateBill()}
          className="inline-flex h-9 items-center rounded-md border border-dashed border-slate-300 px-3 text-xs font-semibold text-brand-primary hover:bg-slate-50"
        >
          {t("dashboard.pos.holdAndNew")}
          <ShortcutBadge keys="CTRL + B" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200/90 bg-white px-4 py-2">
        <button type="button" className={toolbarBtn} onClick={() => router.push("/dashboard/inventory/items/new")}>
          {t("dashboard.pos.newItem")}
          <ShortcutBadge keys="CTRL + I" />
        </button>
        <button type="button" className={toolbarBtn} disabled={!selectedLine} onClick={() => openLineEdit("price")}>
          {t("dashboard.pos.changePrice")}
          <ShortcutBadge keys="P" />
        </button>
        <button type="button" className={toolbarBtn} disabled={!selectedLine} onClick={() => openLineEdit("qty")}>
          {t("dashboard.pos.changeQty")}
          <ShortcutBadge keys="Q" />
        </button>
        <button type="button" className={toolbarBtn} disabled={!selectedLine} onClick={() => openLineEdit("discount")}>
          {t("dashboard.pos.changeDiscount")}
          <ShortcutBadge keys="D" />
        </button>
        <button
          type="button"
          className={`${toolbarBtn} !text-red-600`}
          disabled={!selectedLine}
          onClick={deleteSelectedLine}
        >
          {t("dashboard.pos.deleteItem")}
          <ShortcutBadge keys="DEL" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left: search + table */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-slate-200/90 bg-white">
          <div className="relative shrink-0 border-b border-slate-200/90 p-3">
            <div className="flex gap-2">
              <div className="w-40 shrink-0">
                <ModernSelect
                  value={searchCategory}
                  onChange={setSearchCategory}
                  options={categories}
                />
              </div>
              <div className="relative min-w-0 flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && searchRows.length > 0) {
                      e.preventDefault();
                      setSearchOpen(true);
                      setSearchHighlight((h) => Math.min(searchRows.length - 1, h + 1));
                      return;
                    }
                    if (e.key === "ArrowUp" && searchRows.length > 0) {
                      e.preventDefault();
                      setSearchOpen(true);
                      setSearchHighlight((h) => Math.max(0, h - 1));
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchEnter();
                    }
                  }}
                  placeholder={t("dashboard.pos.searchPlaceholder")}
                  className="h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 pr-16 text-sm outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ShortcutBadge keys="F1" />
                </span>
              </div>
            </div>

            {searchOpen && searchQuery.trim() ? (
              <div className="absolute left-3 right-3 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200/90 bg-white shadow-lg">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</div>
                ) : searchRows.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-brand-primary-muted">{t("dashboard.pos.noSearchResults")}</div>
                ) : (
                  searchRows.map((row, index) => {
                    const { item } = row;
                    return (
                      <button
                        key={posSearchRowKey(row)}
                        type="button"
                        onClick={() => addSearchRowToBill(row)}
                        className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 ${
                          index === searchHighlight ? "bg-amber-50" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{item.name}</div>
                          {row.type === "serial" ? (
                            <div className="font-mono text-xs text-violet-700">{row.serialNumber}</div>
                          ) : (
                            <div className="text-xs text-brand-primary-muted">
                              {t("dashboard.pos.stock")}: {item.stock} {item.unit}
                              {item.sku ? ` · ${item.sku}` : ""}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                          {formatInr(item.salePrice)}
                        </div>
                      </button>
                    );
                  })
                )}
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/inventory/items/new")}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-orange-1 hover:bg-slate-50"
                >
                  + {t("dashboard.pos.createItem")}
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {activeBill.form.lineItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <EmptyItemsIcon />
                <p className="mt-4 max-w-md text-sm text-brand-primary-muted">{t("dashboard.pos.emptyItems")}</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
                  <tr className="border-b border-slate-200/90">
                    <th className="px-3 py-2.5">{t("dashboard.pos.colNo")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.pos.colItem")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.pos.colCode")}</th>
                    {!posSettings.hideMrp ? <th className="px-3 py-2.5">{t("dashboard.pos.colMrp")}</th> : null}
                    <th className="px-3 py-2.5">{t("dashboard.pos.colSp")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.pos.colDisc")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.pos.colQty")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.pos.colAmount")}</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {activeBill.form.lineItems.map((line, index) => {
                    const calc = calcLineItem(line);
                    const selected = line.id === activeBill.selectedLineId;
                    return (
                      <tr
                        key={line.id}
                        onClick={() => updateActiveBill((b) => ({ ...b, selectedLineId: line.id }))}
                        className={`cursor-pointer border-b border-slate-100 ${selected ? "bg-amber-50" : "hover:bg-slate-50"}`}
                      >
                        <td className="px-3 py-2.5 tabular-nums">{index + 1}</td>
                        <td className="px-3 py-2.5 font-medium">
                          {line.name}
                          {line.serialised && line.serialNumbers[0] ? (
                            <span className="mt-0.5 block font-mono text-xs text-violet-700">
                              {line.serialNumbers[0]}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-brand-primary-muted">
                          {line.serialised
                            ? line.serialNumbers[0] ?? itemSkuById[line.itemId] ?? "—"
                            : itemSkuById[line.itemId] || line.hsn || "—"}
                        </td>
                        {!posSettings.hideMrp ? (
                          <td className="px-3 py-2.5 tabular-nums">{formatInr(line.pricePerItem)}</td>
                        ) : null}
                        <td className="px-3 py-2.5 tabular-nums">{formatInr(line.pricePerItem)}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {line.discountType === "percent" ? `${line.discount}%` : formatInr(line.discount)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {line.qty} {line.unit}
                        </td>
                        <td className="px-3 py-2.5 font-semibold tabular-nums">{formatInr(calc.amount)}</td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = activeBill.form.lineItems.filter((l) => l.id !== line.id);
                              updateActiveBill((b) => updateBillLineItems(b, next, next[0]?.id ?? null));
                            }}
                            className="text-brand-primary-muted hover:text-red-600"
                            aria-label={t("dashboard.pos.deleteItem")}
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                              <path
                                d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M8 7l1 12h6l1-12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-slate-200/90 px-4 py-2 text-xs text-brand-primary-muted">
            <div className="flex items-center gap-4">
              <span>
                {t("dashboard.pos.totalItems")}: {activeBill.form.lineItems.length}
              </span>
              <button
                type="button"
                onClick={clearAllItems}
                className="font-semibold text-red-600 hover:underline"
              >
                {t("dashboard.pos.clearAll")}
                <ShortcutBadge keys="CTRL + C" />
              </button>
            </div>
            <span>{t("dashboard.pos.arrowNavHint")}</span>
          </div>
        </div>

        {/* Right: summary */}
        <aside className="flex w-[340px] shrink-0 flex-col bg-white lg:w-[380px]">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200/90 p-3">
            <button
              type="button"
              onClick={() => setDiscountOpen(true)}
              className="h-10 rounded-sm border border-slate-200/90 text-xs font-semibold hover:bg-slate-50"
            >
              {t("dashboard.pos.addDiscount")}
              <ShortcutBadge keys="F2" />
            </button>
            <button
              type="button"
              onClick={() => setChargeOpen(true)}
              className="h-10 rounded-sm border border-slate-200/90 text-xs font-semibold hover:bg-slate-50"
            >
              {t("dashboard.pos.addCharge")}
              <ShortcutBadge keys="F3" />
            </button>
          </div>

          <div className="space-y-1 border-b border-slate-200/90 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-primary-muted">{t("dashboard.pos.subTotal")}</span>
              <span className="font-semibold tabular-nums">{formatInr(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-primary-muted">{t("dashboard.pos.tax")}</span>
              <span className="font-semibold tabular-nums">{formatInr(totals.taxTotal)}</span>
            </div>
            {totals.discountAmount > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>{t("dashboard.pos.discount")}</span>
                <span className="font-semibold tabular-nums">-{formatInr(totals.discountAmount)}</span>
              </div>
            ) : null}
          </div>

          <div className="border-b border-slate-200/90 bg-emerald-50 px-4 py-4">
            <div className="text-xs font-medium text-emerald-800">{t("dashboard.pos.totalAmount")}</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-900">{formatInr(totals.totalAmount)}</div>
          </div>

          <div className="space-y-3 border-b border-slate-200/90 p-4">
            <div>
              <label className="mb-1 flex items-center text-xs font-medium text-brand-primary-muted">
                {t("dashboard.pos.receivedAmount")}
                <ShortcutBadge keys="F4" />
              </label>
              <div className="flex gap-2">
                <input
                  ref={receivedRef}
                  type="number"
                  min={0}
                  disabled={activeBill.form.fullyPaid}
                  value={activeBill.form.fullyPaid ? totals.totalAmount : activeBill.form.amountReceived}
                  onChange={(e) =>
                    updateActiveBill((bill) =>
                      patchBillForm(bill, { amountReceived: Number(e.target.value) || 0 }),
                    )
                  }
                  className="h-10 min-w-0 flex-1 rounded-sm border border-slate-200/90 px-3 text-sm tabular-nums outline-none focus:border-brand-orange-1/50"
                />
                <div className="w-28">
                  <ModernSelect
                    value={activeBill.form.paymentMode}
                    onChange={(paymentMode) =>
                      updateActiveBill((bill) => patchBillForm(bill, { paymentMode }))
                    }
                    options={PAYMENT_MODES}
                  />
                </div>
              </div>
            </div>

            {!posSettings.hideCustomer ? (
              <div>
                <label className="mb-1 flex items-center text-xs font-medium text-brand-primary-muted">
                  {t("dashboard.pos.customer")}
                  <ShortcutBadge keys="F5" />
                </label>
                <button
                  type="button"
                  onClick={() => setPartyOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-sm border border-slate-200/90 px-3 text-sm hover:bg-slate-50"
                >
                  <span className="truncate">{getCustomerLabel(activeBill)}</span>
                  <span aria-hidden>✎</span>
                </button>
              </div>
            ) : null}
          </div>

          {(error || success) && (
            <div className={`mx-4 mt-3 rounded-md px-3 py-2 text-xs ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {error ?? success}
            </div>
          )}

          <div className="mt-auto space-y-2 p-4">
            <button
              type="button"
              disabled={saving || activeBill.form.lineItems.length === 0}
              onClick={() => void handleSaveBill(true)}
              className="flex h-11 w-full items-center justify-center rounded-sm border border-brand-orange-1 text-sm font-bold text-brand-orange-1 hover:bg-brand-orange-1/5 disabled:opacity-40"
            >
              {t("dashboard.pos.saveAndPrint")}
              <ShortcutBadge keys="F6" />
            </button>
            <button
              type="button"
              disabled={saving || activeBill.form.lineItems.length === 0}
              onClick={() => void handleSaveBill(false)}
              className="flex h-11 w-full items-center justify-center rounded-sm bg-brand-orange-1 text-sm font-bold text-white hover:bg-brand-orange-1/90 disabled:opacity-40"
            >
              {saving ? t("common.pleaseWait") : t("dashboard.pos.saveBill")}
              <ShortcutBadge keys="F7" />
            </button>
          </div>
        </aside>
      </div>

      <PosSettingsModal
        open={settingsOpen}
        settings={posSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          setPosSettings(next);
          savePosSettings(next);
          setBills((prev) => prev.map((b) => applyPosSettingsToBill(b, next)));
          setSettingsOpen(false);
        }}
      />

      <PosDiscountModal
        open={discountOpen}
        discountValue={activeBill.form.discountAfterTax}
        discountType={activeBill.form.discountType}
        discountTiming={activeBill.form.discountTiming}
        onClose={() => setDiscountOpen(false)}
        onSave={({ discountValue, discountType, discountTiming }) => {
          updateActiveBill((bill) =>
            patchBillForm(bill, {
              discountAfterTax: discountValue,
              discountType,
              discountTiming,
            }),
          );
          setDiscountOpen(false);
        }}
      />

      <PosChargeModal
        open={chargeOpen}
        charges={activeBill.form.additionalCharges}
        onClose={() => setChargeOpen(false)}
        onSave={(charges) => {
          updateActiveBill((bill) => patchBillForm(bill, { additionalCharges: charges }));
          setChargeOpen(false);
        }}
      />

      <PartySelectModal
        open={partyOpen}
        organisationId={activeOrganisationId}
        onClose={() => setPartyOpen(false)}
        onSelect={(party: SelectedInvoiceParty) => {
          updateActiveBill((bill) => {
            const next = patchBillForm(bill, {
              partyId: party.partyId,
              cashSaleDefault: Boolean(party.isCashSale),
            });
            return { ...next, party };
          });
          setPartyOpen(false);
        }}
      />

      {selectedLine ? (
        <PosLineEditModal
          open={lineEditOpen}
          field={lineEditField}
          itemName={selectedLine.name}
          value={
            lineEditField === "price"
              ? selectedLine.pricePerItem
              : lineEditField === "qty"
                ? selectedLine.qty
                : selectedLine.discount
          }
          onClose={() => setLineEditOpen(false)}
          onSave={(value) => {
            if (!activeBill?.selectedLineId) return;
            const nextLines = activeBill.form.lineItems.map((line) => {
              if (line.id !== activeBill.selectedLineId) return line;
              if (lineEditField === "price") return { ...line, pricePerItem: value };
              if (lineEditField === "qty") {
                return { ...line, qty: clampInvoiceLineQty(line, value, activeBill.form.lineItems) };
              }
              return { ...line, discount: value, discountType: "percent" as const };
            });
            updateActiveBill((bill) => updateBillLineItems(bill, nextLines));
            setLineEditOpen(false);
          }}
        />
      ) : null}

      <SalesInvoicePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        model={previewModel}
        storedSettings={{
          ...storedInvoiceSettings,
          themeId: posPrinterToTheme(posSettings.printerType),
        }}
        title={t("dashboard.pos.printPreview")}
      />
    </div>
  );
}

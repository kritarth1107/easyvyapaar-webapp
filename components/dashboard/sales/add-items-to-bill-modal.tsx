"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import type { InventoryBillPick, InventoryItem } from "@/lib/types/inventory-ui";
import { fetchInventoryItems } from "@/lib/inventory/inventory-api-client";
import { fetchParties } from "@/lib/parties/parties-api-client";
import { formatInr } from "@/lib/sales/create-invoice-form";
import type { PartySummary } from "@/lib/types/parties-api";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}

type BillListRow =
  | { type: "item"; item: InventoryItem }
  | { type: "serial"; item: InventoryItem; serialNumber: string };

function expandInventoryRows(items: InventoryItem[]): BillListRow[] {
  const rows: BillListRow[] = [];
  for (const item of items) {
    if (item.serialised) {
      for (const serialNumber of item.availableSerials ?? []) {
        rows.push({ type: "serial", item, serialNumber });
      }
    } else {
      rows.push({ type: "item", item });
    }
  }
  return rows;
}

function billListRowKey(row: BillListRow): string {
  return row.type === "serial" ? `${row.item.id}::${row.serialNumber}` : row.item.id;
}

type AddItemsToBillModalProps = {
  open: boolean;
  organisationId: string | null;
  onClose: () => void;
  onAdd: (picks: InventoryBillPick[]) => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AddItemsToBillModal({
  open,
  organisationId,
  onClose,
  onAdd,
}: AddItemsToBillModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<PartySummary[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("all");
      setSelected(new Set());
      setSelectedSupplierId("");
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    const orgId = organisationId?.trim();
    if (!open || !orgId) {
      setItems([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(null);

      fetchInventoryItems(orgId, {
        limit: 100,
        page: 1,
        ...(query.trim() ? { search: query.trim() } : {}),
        ...(category !== "all" ? { category } : {}),
      })
        .then((data) => {
          if (!cancelled) setItems(data.tableItems);
        })
        .catch((err) => {
          if (!cancelled) {
            setItems([]);
            setLoadError(
              err instanceof Error ? err.message : t("dashboard.salesInvoices.create.noItemsFound"),
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, organisationId, query, category, t]);

  useEffect(() => {
    const orgId = organisationId?.trim();
    if (!open || !orgId) {
      setSuppliers([]);
      return;
    }

    let cancelled = false;
    setSuppliersLoading(true);

    fetchParties(orgId, { view: "suppliers", limit: 100, page: 1 })
      .then((data) => {
        if (!cancelled) setSuppliers(data.items);
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, organisationId]);

  const selectedSupplier = useMemo(
    () => suppliers.find((party) => party.partyId === selectedSupplierId),
    [suppliers, selectedSupplierId],
  );

  const supplierOptions = useMemo(
    () => [
      { value: "", label: t("dashboard.salesInvoices.create.noSupplierSelected") },
      ...suppliers.map((party) => ({ value: party.partyId, label: party.name })),
    ],
    [suppliers, t],
  );

  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category))].sort();
    return [{ value: "all", label: t("dashboard.salesInvoices.create.allCategories") }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [items, t]);

  const listRows = useMemo(() => expandInventoryRows(items), [items]);

  const rowCanAdd = (row: BillListRow) =>
    row.type === "serial" ? true : row.item.stock > 0;

  const toggleSelect = (row: BillListRow) => {
    if (!rowCanAdd(row)) return;
    const key = billListRowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildPick = (row: BillListRow): InventoryBillPick | null => {
    if (!rowCanAdd(row)) return null;
    const supplierMeta = selectedSupplier
      ? { supplierId: selectedSupplier.partyId, supplierName: selectedSupplier.name }
      : undefined;

    if (row.type === "serial") {
      return {
        item: row.item,
        serialNumbers: [row.serialNumber],
        ...supplierMeta,
      };
    }
    return { item: row.item, ...supplierMeta };
  };

  const addSingle = (row: BillListRow) => {
    const pick = buildPick(row);
    if (!pick) return;
    onAdd([pick]);
    onClose();
  };

  const addSelected = () => {
    const picks: InventoryBillPick[] = [];
    for (const row of listRows) {
      if (!selected.has(billListRowKey(row))) continue;
      const pick = buildPick(row);
      if (pick) picks.push(pick);
    }
    if (picks.length) {
      onAdd(picks);
      onClose();
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-items-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(680px,90vh)] w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 id="add-items-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.salesInvoices.create.addItemsTitle")}
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

        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.salesInvoices.create.searchItems")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.salesInvoices.create.searchItems")}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
              autoFocus
            />
          </label>
          <div className="w-full shrink-0 sm:w-[200px]">
            <ModernSelect
              value={category}
              onChange={setCategory}
              options={categories}
              aria-label={t("dashboard.salesInvoices.create.selectCategory")}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            {t("dashboard.salesInvoices.create.createNewItem")}
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-primary">
                {t("dashboard.salesInvoices.create.purchaseFromSupplier")}
              </p>
              <p className="mt-0.5 text-xs text-brand-primary-muted">
                {t("dashboard.salesInvoices.create.purchaseFromSupplierHint")}
              </p>
            </div>
            <div className="w-full shrink-0 sm:max-w-xs">
              <ModernSelect
                value={selectedSupplierId}
                onChange={setSelectedSupplierId}
                options={supplierOptions}
                disabled={suppliersLoading}
                aria-label={t("dashboard.salesInvoices.create.selectSupplier")}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scrollbar-brand">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colItemName")}</th>
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colItemCode")}</th>
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colStock")}</th>
                <th className="px-4 py-2.5 text-right">{t("dashboard.salesInvoices.create.colSalePrice")}</th>
                <th className="px-4 py-2.5 text-right">{t("dashboard.salesInvoices.create.colQty")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : listRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.salesInvoices.create.noItemsFound")}
                  </td>
                </tr>
              ) : (
                listRows.map((row) => {
                  const { item } = row;
                  const key = billListRowKey(row);
                  const canAdd = rowCanAdd(row);
                  const isSelected = selected.has(key);

                  return (
                    <tr
                      key={key}
                      onClick={() => toggleSelect(row)}
                      className={`border-b border-slate-50 transition-colors ${
                        !canAdd
                          ? "cursor-not-allowed opacity-50"
                          : `cursor-pointer hover:bg-blue-50/20 ${isSelected ? "bg-brand-primary/[0.04]" : ""}`
                      }`}
                    >
                      <td className="align-top px-4 py-2.5">
                        <p className="font-medium text-brand-primary">{item.name}</p>
                        {row.type === "serial" ? (
                          <p className="mt-0.5 font-mono text-[11px] text-violet-700">{row.serialNumber}</p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-brand-primary-muted">{item.unit}</p>
                        )}
                        {selectedSupplier && (
                          <p className="mt-0.5 text-[11px] text-violet-700">
                            {t("dashboard.salesInvoices.create.purchaseFromSupplier")}: {selectedSupplier.name}
                          </p>
                        )}
                      </td>
                      <td className="align-top px-4 py-2.5 font-mono text-xs text-brand-primary-muted">
                        {item.sku}
                      </td>
                      <td className="align-top px-4 py-2.5 tabular-nums text-brand-primary-mid">
                        {row.type === "serial" ? `1 ${item.unit}` : `${item.stock} ${item.unit}`}
                      </td>
                      <td className="align-top px-4 py-2.5 text-right tabular-nums font-semibold text-brand-primary">
                        {formatInr(item.salePrice)}
                      </td>
                      <td className="align-top px-4 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={!canAdd}
                          onClick={(e) => {
                            e.stopPropagation();
                            addSingle(row);
                          }}
                          className="rounded-sm px-2.5 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          + {t("dashboard.salesInvoices.create.add")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-brand-surface/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-brand-primary-muted">
            {formatMessage(t("dashboard.salesInvoices.create.itemsSelected"), {
              count: selected.size,
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={addSelected}
              disabled={selected.size === 0}
              className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("dashboard.salesInvoices.create.addToBill")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

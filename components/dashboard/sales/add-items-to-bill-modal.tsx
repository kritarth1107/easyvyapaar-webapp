"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { MOCK_INVENTORY_ITEMS } from "@/lib/dashboard/mock-inventory-items";
import type { InventoryItem } from "@/lib/dashboard/mock-inventory-items";
import { formatInr } from "@/lib/sales/create-invoice-form";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}

type AddItemsToBillModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (items: InventoryItem[]) => void;
  showPurchasePrice: boolean;
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
  onClose,
  onAdd,
  showPurchasePrice,
}: AddItemsToBillModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCategory("all");
      setSelected(new Set());
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

  const categories = useMemo(() => {
    const cats = [...new Set(MOCK_INVENTORY_ITEMS.map((i) => i.category))].sort();
    return [{ value: "all", label: t("dashboard.salesInvoices.create.allCategories") }, ...cats.map((c) => ({ value: c, label: c }))];
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_INVENTORY_ITEMS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.hsn.includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSingle = (item: InventoryItem) => {
    onAdd([item]);
    onClose();
  };

  const addSelected = () => {
    const items = MOCK_INVENTORY_ITEMS.filter((i) => selected.has(i.id));
    if (items.length) {
      onAdd(items);
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
        className="flex h-[min(640px,90vh)] w-[min(960px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
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
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
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

        <div className="min-h-0 flex-1 overflow-auto scrollbar-brand">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colItemName")}</th>
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colItemCode")}</th>
                <th className="px-4 py-2.5">{t("dashboard.salesInvoices.create.colStock")}</th>
                <th className="px-4 py-2.5 text-right">{t("dashboard.salesInvoices.create.colSalePrice")}</th>
                {showPurchasePrice && (
                  <th className="px-4 py-2.5 text-right">
                    {t("dashboard.salesInvoices.create.colPurchasePrice")}
                  </th>
                )}
                <th className="px-4 py-2.5 text-right">{t("dashboard.salesInvoices.create.colQty")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={showPurchasePrice ? 6 : 5}
                    className="px-4 py-10 text-center text-sm text-brand-primary-muted"
                  >
                    {t("dashboard.salesInvoices.create.noItemsFound")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/30 ${selected.has(item.id) ? "bg-brand-primary/[0.04]" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-brand-primary">{item.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-brand-primary-muted">{item.sku}</td>
                    <td className="px-4 py-2.5 tabular-nums text-brand-primary-mid">
                      {item.stock} {item.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatInr(item.salePrice)}</td>
                    {showPurchasePrice && (
                      <td className="px-4 py-2.5 text-right tabular-nums text-brand-primary-muted">
                        {formatInr(item.purchasePrice)}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addSingle(item);
                        }}
                        className="rounded-sm px-2.5 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/[0.06]"
                      >
                        + {t("dashboard.salesInvoices.create.add")}
                      </button>
                    </td>
                  </tr>
                ))
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
              className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
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

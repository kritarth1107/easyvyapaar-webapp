"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { createStockAdjustment } from "@/lib/inventory/inventory-api-client";
import { formatDetailDate } from "@/lib/inventory/item-detail-utils";
import type { InventoryItemDetail, StockAdjustmentType } from "@/lib/types/inventory-api";
import { useTranslation } from "@/lib/localization";

type AdjustStockModalProps = {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  item: InventoryItemDetail;
  onSaved: (item: InventoryItemDetail) => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

export function AdjustStockModal({
  open,
  onClose,
  organisationId,
  item,
  onSaved,
}: AdjustStockModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState(todayIso());
  const [type, setType] = useState<StockAdjustmentType>("add");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setAdjustmentDate(todayIso());
    setType("add");
    setQuantity("");
    setRemarks("");
    setSaveError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saveLoading) onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saveLoading]);

  const parsedQty = useMemo(() => {
    const value = Number(quantity);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [quantity]);

  const delta = type === "add" ? parsedQty : -parsedQty;
  const updatedStock = item.currentStock + delta;

  const handleSave = async () => {
    if (!parsedQty) {
      setSaveError(t("dashboard.inventory.itemDetail.adjustStock.quantityRequired"));
      return;
    }
    if (updatedStock < 0) {
      setSaveError(t("dashboard.inventory.itemDetail.adjustStock.insufficientStock"));
      return;
    }

    setSaveLoading(true);
    setSaveError(null);
    try {
      const result = await createStockAdjustment(item.itemId, {
        organisationId,
        adjustmentDate,
        type,
        quantity: parsedQty,
        ...(remarks.trim() && { remarks: remarks.trim() }),
      });
      onSaved(result.item);
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : t("dashboard.inventory.itemDetail.adjustStock.saveError"),
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
      onClick={() => !saveLoading && onClose()}
    >
      <div
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="adjust-stock-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.inventory.itemDetail.adjustStock.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saveLoading}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.date")}
              </label>
              <input
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.type")}
              </label>
              <ModernSelect
                value={type}
                onChange={(value) => setType(value as StockAdjustmentType)}
                options={[
                  { value: "add", label: t("dashboard.inventory.itemDetail.adjustStock.add") },
                  { value: "reduce", label: t("dashboard.inventory.itemDetail.adjustStock.reduce") },
                ]}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.quantity")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-primary-muted">
                  {item.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.remarks")}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t("dashboard.inventory.itemDetail.adjustStock.remarksPlaceholder")}
                rows={4}
                className="w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15"
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200/90 bg-brand-surface/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.inventory.itemDetail.adjustStock.itemName")}
            </p>
            <p className="mt-1 text-base font-bold text-brand-primary">{item.name}</p>

            <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-4">
              <p className="text-sm font-bold text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.calculation")}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-primary-muted">
                  {t("dashboard.inventory.itemDetail.adjustStock.currentStock")}
                </span>
                <span className="font-semibold tabular-nums text-brand-primary">
                  {item.currentStock} {item.unit}
                </span>
              </div>
              {parsedQty > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-primary-muted">
                    {type === "add"
                      ? t("dashboard.inventory.itemDetail.adjustStock.stockAdded")
                      : t("dashboard.inventory.itemDetail.adjustStock.stockReduced")}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      type === "add" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {type === "add" ? "+" : "−"} {parsedQty} {item.unit}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-sm">
                <span className="font-semibold text-brand-primary">
                  {t("dashboard.inventory.itemDetail.adjustStock.updatedStock")}
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    updatedStock < 0 ? "text-red-700" : "text-brand-primary"
                  }`}
                >
                  {parsedQty > 0 ? updatedStock : item.currentStock} {item.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <p className="px-6 pb-2 text-sm font-medium text-red-600">{saveError}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-brand-surface/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saveLoading}
            className="h-10 rounded-md border border-slate-200/90 bg-white px-5 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("dashboard.inventory.itemDetail.adjustStock.close")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveLoading}
            className="h-10 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.4)] hover:brightness-105 disabled:opacity-60"
          >
            {saveLoading
              ? t("dashboard.inventory.itemDetail.adjustStock.saving")
              : t("dashboard.inventory.itemDetail.adjustStock.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

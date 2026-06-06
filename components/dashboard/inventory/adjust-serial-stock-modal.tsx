"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { createStockAdjustment } from "@/lib/inventory/inventory-api-client";
import type { InventoryItemDetail, StockAdjustmentType } from "@/lib/types/inventory-api";
import { useTranslation } from "@/lib/localization";

type AdjustSerialStockModalProps = {
  open: boolean;
  onClose: () => void;
  organisationId: string;
  item: InventoryItemDetail;
  onSaved: (item: InventoryItemDetail) => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseSerialInput(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7v10M7 7v10M10 5v14M13 7v10M16 7v10M19 7v10M22 7v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15";

export function AdjustSerialStockModal({
  open,
  onClose,
  organisationId,
  item,
  onSaved,
}: AdjustSerialStockModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [adjustmentDate, setAdjustmentDate] = useState(todayIso());
  const [type, setType] = useState<StockAdjustmentType>("add");
  const [bulkInput, setBulkInput] = useState("");
  const [singleInput, setSingleInput] = useState("");
  const [addedSerials, setAddedSerials] = useState<string[]>([]);
  const [selectedReduce, setSelectedReduce] = useState<Set<string>>(new Set());
  const [reduceQuery, setReduceQuery] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inStockSerials = useMemo(
    () => item.serialNumbers.filter((row) => row.status === "in_stock"),
    [item.serialNumbers],
  );

  const filteredReduceSerials = useMemo(() => {
    const q = reduceQuery.trim().toLowerCase();
    if (!q) return inStockSerials;
    return inStockSerials.filter((row) => row.serialNumber.toLowerCase().includes(q));
  }, [inStockSerials, reduceQuery]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setAdjustmentDate(todayIso());
    setType("add");
    setBulkInput("");
    setSingleInput("");
    setAddedSerials([]);
    setSelectedReduce(new Set());
    setReduceQuery("");
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

  const activeSerials = type === "add" ? addedSerials : Array.from(selectedReduce);
  const delta = type === "add" ? activeSerials.length : -activeSerials.length;
  const updatedStock = item.currentStock + delta;

  const addSerial = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    const existingOnItem = new Set(
      item.serialNumbers.map((row) => row.serialNumber.toLowerCase()),
    );
    if (existingOnItem.has(key)) {
      setSaveError(`${t("dashboard.inventory.itemDetail.adjustStock.serialAlreadyOnItem")}: ${trimmed}`);
      return;
    }
    setAddedSerials((prev) => {
      if (prev.some((sn) => sn.toLowerCase() === key)) return prev;
      return [...prev, trimmed];
    });
    setSaveError(null);
  };

  const handleBulkApply = () => {
    const parsed = parseSerialInput(bulkInput);
    if (!parsed.length) return;
    const next = [...addedSerials];
    const seen = new Set(next.map((sn) => sn.toLowerCase()));
    const existingOnItem = new Set(
      item.serialNumbers.map((row) => row.serialNumber.toLowerCase()),
    );
    for (const sn of parsed) {
      const key = sn.toLowerCase();
      if (seen.has(key) || existingOnItem.has(key)) continue;
      seen.add(key);
      next.push(sn);
    }
    setAddedSerials(next);
    setBulkInput("");
    setSaveError(null);
  };

  const toggleReduce = (serial: string) => {
    setSelectedReduce((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedReduce((prev) => {
      const next = new Set(prev);
      for (const row of filteredReduceSerials) next.add(row.serialNumber);
      return next;
    });
  };

  const clearSelection = () => setSelectedReduce(new Set());

  const handleSave = async () => {
    if (!activeSerials.length) {
      setSaveError(t("dashboard.inventory.itemDetail.adjustStock.serialRequired"));
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
        serialNumbers: activeSerials,
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
      aria-labelledby="adjust-serial-stock-title"
      onClick={() => !saveLoading && onClose()}
    >
      <div
        className="relative flex max-h-[min(92vh,780px)] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-violet-200/70 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-white px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md bg-violet-100 text-violet-700">
              <BarcodeIcon />
            </span>
            <div>
              <h2 id="adjust-serial-stock-title" className="text-lg font-bold text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.serialTitle")}
              </h2>
              <p className="mt-0.5 text-sm text-brand-primary-muted">
                {t("dashboard.inventory.itemDetail.adjustStock.serialSubtitle")}
              </p>
            </div>
          </div>
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

        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  onChange={(value) => {
                    setType(value as StockAdjustmentType);
                    setSaveError(null);
                  }}
                  options={[
                    { value: "add", label: t("dashboard.inventory.itemDetail.adjustStock.add") },
                    { value: "reduce", label: t("dashboard.inventory.itemDetail.adjustStock.reduce") },
                  ]}
                />
              </div>
            </div>

            {type === "add" ? (
              <div className="space-y-3 rounded-md border border-violet-100 bg-violet-50/20 p-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                    {t("dashboard.inventory.itemDetail.adjustStock.serialBulkLabel")}
                  </label>
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder={t("dashboard.inventory.itemDetail.adjustStock.serialBulkPlaceholder")}
                    rows={3}
                    className="w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 font-mono text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15"
                  />
                  <button
                    type="button"
                    onClick={handleBulkApply}
                    disabled={!bulkInput.trim()}
                    className="mt-2 h-9 rounded-md border border-violet-200/80 bg-white px-3 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                  >
                    {t("dashboard.inventory.itemDetail.adjustStock.serialBulkApply")}
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                    {t("dashboard.inventory.itemDetail.adjustStock.serialSingleLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={singleInput}
                      onChange={(e) => setSingleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSerial(singleInput);
                          setSingleInput("");
                        }
                      }}
                      placeholder={t("dashboard.inventory.itemDetail.adjustStock.serialSinglePlaceholder")}
                      className={`${inputClass} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addSerial(singleInput);
                        setSingleInput("");
                      }}
                      disabled={!singleInput.trim()}
                      className="h-10 shrink-0 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {t("dashboard.inventory.itemDetail.adjustStock.serialAddOne")}
                    </button>
                  </div>
                </div>

                {addedSerials.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
                        {t("dashboard.inventory.itemDetail.adjustStock.serialToAdd")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddedSerials([])}
                        className="text-xs font-semibold text-violet-700 hover:underline"
                      >
                        {t("dashboard.inventory.itemDetail.adjustStock.serialClear")}
                      </button>
                    </div>
                    <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                      {addedSerials.map((sn) => (
                        <span
                          key={sn}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800"
                        >
                          {sn}
                          <button
                            type="button"
                            onClick={() =>
                              setAddedSerials((prev) => prev.filter((entry) => entry !== sn))
                            }
                            className="text-emerald-600 hover:text-emerald-900"
                            aria-label={t("common.close")}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-md border border-violet-100 bg-violet-50/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-primary">
                    {t("dashboard.inventory.itemDetail.adjustStock.serialSelectLabel")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="text-xs font-semibold text-violet-700 hover:underline"
                    >
                      {t("dashboard.inventory.itemDetail.adjustStock.serialSelectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-semibold text-brand-primary-muted hover:underline"
                    >
                      {t("dashboard.inventory.itemDetail.adjustStock.serialClearSelection")}
                    </button>
                  </div>
                </div>

                <input
                  value={reduceQuery}
                  onChange={(e) => setReduceQuery(e.target.value)}
                  placeholder={t("dashboard.inventory.itemDetail.adjustStock.serialSearchPlaceholder")}
                  className={inputClass}
                />

                {inStockSerials.length === 0 ? (
                  <p className="rounded-md border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-sm text-amber-900">
                    {t("dashboard.inventory.itemDetail.adjustStock.serialNoneInStock")}
                  </p>
                ) : filteredReduceSerials.length === 0 ? (
                  <p className="text-sm text-brand-primary-muted">
                    {t("dashboard.inventory.itemDetail.adjustStock.serialNoMatch")}
                  </p>
                ) : (
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                    {filteredReduceSerials.map((row) => {
                      const checked = selectedReduce.has(row.serialNumber);
                      return (
                        <label
                          key={row.serialNumber}
                          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                            checked
                              ? "border-red-200/80 bg-red-50/50"
                              : "border-slate-200/80 bg-white hover:border-violet-200/80"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReduce(row.serialNumber)}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30"
                          />
                          <span className="font-mono text-sm font-semibold text-brand-primary">
                            {row.serialNumber}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("dashboard.inventory.itemDetail.adjustStock.remarks")}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t("dashboard.inventory.itemDetail.adjustStock.remarksPlaceholder")}
                rows={3}
                className="w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/15"
              />
            </div>
          </div>

          <div className="rounded-md border border-violet-100 bg-gradient-to-b from-violet-50/40 to-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.inventory.itemDetail.adjustStock.itemName")}
            </p>
            <p className="mt-1 text-base font-bold text-brand-primary">{item.name}</p>
            <p className="mt-1 inline-flex rounded-sm bg-violet-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
              {t("dashboard.inventory.itemDetail.adjustStock.serialBadge")}
            </p>

            <div className="mt-5 space-y-3 border-t border-violet-100 pt-4">
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
              {activeSerials.length > 0 && (
                <>
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
                      {type === "add" ? "+" : "−"} {activeSerials.length} {item.unit}
                    </span>
                  </div>
                  <div className="rounded-md border border-slate-200/80 bg-white/80 p-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                      {type === "add"
                        ? t("dashboard.inventory.itemDetail.adjustStock.serialPreviewAdd")
                        : t("dashboard.inventory.itemDetail.adjustStock.serialPreviewReduce")}
                    </p>
                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                      {activeSerials.map((sn) => (
                        <span
                          key={sn}
                          className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                            type === "add"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between border-t border-violet-100 pt-3 text-sm">
                <span className="font-semibold text-brand-primary">
                  {t("dashboard.inventory.itemDetail.adjustStock.updatedStock")}
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${
                    updatedStock < 0 ? "text-red-700" : "text-brand-primary"
                  }`}
                >
                  {activeSerials.length > 0 ? updatedStock : item.currentStock} {item.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {saveError && (
          <p className="px-6 pb-2 text-sm font-medium text-red-600">{saveError}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-violet-100 bg-violet-50/30 px-6 py-4">
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
            disabled={saveLoading || activeSerials.length === 0}
            className="h-10 rounded-md bg-gradient-to-r from-violet-600 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(124,58,237,0.45)] hover:brightness-105 disabled:opacity-60"
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

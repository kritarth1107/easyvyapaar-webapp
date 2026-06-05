"use client";

import { useRef } from "react";
import {
  createSerialRow,
  formatSerialDate,
  parsePastedSerials,
  type CreateItemFormState,
  type SerialNumberRow,
} from "@/lib/inventory/create-item-form";
import { UnitSelect } from "@/components/dashboard/inventory/unit-select";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

type SerialNumbersSectionProps = {
  form: CreateItemFormState;
  patch: (partial: Partial<CreateItemFormState>) => void;
  serialError?: string | null;
  units: string[];
  onAddUnit: () => void;
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-brand-primary">
      {children}
      {required && <span className="text-brand-orange-1"> *</span>}
    </label>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M3 6V4a1 1 0 011-1h2M14 3h2a1 1 0 011 1v2M17 14v2a1 1 0 01-1 1h-2M6 17H4a1 1 0 01-1-1v-2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function SerialNumbersSection({
  form,
  patch,
  serialError,
  units,
  onAddUnit,
}: SerialNumbersSectionProps) {
  const { t } = useTranslation();
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const syncOpeningStock = (rows: SerialNumberRow[]) => {
    const filled = rows.filter((r) => r.serialNumber.trim()).length;
    patch({
      serialNumbers: rows,
      openingStock: filled > 0 ? String(filled) : form.openingStock,
    });
  };

  const addRow = () => {
    syncOpeningStock([...form.serialNumbers, createSerialRow()]);
  };

  const updateRow = (id: string, field: keyof SerialNumberRow, value: string) => {
    const rows = form.serialNumbers.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    syncOpeningStock(rows);
  };

  const removeRow = (id: string) => {
    syncOpeningStock(form.serialNumbers.filter((r) => r.id !== id));
  };

  const handlePaste = (text: string) => {
    const values = parsePastedSerials(text);
    if (values.length === 0) return;

    const existing = new Set(
      form.serialNumbers.map((r) => r.serialNumber.trim().toLowerCase()).filter(Boolean)
    );
    const newRows: SerialNumberRow[] = [];
    for (const v of values) {
      const key = v.toLowerCase();
      if (existing.has(key)) continue;
      existing.add(key);
      newRows.push(createSerialRow(v));
    }

    if (newRows.length === 0) return;
    syncOpeningStock([...form.serialNumbers, ...newRows]);
  };

  const rows = form.serialNumbers;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start">
        <div className="flex min-w-0 flex-col">
          <FieldLabel>{t("dashboard.inventory.createItem.openingStock")}</FieldLabel>
          <div className="mt-1.5 flex h-10 overflow-hidden rounded-md border border-slate-200/90 bg-slate-50/80">
            <input
              type="text"
              readOnly
              value={
                form.serialNumbers.filter((r) => r.serialNumber.trim()).length ||
                form.openingStock ||
                "0"
              }
              className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-brand-primary outline-none"
              aria-describedby="serial-stock-hint"
            />
            <span className="flex h-10 items-center border-l border-slate-200/90 bg-slate-50 px-3 text-xs font-semibold text-brand-primary-muted">
              {form.unit}
            </span>
          </div>
          <p id="serial-stock-hint" className="mt-1 text-xs leading-4 text-brand-primary-muted">
            {t("dashboard.inventory.createItem.serialStockHint")}
          </p>
        </div>
        <div className="flex min-w-0 flex-col">
          <FieldLabel>{t("dashboard.inventory.createItem.measuringUnit")}</FieldLabel>
          <div className="mt-1.5">
            <UnitSelect
              value={form.unit}
              units={units}
              onChange={(unit) => patch({ unit })}
              onAddUnit={onAddUnit}
            />
          </div>
          <p className="mt-1 text-xs leading-4 text-transparent select-none" aria-hidden>
            {t("dashboard.inventory.createItem.serialStockHint")}
          </p>
        </div>
      </div>

      <div className="flex gap-3 rounded-md border border-amber-200/80 bg-amber-50/90 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-amber-100 text-amber-700">
          ⓘ
        </span>
        <p className="text-sm leading-relaxed text-amber-900/90">
          {t("dashboard.inventory.createItem.serialPasteHint")}
        </p>
      </div>

      <textarea
        ref={pasteRef}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (text.includes("\n") || text.includes("\t") || text.includes(",")) {
            e.preventDefault();
            handlePaste(text);
          }
        }}
      />

      <div className="overflow-hidden rounded-md border border-slate-200/90">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-brand-surface/50 px-4 py-3">
          <p className="text-sm font-bold text-brand-primary">
            {t("dashboard.inventory.createItem.serialTableTitle")}
          </p>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200/90 bg-white px-3 text-xs font-semibold text-brand-primary transition-colors hover:border-brand-orange-1/40 hover:bg-brand-surface-warm"
            onClick={() => {
              /* Scanner integration — placeholder */
              const firstEmpty = form.serialNumbers.find((r) => !r.serialNumber.trim());
              if (firstEmpty) {
                document.getElementById(`serial-input-${firstEmpty.id}`)?.focus();
              } else {
                addRow();
                setTimeout(() => {
                  const last = form.serialNumbers[form.serialNumbers.length - 1];
                  if (last) document.getElementById(`serial-input-${last.id}`)?.focus();
                }, 0);
              }
            }}
          >
            <ScanIcon />
            {t("dashboard.inventory.createItem.scanSerial")}
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
              <th className="px-4 py-2.5">{t("dashboard.inventory.createItem.colSerial")}</th>
              <th className="px-4 py-2.5">{t("dashboard.inventory.createItem.colDateCreated")}</th>
              <th className="w-10 px-2 py-2.5" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-brand-primary-muted">
                  {t("dashboard.inventory.createItem.noSerialsYet")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-4 py-2">
                  <input
                    id={`serial-input-${row.id}`}
                    type="text"
                    value={row.serialNumber}
                    onChange={(e) => updateRow(row.id, "serialNumber", e.target.value)}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (text.includes("\n") || text.includes("\t")) {
                        e.preventDefault();
                        handlePaste(text);
                      }
                    }}
                    placeholder={t("dashboard.inventory.createItem.serialPlaceholder")}
                    className={inputClass}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    value={row.dateCreated}
                    onChange={(e) => updateRow(row.id, "dateCreated", e.target.value)}
                    className={inputClass}
                  />
                  <span className="mt-0.5 block text-[11px] text-brand-primary-muted sm:hidden">
                    {formatSerialDate(row.dateCreated)}
                  </span>
                </td>
                <td className="px-2 py-2 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-red-50 hover:text-red-600"
                    aria-label={t("dashboard.inventory.createItem.removeSerial")}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>

        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
          >
            + {t("dashboard.inventory.createItem.addSerial")}
          </button>
        </div>
      </div>

      {serialError && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {serialError}
        </p>
      )}

      <p className="text-xs text-brand-primary-muted">
        {t("dashboard.inventory.createItem.serialExampleHint")}
      </p>
    </div>
  );
}

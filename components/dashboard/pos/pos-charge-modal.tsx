"use client";

import { useEffect, useState } from "react";
import type { AdditionalCharge } from "@/lib/sales/create-invoice-form";
import { useTranslation } from "@/lib/localization";
import { PosModalShell } from "./pos-modal-shell";
import { ShortcutBadge } from "./shortcut-badge";

type PosChargeModalProps = {
  open: boolean;
  charges: AdditionalCharge[];
  onClose: () => void;
  onSave: (charges: AdditionalCharge[]) => void;
};

const inputClass =
  "h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function emptyRow(): AdditionalCharge {
  return { id: `charge-${Date.now()}-${Math.random()}`, label: "", amount: 0, taxPercent: 0 };
}

export function PosChargeModal({ open, charges, onClose, onSave }: PosChargeModalProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdditionalCharge[]>([emptyRow()]);

  useEffect(() => {
    if (!open) return;
    setRows(charges.length > 0 ? charges.map((c) => ({ ...c })) : [emptyRow()]);
  }, [open, charges]);

  const handleSave = () => {
    const cleaned = rows
      .map((row) => ({
        ...row,
        label: row.label.trim(),
        amount: Number(row.amount) || 0,
        taxPercent: Number(row.taxPercent) || 0,
      }))
      .filter((row) => row.label && row.amount > 0);
    onSave(cleaned);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, rows, onSave]);

  const footer = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        className="flex h-11 w-full items-center justify-center rounded-sm bg-brand-orange-1 text-sm font-bold text-white hover:bg-brand-orange-1/90"
      >
        {t("common.save")}
        <ShortcutBadge keys="F7" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-full items-center justify-center rounded-sm border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50"
      >
        {t("common.cancel")}
        <ShortcutBadge keys="ESC" />
      </button>
    </div>
  );

  return (
    <PosModalShell
      open={open}
      title={t("dashboard.pos.addCharge")}
      onClose={onClose}
      footer={footer}
      widthClass="max-w-lg"
    >
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[1fr_120px] gap-2">
            <input
              type="text"
              value={row.label}
              placeholder={t("dashboard.pos.chargeLabelPlaceholder")}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
            <input
              type="number"
              min={0}
              value={row.amount || ""}
              placeholder="₹ 0"
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) =>
                    i === index ? { ...r, amount: Number(e.target.value) || 0 } : r,
                  ),
                )
              }
              className={inputClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="text-sm font-semibold text-brand-orange-1 hover:underline"
        >
          {t("dashboard.pos.addAnotherCharge")}
        </button>
      </div>
    </PosModalShell>
  );
}

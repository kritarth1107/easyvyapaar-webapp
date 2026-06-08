"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/localization";
import { PosModalShell } from "./pos-modal-shell";
import { ShortcutBadge } from "./shortcut-badge";

export type PosLineEditField = "price" | "qty" | "discount";

type PosLineEditModalProps = {
  open: boolean;
  field: PosLineEditField;
  itemName: string;
  value: number;
  onClose: () => void;
  onSave: (value: number) => void;
};

const inputClass =
  "h-11 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-base text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

export function PosLineEditModal({
  open,
  field,
  itemName,
  value,
  onClose,
  onSave,
}: PosLineEditModalProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(String(value));
    const timer = window.setTimeout(() => inputRef.current?.select(), 50);
    return () => window.clearTimeout(timer);
  }, [open, value]);

  const title =
    field === "price"
      ? t("dashboard.pos.changePrice")
      : field === "qty"
        ? t("dashboard.pos.changeQty")
        : t("dashboard.pos.changeDiscount");

  const handleSave = () => {
    const num = Number(draft);
    if (!Number.isFinite(num) || num < 0) return;
    onSave(num);
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
  }, [open, draft, onSave]);

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
    <PosModalShell open={open} title={title} onClose={onClose} footer={footer}>
      <p className="mb-3 truncate text-sm text-brand-primary-muted">{itemName}</p>
      <input
        ref={inputRef}
        type="number"
        min={0}
        step={field === "qty" ? 1 : field === "discount" ? 0.01 : 0.01}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
        className={inputClass}
      />
    </PosModalShell>
  );
}

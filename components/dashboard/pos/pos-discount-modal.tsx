"use client";

import { useEffect, useState } from "react";
import type { InvoiceDiscountTiming } from "@/lib/sales/invoice-totals";
import { useTranslation } from "@/lib/localization";
import { PosModalShell } from "./pos-modal-shell";
import { ShortcutBadge } from "./shortcut-badge";

type PosDiscountModalProps = {
  open: boolean;
  discountValue: number;
  discountType: "percent" | "amount";
  discountTiming: InvoiceDiscountTiming;
  onClose: () => void;
  onSave: (value: {
    discountValue: number;
    discountType: "percent" | "amount";
    discountTiming: InvoiceDiscountTiming;
  }) => void;
};

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

export function PosDiscountModal({
  open,
  discountValue,
  discountType,
  discountTiming,
  onClose,
  onSave,
}: PosDiscountModalProps) {
  const { t } = useTranslation();
  const [percent, setPercent] = useState("0");
  const [amount, setAmount] = useState("0");
  const [timing, setTiming] = useState<InvoiceDiscountTiming>(discountTiming);

  useEffect(() => {
    if (!open) return;
    if (discountType === "percent") {
      setPercent(String(discountValue));
      setAmount("0");
    } else {
      setAmount(String(discountValue));
      setPercent("0");
    }
    setTiming(discountTiming);
  }, [open, discountValue, discountType, discountTiming]);

  const handleSave = () => {
    const percentNum = Number(percent) || 0;
    const amountNum = Number(amount) || 0;
    if (amountNum > 0) {
      onSave({ discountValue: amountNum, discountType: "amount", discountTiming: timing });
    } else {
      onSave({ discountValue: percentNum, discountType: "percent", discountTiming: timing });
    }
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
  }, [open, percent, amount, timing, onSave]);

  const footer = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-orange-1 text-sm font-bold text-white hover:bg-brand-orange-1/90"
      >
        {t("common.save")}
        <ShortcutBadge keys="F7" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50"
      >
        {t("common.cancel")}
        <ShortcutBadge keys="ESC" />
      </button>
    </div>
  );

  return (
    <PosModalShell open={open} title={t("dashboard.pos.addDiscount")} onClose={onClose} footer={footer}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-brand-primary">
            <input
              type="radio"
              name="discount-timing"
              checked={timing === "before_tax"}
              onChange={() => setTiming("before_tax")}
            />
            {t("dashboard.pos.discountBeforeTax")}
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-primary">
            <input
              type="radio"
              name="discount-timing"
              checked={timing === "after_tax"}
              onChange={() => setTiming("after_tax")}
            />
            {t("dashboard.pos.discountAfterTax")}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.pos.percentLabel")}
            </label>
            <input
              type="number"
              min={0}
              value={percent}
              onChange={(e) => {
                setPercent(e.target.value);
                setAmount("0");
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-primary-muted">
              {t("dashboard.pos.amountLabel")}
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setPercent("0");
              }}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </PosModalShell>
  );
}

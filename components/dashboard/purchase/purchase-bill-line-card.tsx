"use client";

import { LineDiscountField } from "@/components/dashboard/shared/line-discount-field";
import { PurchaseBillNumberStepper } from "@/components/dashboard/purchase/purchase-bill-number-stepper";
import { formatInr2 } from "@/components/dashboard/purchase/purchase-bill-summary";
import { useTranslation } from "@/lib/localization";

export type PurchaseBillDraftLine = {
  key: string;
  name: string;
  qty: number;
  pricePerItem: number;
  unit?: string;
  hsn?: string;
  gstPercent?: number;
  discount?: number;
  discountType?: "percent" | "amount";
  purchaseTaxMode?: "with_tax" | "without_tax";
};

export function PurchaseBillLineCard({
  line,
  amount,
  tax,
  onChange,
  onRemove,
}: {
  line: PurchaseBillDraftLine;
  amount: number;
  tax: number;
  onChange: (patch: Partial<PurchaseBillDraftLine>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const discountType = line.discountType === "amount" ? "amount" : "percent";
  const unit = line.unit?.trim() || "";
  const taxInclusive = line.purchaseTaxMode === "with_tax";

  return (
    <div className="rounded-md border border-slate-200/90 bg-white p-3 lg:p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-brand-primary">{line.name}</p>
          <p className="mt-0.5 text-xs text-brand-primary-muted">
            GST {Number(line.gstPercent) || 0}%{unit ? ` · ${unit}` : ""}
            {line.hsn?.trim() ? ` · ${t("dashboard.purchases.view.colHsn")} ${line.hsn.trim()}` : ""}
          </p>
        </div>
        <button
          type="button"
          title={t("dashboard.purchases.create.taxToggleHint")}
          onClick={() =>
            onChange({
              purchaseTaxMode: taxInclusive ? "without_tax" : "with_tax",
            })
          }
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            taxInclusive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-brand-primary"
          }`}
        >
          {taxInclusive
            ? t("dashboard.purchases.create.taxIncl")
            : t("dashboard.purchases.create.taxExcl")}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-red-50 hover:text-red-600"
          aria-label={t("dashboard.purchases.create.removeItem")}
        >
          ×
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PurchaseBillNumberStepper
          label={t("dashboard.purchases.create.colQty")}
          value={line.qty}
          suffix={unit || undefined}
          onChange={(qty) => onChange({ qty })}
          onStepToZero={onRemove}
          minusAria={t("dashboard.purchases.create.decreaseQty")}
          plusAria={t("dashboard.purchases.create.increaseQty")}
          valueAria={t("dashboard.purchases.create.colQty")}
        />
        <PurchaseBillNumberStepper
          label={t("dashboard.purchases.create.colRate")}
          value={line.pricePerItem}
          prefix="₹"
          min={0}
          minusDisabled={line.pricePerItem <= 0}
          onChange={(pricePerItem) => onChange({ pricePerItem })}
          minusAria={t("dashboard.purchases.create.decreaseRate")}
          plusAria={t("dashboard.purchases.create.increaseRate")}
          valueAria={t("dashboard.purchases.create.colRate")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <LineDiscountField
          discount={line.discount ?? 0}
          discountType={discountType}
          qty={line.qty}
          pricePerItem={line.pricePerItem}
          ariaLabel={t("dashboard.salesInvoices.create.colDiscount")}
          onChange={(next) => onChange(next)}
        />
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
            {t("dashboard.purchases.create.colAmount")}
          </p>
          <p className="text-lg font-extrabold tabular-nums text-brand-primary">{formatInr2(amount)}</p>
          <p className="text-[11px] tabular-nums text-brand-primary-muted">
            {t("dashboard.purchases.view.colTax")} {formatInr2(tax)}
          </p>
        </div>
      </div>
    </div>
  );
}

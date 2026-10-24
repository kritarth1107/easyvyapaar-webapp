"use client";

import { LineDiscountField } from "@/components/dashboard/shared/line-discount-field";
import { PurchaseBillNumberStepper } from "@/components/dashboard/purchase/purchase-bill-number-stepper";
import { formatInr, type InvoiceLineItem } from "@/lib/sales/create-invoice-form";
import {
  getInvoiceLineDisplay,
  normalizeSalesTaxMode,
  type SalesTaxMode,
} from "@/lib/sales/invoice-tax";
import { useTranslation } from "@/lib/localization";

export function SalesInvoiceLineCard({
  line,
  maxQty,
  selected,
  onSelect,
  onChange,
  onRemove,
}: {
  line: InvoiceLineItem;
  maxQty: number;
  selected?: boolean;
  onSelect?: () => void;
  onChange: (patch: Partial<InvoiceLineItem>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const salesTaxMode = normalizeSalesTaxMode(line.salesTaxMode);
  const taxInclusive = salesTaxMode === "with_tax";
  const unit = line.unit?.trim() || "";
  const serialised = Boolean(line.serialised);
  const serialLabel = (line.serialNumbers ?? []).filter((serial) => serial.trim()).join(", ");
  const display = getInvoiceLineDisplay({
    qty: line.qty,
    pricePerItem: line.pricePerItem,
    discount: line.discount,
    discountType: line.discountType,
    gstPercent: line.gstPercent,
    salesTaxMode,
  });

  return (
    <div
      onClick={onSelect}
      className={`rounded-md border bg-white p-3 lg:p-4 ${
        selected
          ? "border-brand-orange-1/50 ring-2 ring-brand-orange-1/15"
          : "border-slate-200/90"
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-brand-primary">{line.name}</p>
          <p className="mt-0.5 text-xs text-brand-primary-muted">
            GST {Number(line.gstPercent) || 0}%{unit ? ` · ${unit}` : ""}
            {line.hsn?.trim() ? ` · ${t("dashboard.salesInvoices.create.colHsn")} ${line.hsn.trim()}` : ""}
          </p>
          {serialLabel ? (
            <p className="mt-0.5 font-mono text-[11px] text-violet-700">S/N {serialLabel}</p>
          ) : null}
        </div>
        <button
          type="button"
          title={t("dashboard.salesInvoices.create.taxToggleHint")}
          onClick={(event) => {
            event.stopPropagation();
            const next: SalesTaxMode = taxInclusive ? "without_tax" : "with_tax";
            onChange({ salesTaxMode: next });
          }}
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            taxInclusive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-brand-primary"
          }`}
        >
          {taxInclusive
            ? t("dashboard.salesInvoices.create.taxIncl")
            : t("dashboard.salesInvoices.create.taxExcl")}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-brand-primary-muted hover:bg-red-50 hover:text-red-600"
          aria-label={t("dashboard.salesInvoices.create.removeItem")}
        >
          ×
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2" onClick={(event) => event.stopPropagation()}>
        <PurchaseBillNumberStepper
          label={t("dashboard.salesInvoices.create.colQty")}
          value={serialised ? 1 : line.qty}
          suffix={unit || undefined}
          max={serialised ? 1 : maxQty}
          plusDisabled={serialised || maxQty <= 0 || line.qty >= maxQty}
          onChange={(qty) => onChange({ qty })}
          onStepToZero={onRemove}
          minusAria={t("dashboard.salesInvoices.create.decreaseQty")}
          plusAria={t("dashboard.salesInvoices.create.increaseQty")}
          valueAria={t("dashboard.salesInvoices.create.colQty")}
        />
        <PurchaseBillNumberStepper
          label={t("dashboard.salesInvoices.create.colRate")}
          value={line.pricePerItem}
          prefix="₹"
          min={0}
          minusDisabled={line.pricePerItem <= 0}
          onChange={(pricePerItem) => onChange({ pricePerItem })}
          minusAria={t("dashboard.salesInvoices.create.decreaseRate")}
          plusAria={t("dashboard.salesInvoices.create.increaseRate")}
          valueAria={t("dashboard.salesInvoices.create.colRate")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3" onClick={(event) => event.stopPropagation()}>
        <LineDiscountField
          discount={line.discount}
          discountType={line.discountType}
          qty={line.qty}
          pricePerItem={line.pricePerItem}
          ariaLabel={t("dashboard.salesInvoices.create.colDiscount")}
          onChange={(next) => onChange(next)}
        />
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
            {t("dashboard.salesInvoices.create.colAmount")}
          </p>
          <p className="text-lg font-extrabold tabular-nums text-brand-primary">{formatInr(display.amount)}</p>
          <p className="text-[11px] tabular-nums text-brand-primary-muted">
            {t("dashboard.salesInvoices.create.colTax")} {formatInr(display.tax)}
          </p>
        </div>
      </div>
    </div>
  );
}

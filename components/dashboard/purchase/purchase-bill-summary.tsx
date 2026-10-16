"use client";

import { useTranslation } from "@/lib/localization";
import type { PurchaseBillDetail } from "@/lib/types/purchase-api";

const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInr2(value: number): string {
  return inr2.format(value);
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

type Row = { key: string; label: string; value: string; bold?: boolean; muted?: boolean; negative?: boolean };

/**
 * Bill-level summary that adds up to the grand total exactly as the backend computes it
 * (calcPurchaseTotals): subtotal + charges − discount (+ taxable when before tax) + GST + round-off = total,
 * then TDS → net payable.
 */
export function buildPurchaseBillSummaryRows(
  bill: PurchaseBillDetail,
  t: ReturnType<typeof useTranslation>["t"],
): Row[] {
  const rows: Row[] = [{ key: "subtotal", label: t("dashboard.purchaseSummary.subtotal"), value: formatInr2(bill.subtotal) }];
  bill.additionalCharges.forEach((charge, index) => {
    rows.push({
      key: `charge-${index}`,
      label: `${charge.label || t("dashboard.purchaseSummary.charge")}${
        charge.taxPercent > 0 ? ` (${fill(t("dashboard.purchaseSummary.chargeTax"), { rate: charge.taxPercent })})` : ""
      }`,
      value: formatInr2(charge.amount),
    });
  });
  const beforeTax = bill.discountTiming === "before_tax";
  if (bill.discountAmount > 0) {
    rows.push({
      key: "discount",
      label: beforeTax
        ? t("dashboard.purchaseSummary.discountBeforeTax")
        : t("dashboard.purchaseSummary.discountAfterTax"),
      value: `−${formatInr2(bill.discountAmount)}`,
      negative: true,
    });
  }
  if (beforeTax && bill.discountAmount > 0) {
    rows.push({ key: "taxable", label: t("dashboard.purchaseSummary.taxableAmount"), value: formatInr2(bill.taxableAmount), muted: true });
  }
  rows.push({ key: "lineTax", label: t("dashboard.purchaseSummary.itemsGst"), value: formatInr2(bill.lineTax) });
  if (bill.additionalChargesTax > 0) {
    rows.push({ key: "chargesTax", label: t("dashboard.purchaseSummary.chargesGst"), value: formatInr2(bill.additionalChargesTax) });
  }
  if (bill.roundOffAmount !== 0) {
    rows.push({ key: "roundOff", label: t("dashboard.purchaseSummary.roundOff"), value: formatInr2(bill.roundOffAmount) });
  }
  rows.push({ key: "total", label: t("dashboard.purchaseSummary.total"), value: formatInr2(bill.totalAmount), bold: true });
  if (bill.tdsAmount > 0) {
    rows.push({
      key: "tds",
      label: fill(t("dashboard.purchaseSummary.tds"), {
        section: bill.tdsSection ?? "",
        rate: bill.tdsRate,
        base: formatInr2(bill.tdsBaseAmount),
      }),
      value: `−${formatInr2(bill.tdsAmount)}`,
      negative: true,
    });
  }
  if ((bill.returnedAmount ?? 0) > 0) {
    rows.push({
      key: "returned",
      label: t("dashboard.paymentHistory.returned"),
      value: `−${formatInr2(bill.returnedAmount ?? 0)}`,
      negative: true,
    });
  }
  if (bill.tdsAmount > 0 || (bill.returnedAmount ?? 0) > 0) {
    // netPayable comes from the backend (already net of TDS and returns).
    rows.push({ key: "net", label: t("dashboard.purchaseSummary.netPayable"), value: formatInr2(bill.netPayable), bold: true });
  }
  return rows;
}

export function PurchaseBillSummary({ bill }: { bill: PurchaseBillDetail }) {
  const { t } = useTranslation();
  const rows = buildPurchaseBillSummaryRows(bill, t);
  return (
    <div className="ml-auto w-full max-w-sm rounded-sm border border-slate-200/90 bg-white p-4 text-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-primary-muted">
        {t("dashboard.purchaseSummary.title")}
      </p>
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`flex justify-between gap-3 ${row.bold ? "border-t border-slate-100 pt-1.5 font-bold text-brand-primary" : ""} ${
              row.muted ? "text-brand-primary-muted" : ""
            }`}
          >
            <dt>{row.label}</dt>
            <dd className={`tabular-nums ${row.negative ? "text-red-700" : ""}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

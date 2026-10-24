"use client";

import { formatInr2 } from "@/components/dashboard/purchase/purchase-bill-summary";
import { formatDateEnIn } from "@/lib/dashboard/date-format";
import { useTranslation } from "@/lib/localization";
import type { PurchaseBillDetail } from "@/lib/types/purchase-api";

function lineDiscountLabel(line: PurchaseBillDetail["lineItems"][number]): string | null {
  if (!line.discount) return null;
  return line.discountType === "percent" ? `${line.discount}%` : formatInr2(line.discount);
}

export function PurchaseBillDocument({
  bill,
  shopName,
  gstin,
}: {
  bill: PurchaseBillDetail;
  shopName: string;
  gstin?: string | null;
}) {
  const { t } = useTranslation();
  const displayShop = shopName.trim() || "—";
  const gst = gstin?.trim() || "";
  const paymentLabel =
    bill.paymentStatus === "paid"
      ? t("dashboard.purchases.paymentPaid")
      : bill.paymentStatus === "partial"
        ? t("dashboard.purchases.paymentPartial")
        : bill.paymentStatus === "pending"
          ? t("dashboard.purchases.paymentPending")
          : t("dashboard.purchases.paymentUnpaid");

  return (
    <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-brand-primary px-5 py-4">
        <div>
          <p className="text-lg font-bold uppercase tracking-tight text-brand-primary">{displayShop}</p>
          {gst ? (
            <p className="mt-1 text-xs text-brand-primary-muted">
              {t("dashboard.purchases.view.gstin")}: {gst}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-base font-bold uppercase text-brand-orange-2">
            {t("dashboard.purchases.view.documentTitle")}
          </p>
          <dl className="mt-2 space-y-0.5 text-xs">
            <div className="flex justify-end gap-2">
              <dt className="text-brand-primary-muted">{t("dashboard.purchases.view.billNo")}</dt>
              <dd className="font-semibold text-brand-primary">{bill.displayNumber}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt className="text-brand-primary-muted">{t("dashboard.purchases.colDate")}</dt>
              <dd className="font-semibold text-brand-primary">{formatDateEnIn(bill.billDate)}</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt className="text-brand-primary-muted">{t("dashboard.purchases.colStatus")}</dt>
              <dd className="font-semibold uppercase text-brand-primary">{paymentLabel}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary-muted">
          {t("dashboard.purchases.colSupplier")}
        </p>
        <p className="mt-0.5 text-sm font-bold text-brand-primary">{bill.partyName}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-brand-primary text-[10px] font-bold uppercase tracking-wide text-white">
              <th className="w-10 px-3 py-2.5 text-center">#</th>
              <th className="px-3 py-2.5 text-left">{t("dashboard.purchases.create.colItem")}</th>
              <th className="w-24 px-3 py-2.5 text-center">{t("dashboard.purchases.create.colQty")}</th>
              <th className="w-28 px-3 py-2.5 text-right">{t("dashboard.purchases.create.colRate")}</th>
              <th className="w-20 px-3 py-2.5 text-center">{t("dashboard.purchases.create.colGst")}</th>
              <th className="w-24 px-3 py-2.5 text-right">{t("dashboard.purchases.view.colTax")}</th>
              <th className="w-28 px-3 py-2.5 text-right">{t("dashboard.purchases.create.colAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((line, index) => {
              const discount = lineDiscountLabel(line);
              return (
                <tr key={line.lineId} className="border-b border-slate-100">
                  <td className="px-3 py-3 text-center tabular-nums text-brand-primary-muted">{index + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-brand-primary">{line.name}</p>
                    <p className="mt-0.5 text-[11px] text-brand-primary-muted">
                      {line.hsn?.trim()
                        ? `${t("dashboard.purchases.view.colHsn")}: ${line.hsn.trim()}`
                        : `${t("dashboard.purchases.view.colHsn")}: —`}
                      {discount ? ` · ${t("dashboard.salesInvoices.create.colDiscount")} ${discount}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-brand-primary">
                    {line.qty}
                    {line.unit ? ` ${line.unit}` : ""}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatInr2(line.pricePerItem)}</td>
                  <td className="px-3 py-3 text-center tabular-nums">{Number(line.gstPercent) || 0}%</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatInr2(line.tax)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatInr2(line.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-slate-200 px-5 py-4">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-brand-primary-muted">{t("dashboard.purchaseSummary.subtotal")}</dt>
            <dd className="tabular-nums">{formatInr2(bill.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-brand-primary-muted">{t("dashboard.purchases.view.colTax")}</dt>
            <dd className="tabular-nums">{formatInr2(bill.lineTax)}</dd>
          </div>
          {bill.discountAmount > 0 ? (
            <div className="flex justify-between gap-6 text-red-700">
              <dt>
                {bill.discountTiming === "before_tax"
                  ? t("dashboard.purchaseSummary.discountBeforeTax")
                  : t("dashboard.purchaseSummary.discountAfterTax")}
              </dt>
              <dd className="tabular-nums">−{formatInr2(bill.discountAmount)}</dd>
            </div>
          ) : null}
          {bill.roundOffAmount !== 0 ? (
            <div className="flex justify-between gap-6">
              <dt className="text-brand-primary-muted">{t("dashboard.purchaseSummary.roundOff")}</dt>
              <dd className="tabular-nums">{formatInr2(bill.roundOffAmount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-6 border-t border-slate-200 pt-2 text-base font-bold text-brand-primary">
            <dt>{t("dashboard.purchaseSummary.total")}</dt>
            <dd className="tabular-nums">{formatInr2(bill.totalAmount)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-brand-primary-muted">{t("dashboard.purchases.view.paid")}</dt>
            <dd className="tabular-nums">{formatInr2(bill.paidAmount)}</dd>
          </div>
          <div className="flex justify-between gap-6 font-bold text-brand-primary">
            <dt>{t("dashboard.purchases.view.balance")}</dt>
            <dd className="tabular-nums">{formatInr2(bill.balanceAmount)}</dd>
          </div>
        </dl>
      </div>

      {bill.notes?.trim() ? (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-brand-primary-muted">
          <span className="font-semibold">{t("dashboard.purchases.create.notes")}:</span> {bill.notes.trim()}
        </p>
      ) : null}
    </div>
  );
}

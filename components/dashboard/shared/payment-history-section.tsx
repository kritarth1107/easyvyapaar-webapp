"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/localization";
import type { PaymentHistoryEntry } from "@/lib/api/payment-history";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

/** Payment history for an invoice / purchase bill. Voucher payments link to the payment. */
export function PaymentHistorySection({ entries }: { entries?: PaymentHistoryEntry[] }) {
  const { t, locale } = useTranslation();
  if (!entries || entries.length === 0) return null;
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : new Intl.DateTimeFormat(`${locale}-IN`, { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d);
  };
  return (
    <section className="mt-6 overflow-hidden rounded-sm border border-slate-200/90 bg-white">
      <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-brand-primary">
        {t("dashboard.paymentHistory.title")}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-brand-surface/50 text-[11px] uppercase text-brand-primary-muted">
            <th className="px-4 py-2 text-left">{t("dashboard.paymentHistory.date")}</th>
            <th className="px-4 py-2 text-left">{t("dashboard.paymentHistory.mode")}</th>
            <th className="px-4 py-2 text-left">{t("dashboard.paymentHistory.source")}</th>
            <th className="px-4 py-2 text-right">{t("dashboard.paymentHistory.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row, idx) => (
            <tr key={`${row.paidAt}-${idx}`} className="border-b border-slate-50 last:border-b-0">
              <td className="px-4 py-2">{fmtDate(row.paidAt)}</td>
              <td className="px-4 py-2 uppercase">{row.paymentMode}</td>
              <td className="px-4 py-2">
                {row.source === "voucher" && row.paymentId ? (
                  <Link
                    href={`/dashboard/finance/payments/${encodeURIComponent(row.paymentId)}`}
                    className="font-semibold text-brand-orange-2 hover:underline"
                  >
                    {t("dashboard.paymentHistory.voucher")}
                  </Link>
                ) : row.source === "voucher" ? (
                  t("dashboard.paymentHistory.voucher")
                ) : (
                  t("dashboard.paymentHistory.direct")
                )}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{inr.format(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

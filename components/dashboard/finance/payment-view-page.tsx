"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { fetchFinancePaymentDetail } from "@/lib/finance/finance-payments-api-client";
import type { FinancePaymentDetail, FinancePaymentMode, FinancePaymentType } from "@/lib/types/finance-payments-api";
import { useTranslation } from "@/lib/localization";
import type { TranslationKey } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TypeBadge({ paymentType }: { paymentType: FinancePaymentType }) {
  const { t } = useTranslation();
  const isIn = paymentType === "payment_in";
  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        isIn
          ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
          : "bg-orange-50 text-orange-900 ring-orange-600/15"
      }`}
    >
      {isIn ? t("dashboard.financePayments.typeIn") : t("dashboard.financePayments.typeOut")}
    </span>
  );
}

function paymentModeLabel(mode: FinancePaymentMode, t: (key: TranslationKey) => string): string {
  const map: Record<FinancePaymentMode, TranslationKey> = {
    cash: "dashboard.financePayments.modeCash",
    upi: "dashboard.financePayments.modeUpi",
    card: "dashboard.financePayments.modeCard",
    bank: "dashboard.financePayments.modeBank",
    cheque: "dashboard.financePayments.modeCheque",
  };
  return t(map[mode]);
}

export function PaymentViewPage({ paymentId }: { paymentId: string }) {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [payment, setPayment] = useState<FinancePaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !paymentId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const detail = await fetchFinancePaymentDetail(orgId, paymentId.trim());
      setPayment(detail);
    } catch (err) {
      setPayment(null);
      setError(err instanceof Error ? err.message : t("dashboard.financePayments.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, paymentId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-4 lg:p-6">
        <Link
          href="/dashboard/finance/payments"
          className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
        >
          ← {t("dashboard.financePayments.backToList")}
        </Link>
        <p className="mt-4 text-sm text-red-600">{error ?? t("dashboard.financePayments.view.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/finance/payments"
          className="text-sm font-medium text-brand-primary-muted transition-colors hover:text-brand-primary"
        >
          ← {t("dashboard.financePayments.backToList")}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
              {t("dashboard.financePayments.view.title").replace("{number}", payment.displayNumber)}
            </h2>
            <p className="mt-1 text-sm text-brand-primary-mid">
              {formatDate(payment.paymentDate)} · {payment.partyName}
            </p>
          </div>
          <TypeBadge paymentType={payment.paymentType} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label={t("dashboard.financePayments.view.amount")} value={formatInr(payment.amount)} />
        <InfoCard
          label={t("dashboard.financePayments.view.paymentMode")}
          value={paymentModeLabel(payment.paymentMode, t)}
        />
        <InfoCard
          label={t("dashboard.financePayments.view.unallocated")}
          value={formatInr(payment.unallocatedAmount)}
        />
        {payment.referenceNumber ? (
          <InfoCard label={t("dashboard.financePayments.view.reference")} value={payment.referenceNumber} mono />
        ) : null}
      </div>

      {payment.notes ? (
        <div className="mb-6 rounded-sm border border-slate-200/90 bg-white p-4">
          <p className="text-sm text-brand-primary">
            <span className="font-semibold">{t("dashboard.financePayments.view.notes")}: </span>
            {payment.notes}
          </p>
        </div>
      ) : null}

      {payment.allocations.length > 0 ? (
        <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-brand-primary">
              {t("dashboard.financePayments.view.allocations")}
            </h3>
          </div>
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                  <th className="px-4 py-3">{t("dashboard.financePayments.view.colInvoice")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.financePayments.view.colAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {payment.allocations.map((row) => (
                  <tr key={`${row.invoiceId}-${row.amount}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/sales/invoices/${encodeURIComponent(row.invoiceId)}`}
                        className="font-mono text-xs font-semibold text-brand-primary hover:underline"
                      >
                        {row.invoiceDisplayNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-primary">
                      {formatInr(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/parties/${encodeURIComponent(payment.partyId)}`}
          className="inline-flex h-9 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-medium text-brand-primary transition-colors hover:bg-slate-50"
        >
          {t("dashboard.financePayments.view.viewParty")}
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-sm border border-slate-200/90 bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-brand-primary ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

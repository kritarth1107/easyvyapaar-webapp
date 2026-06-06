"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchFinancePayments } from "@/lib/finance/finance-payments-api-client";
import {
  getAdjustmentLabelKey,
  getPaymentActivityHref,
  getPaymentSourceLabelKey,
} from "@/lib/finance/payment-activity-utils";
import type { FinancePaymentSummary, FinancePaymentType } from "@/lib/types/finance-payments-api";
import { useTranslation } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "navy" | "green" | "amber" }) {
  const ring =
    accent === "green"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : accent === "amber"
        ? "border-amber-200/80 bg-amber-50/30"
        : accent === "navy"
          ? "border-brand-primary/15 bg-brand-primary/[0.03]"
          : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
    </div>
  );
}

function TypeBadge({ paymentType }: { paymentType: FinancePaymentType }) {
  const { t } = useTranslation();
  const isIn = paymentType === "payment_in";
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        isIn
          ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
          : "bg-orange-50 text-orange-900 ring-orange-600/15"
      }`}
    >
      {isIn ? t("dashboard.financePayments.typeIn") : t("dashboard.financePayments.typeOut")}
    </span>
  );
}

function SourceBadge({ payment }: { payment: FinancePaymentSummary }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
      {t(getPaymentSourceLabelKey(payment.sourceType))}
    </span>
  );
}

export function PaymentsPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [paymentType, setPaymentType] = useState<string>("all");
  const [payments, setPayments] = useState<FinancePaymentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setPayments([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchFinancePayments(orgId, {
        paymentType: paymentType as FinancePaymentType | "all",
        search: query.trim() || undefined,
        limit: 200,
        page: 1,
      });
      setPayments(data.items);
    } catch (err) {
      setPayments([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.financePayments.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, paymentType, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayIn = 0;
    let todayOut = 0;
    let monthIn = 0;

    for (const row of payments) {
      if (row.paymentDate === today) {
        if (row.paymentType === "payment_in") todayIn += row.amount;
        else todayOut += row.amount;
      }
      if (row.paymentDate.startsWith(monthPrefix) && row.paymentType === "payment_in") {
        monthIn += row.amount;
      }
    }

    return { todayIn, todayOut, monthIn, totalCount: payments.length };
  }, [payments]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.financePayments.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.payments")}
          </h2>
        </div>
        <Link
          href="/dashboard/finance/payments/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.financePayments.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.financePayments.todayIn")} value={formatInr(summary.todayIn)} accent="green" />
        <StatCard label={t("dashboard.financePayments.todayOut")} value={formatInr(summary.todayOut)} accent="amber" />
        <StatCard label={t("dashboard.financePayments.monthIn")} value={formatInr(summary.monthIn)} accent="navy" />
        <StatCard label={t("dashboard.financePayments.totalCount")} value={String(summary.totalCount)} />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.financePayments.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.financePayments.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[140px] shrink-0 sm:w-[160px]">
            <ModernSelect
              value={paymentType}
              onChange={setPaymentType}
              options={[
                { value: "all", label: t("dashboard.financePayments.allTypes") },
                { value: "payment_in", label: t("dashboard.financePayments.typeIn") },
                { value: "payment_out", label: t("dashboard.financePayments.typeOut") },
              ]}
              aria-label={t("dashboard.financePayments.filterType")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[1080px] text-left text-sm text-brand-primary">
            <thead>
              <tr className="border-b border-slate-200 bg-brand-surface/60 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">{t("dashboard.financePayments.colReference")}</th>
                <th className="px-4 py-3">{t("dashboard.financePayments.colSource")}</th>
                <th className="px-4 py-3">{t("dashboard.financePayments.colType")}</th>
                <th className="px-4 py-3">{t("dashboard.financePayments.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.financePayments.colParty")}</th>
                <th className="px-4 py-3">{t("dashboard.financePayments.colMode")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.financePayments.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.financePayments.empty")}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => <PaymentRow key={payment.entryId} payment={payment} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: FinancePaymentSummary }) {
  const { t } = useTranslation();
  const router = useRouter();
  const href = getPaymentActivityHref(payment);
  const adjustmentKey = getAdjustmentLabelKey(payment.adjustmentLabel);

  const openPayment = () => {
    router.push(href);
  };

  const modeLabel = (mode: FinancePaymentSummary["paymentMode"]) => {
    const map: Record<FinancePaymentSummary["paymentMode"], string> = {
      cash: t("dashboard.financePayments.modeCash"),
      upi: t("dashboard.financePayments.modeUpi"),
      card: t("dashboard.financePayments.modeCard"),
      bank: t("dashboard.financePayments.modeBank"),
      cheque: t("dashboard.financePayments.modeCheque"),
    };
    return map[mode];
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/40 hover:[&_span]:underline"
      onClick={openPayment}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPayment();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open payment ${payment.displayNumber}`}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-brand-primary underline-offset-2">
          {payment.displayNumber}
        </span>
        {payment.invoiceDisplayNumber ? (
          <p className="mt-0.5 font-mono text-[10px] text-brand-primary-muted">
            {t("dashboard.financePayments.invoiceRef")}: {payment.invoiceDisplayNumber}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <SourceBadge payment={payment} />
      </td>
      <td className="px-4 py-3">
        <TypeBadge paymentType={payment.paymentType} />
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(payment.paymentDate)}</td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{payment.partyName}</p>
        {payment.partyPhone ? (
          <p className="text-xs text-brand-primary-muted">{payment.partyPhone}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{modeLabel(payment.paymentMode)}</td>
      <td className="px-4 py-3 text-right">
        <p
          className={`font-semibold tabular-nums ${
            payment.paymentType === "payment_in" ? "text-emerald-700" : "text-orange-700"
          }`}
        >
          {payment.paymentType === "payment_in" ? "+" : "−"}
          {formatInr(payment.amount)}
        </p>
        {payment.grossAmount !== undefined &&
        payment.refundedAmount !== undefined &&
        payment.refundedAmount > 0 ? (
          <p className="mt-0.5 text-[10px] text-brand-primary-muted">
            {t("dashboard.financePayments.grossPaid")} {formatInr(payment.grossAmount)} ·{" "}
            <span className="text-amber-700">
              −{formatInr(payment.refundedAmount)} {adjustmentKey ? t(adjustmentKey) : ""}
            </span>
          </p>
        ) : adjustmentKey ? (
          <p className="mt-0.5 text-[10px] text-amber-700">{t(adjustmentKey)}</p>
        ) : null}
      </td>
    </tr>
  );
}

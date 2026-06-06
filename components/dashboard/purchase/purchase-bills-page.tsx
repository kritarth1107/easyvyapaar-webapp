"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDate, formatInr, StatCard } from "@/lib/dashboard/page-utils";
import { fetchPurchaseBills } from "@/lib/purchase/purchases-api-client";
import type { PurchaseBillSummary, PurchaseBillStatus, PurchasePaymentStatus } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

function PaymentBadge({ status }: { status: PurchasePaymentStatus }) {
  const { t } = useTranslation();
  const styles: Record<PurchasePaymentStatus, string> = {
    paid: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    partial: "bg-amber-50 text-amber-900 ring-amber-600/15",
    pending: "bg-blue-50 text-blue-800 ring-blue-600/15",
    unpaid: "bg-red-50 text-red-800 ring-red-600/15",
  };
  const labels: Record<PurchasePaymentStatus, string> = {
    paid: t("dashboard.purchases.paymentPaid"),
    partial: t("dashboard.purchases.paymentPartial"),
    pending: t("dashboard.purchases.paymentPending"),
    unpaid: t("dashboard.purchases.paymentUnpaid"),
  };
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function StatusBadge({ status }: { status: PurchaseBillStatus }) {
  const { t } = useTranslation();
  const styles: Record<PurchaseBillStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    cancelled: "bg-red-50 text-red-800 ring-red-600/15",
  };
  const labels: Record<PurchaseBillStatus, string> = {
    draft: t("dashboard.purchases.statusDraft"),
    completed: t("dashboard.purchases.statusCompleted"),
    cancelled: t("dashboard.purchases.statusCancelled"),
  };
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function PurchaseBillsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [status, setStatus] = useState("all");
  const [bills, setBills] = useState<PurchaseBillSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setBills([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPurchaseBills(orgId, {
        paymentStatus: paymentStatus as PurchasePaymentStatus | "all",
        status: status as PurchaseBillStatus | "all",
        search: query.trim() || undefined,
        limit: 100,
        page: 1,
      });
      setBills(data.items);
    } catch (err) {
      setBills([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.purchases.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, paymentStatus, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayTotal = 0;
    let monthTotal = 0;
    let pendingTotal = 0;
    for (const row of bills) {
      if (row.billDate === today) todayTotal += row.totalAmount;
      if (row.billDate.startsWith(monthPrefix)) monthTotal += row.totalAmount;
      if (row.paymentStatus === "pending" || row.paymentStatus === "partial" || row.paymentStatus === "unpaid") {
        pendingTotal += row.balanceAmount;
      }
    }
    return { todayTotal, monthTotal, pendingTotal, totalCount: bills.length };
  }, [bills]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.purchases.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.purchases")}
          </h2>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">+</span>
          {t("dashboard.purchases.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.purchases.todayTotal")} value={formatInr(summary.todayTotal)} accent="navy" />
        <StatCard label={t("dashboard.purchases.monthTotal")} value={formatInr(summary.monthTotal)} accent="green" />
        <StatCard label={t("dashboard.purchases.pendingPayable")} value={formatInr(summary.pendingTotal)} accent="amber" />
        <StatCard label={t("dashboard.purchases.totalCount")} value={String(summary.totalCount)} />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.purchases.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.purchases.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[140px] shrink-0 sm:w-[160px]">
            <ModernSelect
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={[
                { value: "all", label: t("dashboard.purchases.allPaymentStatuses") },
                { value: "paid", label: t("dashboard.purchases.paymentPaid") },
                { value: "partial", label: t("dashboard.purchases.paymentPartial") },
                { value: "pending", label: t("dashboard.purchases.paymentPending") },
                { value: "unpaid", label: t("dashboard.purchases.paymentUnpaid") },
              ]}
              aria-label={t("dashboard.purchases.filterPaymentStatus")}
            />
          </div>
          <div className="w-full min-w-[140px] shrink-0 sm:w-[160px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.purchases.allStatuses") },
                { value: "draft", label: t("dashboard.purchases.statusDraft") },
                { value: "completed", label: t("dashboard.purchases.statusCompleted") },
                { value: "cancelled", label: t("dashboard.purchases.statusCancelled") },
              ]}
              aria-label={t("dashboard.purchases.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.purchases.colBill")}</th>
                <th className="px-4 py-3">{t("dashboard.purchases.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.purchases.colSupplier")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.purchases.colAmount")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.purchases.colBalance")}</th>
                <th className="px-4 py-3">{t("dashboard.purchases.colPayment")}</th>
                <th className="px-4 py-3">{t("dashboard.purchases.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              )}
              {!loading && loadError && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-red-600">{loadError}</td>
                </tr>
              )}
              {!loading && !loadError && bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-primary-muted">
                    {t("dashboard.purchases.empty")}
                  </td>
                </tr>
              )}
              {!loading &&
                bills.map((bill) => (
                  <tr
                    key={bill.purchaseBillId}
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-brand-surface/40"
                    onClick={() => router.push(`/dashboard/purchases/${bill.purchaseBillId}`)}
                  >
                    <td className="px-4 py-3 font-semibold text-brand-primary">{bill.displayNumber}</td>
                    <td className="px-4 py-3 text-brand-primary-muted">{formatDate(bill.billDate)}</td>
                    <td className="px-4 py-3">{bill.partyName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatInr(bill.totalAmount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInr(bill.balanceAmount)}</td>
                    <td className="px-4 py-3"><PaymentBadge status={bill.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

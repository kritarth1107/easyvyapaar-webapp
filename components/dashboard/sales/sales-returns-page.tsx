"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchSalesReturns } from "@/lib/sales/sales-returns-api-client";
import type { SalesReturnStatus, SalesReturnSummary } from "@/lib/types/sales-returns-api";
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

function StatusBadge({ status }: { status: SalesReturnStatus }) {
  const { t } = useTranslation();
  const styles: Record<SalesReturnStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    cancelled: "bg-red-50 text-red-800 ring-red-600/15",
  };
  const labels: Record<SalesReturnStatus, string> = {
    draft: t("dashboard.salesReturns.statusDraft"),
    completed: t("dashboard.salesReturns.statusCompleted"),
    cancelled: t("dashboard.salesReturns.statusCancelled"),
  };

  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function SalesReturnsPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [returns, setReturns] = useState<SalesReturnSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setReturns([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSalesReturns(orgId, {
        status: status as SalesReturnStatus | "all",
        search: query.trim() || undefined,
        limit: 100,
        page: 1,
      });
      setReturns(data.items);
    } catch (err) {
      setReturns([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.salesReturns.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayTotal = 0;
    let monthTotal = 0;
    let completedCount = 0;

    for (const row of returns) {
      if (row.returnDate === today) todayTotal += row.totalAmount;
      if (row.returnDate.startsWith(monthPrefix)) monthTotal += row.totalAmount;
      if (row.status === "completed") completedCount += 1;
    }

    return { todayTotal, monthTotal, totalCount: returns.length, completedCount };
  }, [returns]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.salesReturns.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.salesReturns")}
          </h2>
        </div>
        <Link
          href="/dashboard/sales/sales-returns/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.salesReturns.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.salesReturns.todayTotal")} value={formatInr(summary.todayTotal)} accent="green" />
        <StatCard label={t("dashboard.salesReturns.monthTotal")} value={formatInr(summary.monthTotal)} accent="navy" />
        <StatCard label={t("dashboard.salesReturns.totalCount")} value={String(summary.totalCount)} />
        <StatCard
          label={t("dashboard.salesReturns.completedCount")}
          value={String(summary.completedCount)}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.salesReturns.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.salesReturns.searchPlaceholder")}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[160px] shrink-0 sm:w-[180px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.salesReturns.allStatuses") },
                { value: "completed", label: t("dashboard.salesReturns.statusCompleted") },
                { value: "draft", label: t("dashboard.salesReturns.statusDraft") },
                { value: "cancelled", label: t("dashboard.salesReturns.statusCancelled") },
              ]}
              aria-label={t("dashboard.salesReturns.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.salesReturns.colReturn")}</th>
                <th className="px-4 py-3">{t("dashboard.salesReturns.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.salesReturns.colInvoice")}</th>
                <th className="px-4 py-3">{t("dashboard.salesReturns.colParty")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.salesReturns.colAmount")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.salesReturns.colRefund")}</th>
                <th className="px-4 py-3">{t("dashboard.salesReturns.colStatus")}</th>
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
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.salesReturns.empty")}
                  </td>
                </tr>
              ) : (
                returns.map((salesReturn) => (
                  <SalesReturnRow key={salesReturn.salesReturnId} salesReturn={salesReturn} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SalesReturnRow({ salesReturn }: { salesReturn: SalesReturnSummary }) {
  const router = useRouter();
  const href = `/dashboard/sales/sales-returns/${encodeURIComponent(salesReturn.salesReturnId)}`;

  const openReturn = () => {
    router.push(href);
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/40 hover:[&_span]:underline"
      onClick={openReturn}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openReturn();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open sales return ${salesReturn.displayNumber}`}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-brand-primary underline-offset-2">
          {salesReturn.displayNumber}
        </span>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(salesReturn.returnDate)}</td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-brand-primary-mid">{salesReturn.invoiceDisplayNumber}</span>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{salesReturn.partyName}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums text-brand-primary">{formatInr(salesReturn.totalAmount)}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="tabular-nums text-brand-primary-mid">{formatInr(salesReturn.refundAmount)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={salesReturn.status} />
      </td>
    </tr>
  );
}

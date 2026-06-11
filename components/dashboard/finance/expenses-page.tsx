"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { CreateExpenseModal } from "@/components/dashboard/finance/create-expense-modal";
import { formatDate, formatInr, StatCard } from "@/lib/dashboard/page-utils";
import { fetchExpenses } from "@/lib/finance/expenses-api-client";
import type { ExpenseSummary } from "@/lib/types/expenses-api";
import { useTranslation } from "@/lib/localization";

export function ExpensesPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [query, setQuery] = useState("");
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return setExpenses([]);
    setLoading(true);
    try {
      const data = await fetchExpenses(orgId, { search: query.trim() || undefined, limit: 100, page: 1 });
      setExpenses(data.items);
      setLoadError(null);
    } catch (err) {
      setExpenses([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.expenses.empty"));
    } finally {
      setLoading(false);
    }
  }, [orgId, query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayTotal = 0;
    let monthTotal = 0;
    for (const row of expenses) {
      if (row.expenseDate === today) todayTotal += row.amount;
      if (row.expenseDate.startsWith(monthPrefix)) monthTotal += row.amount;
    }
    return { todayTotal, monthTotal, totalCount: expenses.length };
  }, [expenses]);

  return (
    <div className="p-4 lg:p-6">
      <CreateExpenseModal
        open={createOpen}
        organisationId={orgId}
        onClose={() => setCreateOpen(false)}
        onSaved={() => void load()}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.expenses.subtitle")}</p>
          <h2 className="text-xl font-bold text-brand-primary">{t("dashboard.nav.expenses")}</h2>
        </div>
        <button
          type="button"
          disabled={!orgId}
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
        >
          + {t("dashboard.expenses.createNew")}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("dashboard.expenses.todayTotal")} value={formatInr(summary.todayTotal)} accent="amber" />
        <StatCard label={t("dashboard.expenses.monthTotal")} value={formatInr(summary.monthTotal)} accent="navy" />
        <StatCard label={t("dashboard.expenses.totalCount")} value={String(summary.totalCount)} />
      </div>

      <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
        <div className="border-b border-slate-100 p-4">
          <label className="block">
            <span className="sr-only">{t("dashboard.expenses.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.expenses.searchPlaceholder")}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.expenses.colVoucher")}</th>
                <th className="px-4 py-3">{t("dashboard.expenses.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.expenses.colCategory")}</th>
                <th className="px-4 py-3">{t("dashboard.expenses.colDescription")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.expenses.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : null}
              {!loading && loadError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-red-600">{loadError}</td>
                </tr>
              ) : null}
              {!loading && !loadError && expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-primary-muted">
                    {t("dashboard.expenses.empty")}
                  </td>
                </tr>
              ) : null}
              {!loading &&
                expenses.map((exp) => (
                  <tr key={exp.expenseId} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-brand-primary">{exp.displayNumber}</td>
                    <td className="px-4 py-3 text-brand-primary-muted">{formatDate(exp.expenseDate)}</td>
                    <td className="px-4 py-3">{exp.categoryName}</td>
                    <td className="px-4 py-3 text-brand-primary-muted">{exp.description ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatInr(exp.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

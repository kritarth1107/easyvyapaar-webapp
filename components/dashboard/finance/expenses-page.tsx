"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatDate, formatInr, StatCard } from "@/lib/dashboard/page-utils";
import { fetchExpenses } from "@/lib/finance/expenses-api-client";
import type { ExpenseSummary } from "@/lib/types/expenses-api";
import { useTranslation } from "@/lib/localization";

export function ExpensesPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return setExpenses([]);
    setLoading(true);
    try {
      const data = await fetchExpenses(orgId, { search: query.trim() || undefined, limit: 100, page: 1 });
      setExpenses(data.items);
    } catch (err) {
      setExpenses([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.expenses.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

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
      <div className="mb-6 flex justify-between">
        <div><p className="text-sm text-brand-primary-muted">{t("dashboard.expenses.subtitle")}</p><h2 className="text-xl font-bold">{t("dashboard.nav.expenses")}</h2></div>
        <Link href="/dashboard/finance/expenses/new" className="inline-flex h-10 items-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white">+ {t("dashboard.expenses.createNew")}</Link>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label={t("dashboard.expenses.todayTotal")} value={formatInr(summary.todayTotal)} accent="amber" />
        <StatCard label={t("dashboard.expenses.monthTotal")} value={formatInr(summary.monthTotal)} accent="navy" />
        <StatCard label={t("dashboard.expenses.totalCount")} value={String(summary.totalCount)} />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b p-4"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dashboard.expenses.searchPlaceholder")} className="h-10 w-full rounded-sm border px-3 text-sm" /></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.expenses.colVoucher")}</th><th className="px-4 py-3">{t("dashboard.expenses.colDate")}</th><th className="px-4 py-3">{t("dashboard.expenses.colCategory")}</th><th className="px-4 py-3">{t("dashboard.expenses.colDescription")}</th><th className="px-4 py-3 text-right">{t("dashboard.expenses.colAmount")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && loadError && <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{loadError}</td></tr>}
            {!loading && expenses.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.expenses.empty")}</td></tr>}
            {!loading && expenses.map((exp) => (
              <tr key={exp.expenseId} className="border-b"><td className="px-4 py-3 font-semibold">{exp.displayNumber}</td><td className="px-4 py-3">{formatDate(exp.expenseDate)}</td><td className="px-4 py-3">{exp.categoryName}</td><td className="px-4 py-3">{exp.description ?? "—"}</td><td className="px-4 py-3 text-right">{formatInr(exp.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

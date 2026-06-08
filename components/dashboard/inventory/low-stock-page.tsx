"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  ChartLegend,
  DonutChart,
  HorizontalBarChart,
} from "@/components/dashboard/inventory/stock-summary-charts";
import {
  computeLowStockAnalytics,
  formatInr,
  type AlertPriority,
  type LowStockAlertRow,
} from "@/lib/dashboard/low-stock-analytics";
import { useInventoryItems } from "@/lib/inventory/use-inventory-items";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 3.5 16.5 15.5H3.5L10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M10 8.5v3.5M10 14h.01" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "amber" | "red" | "navy";
}) {
  const border =
    variant === "amber"
      ? "border-amber-200/90 bg-amber-50/30"
      : variant === "red"
        ? "border-red-200/90 bg-red-50/25"
        : variant === "navy"
          ? "border-brand-primary/15 bg-brand-primary/[0.03]"
          : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${border}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-primary-muted">{sub}</p>}
    </div>
  );
}

function PriorityBadge({ priority, label }: { priority: AlertPriority; label: string }) {
  const styles: Record<AlertPriority, string> = {
    critical: "bg-red-50 text-red-800 ring-red-600/20",
    warning: "bg-amber-50 text-amber-900 ring-amber-600/20",
    watch: "bg-slate-100 text-slate-700 ring-slate-400/25",
  };
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${styles[priority]}`}
    >
      {label}
    </span>
  );
}

function StockFillBar({ fillPct, priority }: { fillPct: number; priority: AlertPriority }) {
  const color =
    priority === "critical" ? "#DC2626" : priority === "warning" ? "#F59E0B" : "#64748B";
  return (
    <div className="min-w-[100px]">
      <div className="h-2 overflow-hidden rounded-sm bg-slate-100">
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-0.5 text-right text-[10px] font-semibold tabular-nums text-brand-primary-muted">
        {fillPct.toFixed(0)}%
      </p>
    </div>
  );
}

function AlertRowCard({
  row,
  priorityLabel,
  daysLabel,
  onReorder,
}: {
  row: LowStockAlertRow;
  priorityLabel: string;
  daysLabel: string;
  onReorder: () => void;
}) {
  const { t } = useTranslation();
  const { item } = row;

  return (
    <tr className="border-b border-slate-100 last:border-0 transition-colors hover:bg-amber-50/20">
      <td className="px-4 py-3.5">
        <p className="font-semibold text-brand-primary">{item.name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-brand-primary-muted">{item.sku}</p>
        <p className="mt-1 text-[11px] text-brand-primary-muted">{daysLabel}</p>
      </td>
      <td className="px-4 py-3.5 text-brand-primary-mid">{item.category}</td>
      <td className="px-4 py-3.5">
        <p className="font-bold tabular-nums text-brand-primary">
          {item.stock} <span className="text-xs font-medium text-brand-primary-muted">{item.unit}</span>
        </p>
      </td>
      <td className="px-4 py-3.5 tabular-nums text-brand-primary-muted">{row.reorderLevel}</td>
      <td className="px-4 py-3.5 font-semibold tabular-nums text-red-700">-{row.deficit}</td>
      <td className="px-4 py-3.5">
        <StockFillBar fillPct={row.fillPct} priority={row.priority} />
      </td>
      <td className="px-4 py-3.5">
        <PriorityBadge priority={row.priority} label={priorityLabel} />
      </td>
      <td className="px-4 py-3.5 tabular-nums font-medium text-brand-orange-2">
        +{row.suggestedReorderQty} {item.unit}
      </td>
      <td className="px-4 py-3.5 text-right tabular-nums text-brand-primary">{formatInr(row.stockValue)}</td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onReorder}
            className="h-8 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-3 text-xs font-semibold text-white hover:brightness-105"
          >
            {t("dashboard.lowStockPage.reorder")}
          </button>
          <Link
            href={`/dashboard/inventory/items/${encodeURIComponent(item.id)}`}
            className="inline-flex h-8 items-center rounded-md border border-slate-200/90 px-3 text-xs font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.lowStockPage.viewItem")}
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function LowStockPage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const { items, loading, error } = useInventoryItems(activeOrganisationId, {
    stockStatus: "low_stock",
    limit: 100,
    page: 1,
  });
  const analytics = useMemo(() => computeLowStockAnalytics(items), [items]);
  const isLoading = isWorkspaceLoading || loading;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"stock" | "deficit" | "name">("deficit");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of analytics.lowStockItems) set.add(r.item.category);
    for (const i of analytics.outOfStockItems) set.add(i.category);
    return ["all", ...Array.from(set).sort()];
  }, [analytics]);

  const priorityLabels: Record<AlertPriority, string> = {
    critical: t("dashboard.lowStockPage.critical"),
    warning: t("dashboard.lowStockPage.warning"),
    watch: t("dashboard.lowStockPage.watch"),
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = analytics.lowStockItems.filter((row) => {
      if (category !== "all" && row.item.category !== category) return false;
      if (!q) return true;
      const { item } = row;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
    if (sort === "stock") rows = [...rows].sort((a, b) => a.item.stock - b.item.stock);
    else if (sort === "deficit") rows = [...rows].sort((a, b) => b.deficit - a.deficit);
    else rows = [...rows].sort((a, b) => a.item.name.localeCompare(b.item.name));
    return rows;
  }, [analytics.lowStockItems, query, category, sort]);

  const filteredOut = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analytics.outOfStockItems.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [analytics.outOfStockItems, query, category]);

  const hasAlerts =
    analytics.totals.lowStockCount > 0 || analytics.totals.outOfStockCount > 0;

  const router = useRouter();

  const handleReorder = () => {
    router.push("/dashboard/purchases/purchase-orders/new");
  };

  return (
    <div className="p-4 lg:p-6">
      {!activeOrganisationId && !isWorkspaceLoading && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.inventory.noOrganisation")}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          {t("dashboard.inventory.loadError")}
        </p>
      )}
      {isLoading && (
        <p className="mb-4 text-sm text-brand-primary-muted">{t("dashboard.inventory.loading")}</p>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/inventory/items"
            className="text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
          >
            ← {t("dashboard.lowStockPage.backToItems")}
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.lowStockPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-primary-muted">
            {t("dashboard.lowStockPage.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReorder}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.4)] hover:brightness-105"
          >
            {t("dashboard.lowStockPage.createPurchase")}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.lowStockPage.exportList")}
          </button>
          <Link
            href="/dashboard/inventory/stock-summary"
            className="inline-flex h-10 items-center rounded-md border border-brand-primary/20 bg-brand-primary/[0.04] px-4 text-sm font-semibold text-brand-primary hover:bg-brand-primary/[0.08]"
          >
            {t("dashboard.lowStockPage.viewStockSummary")}
          </Link>
        </div>
      </div>

      {!hasAlerts ? (
        <div className="rounded-md border border-emerald-200/80 bg-emerald-50/50 px-6 py-12 text-center">
          <p className="text-lg font-bold text-emerald-800">{t("dashboard.lowStockPage.allClearTitle")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-emerald-900/80">
            {t("dashboard.lowStockPage.allClearHint")}
          </p>
          <Link
            href="/dashboard/inventory/items"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {t("dashboard.lowStockPage.backToItems")}
          </Link>
        </div>
      ) : (
        <>
          {analytics.totals.criticalCount > 0 && (
            <div className="mb-6 flex gap-3 rounded-md border border-red-200/80 bg-gradient-to-r from-red-50 to-amber-50/80 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700">
                <AlertIcon />
              </span>
              <div>
                <p className="font-bold text-red-900">
                  {formatMessage(t("dashboard.lowStockPage.alertBanner"), {
                    count: analytics.totals.criticalCount,
                  })}
                </p>
                <p className="mt-0.5 text-sm text-red-800/85">
                  {t("dashboard.lowStockPage.alertBannerHint")}
                </p>
              </div>
            </div>
          )}

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
            {t("dashboard.lowStockPage.overview")}
          </p>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <KpiCard
              label={t("dashboard.lowStockPage.itemsNeedAttention")}
              value={String(analytics.totals.lowStockCount)}
              variant="amber"
            />
            <KpiCard
              label={t("dashboard.lowStockPage.outOfStockCount")}
              value={String(analytics.totals.outOfStockCount)}
              variant="red"
            />
            <KpiCard
              label={t("dashboard.lowStockPage.criticalAlerts")}
              value={String(analytics.totals.criticalCount)}
              variant="red"
            />
            <KpiCard
              label={t("dashboard.lowStockPage.unitsOnHand")}
              value={analytics.totals.unitsAtRisk.toLocaleString("en-IN")}
            />
            <KpiCard
              label={t("dashboard.lowStockPage.valueAtRisk")}
              value={formatInr(analytics.totals.costValueAtRisk)}
              variant="navy"
            />
            <KpiCard
              label={t("dashboard.lowStockPage.categoriesAffected")}
              value={String(analytics.totals.categoriesAffected)}
            />
            <KpiCard
              label={t("dashboard.lowStockPage.avgFillLevel")}
              value={`${analytics.totals.avgFillPct.toFixed(0)}%`}
              sub={t("dashboard.lowStockPage.stockLevel")}
            />
          </div>

          {analytics.categorySlices.length > 0 && (
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
              <section className="rounded-md border border-slate-200/90 bg-white p-4 lg:p-5">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.lowStockPage.byCategory")}
                </h3>
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <DonutChart slices={analytics.categorySlices} size={140} />
                  <ChartLegend
                    slices={analytics.categorySlices}
                    valueFormatter={(n) => `${n} items`}
                  />
                </div>
              </section>
              <section className="rounded-md border border-slate-200/90 bg-white p-4 lg:p-5">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.lowStockPage.colDeficit")}
                </h3>
                <div className="mt-4">
                  <HorizontalBarChart
                    rows={analytics.byCategory.slice(0, 5).map((c, i) => ({
                      id: c.category,
                      label: c.category,
                      value: c.deficit,
                      sublabel: `${c.count} items · ${c.units} units left`,
                      color: analytics.categorySlices[i]?.color ?? "#F63E16",
                    }))}
                    valueLabel={(n) => `${n} units`}
                  />
                </div>
              </section>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.lowStockPage.searchPlaceholder")}
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200/90 bg-white px-3 text-sm outline-none focus:border-brand-orange-1/40 focus:ring-2 focus:ring-brand-orange-1/15"
            />
            <div className="w-full sm:w-[180px]">
              <ModernSelect
                value={category}
                onChange={setCategory}
                options={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? t("dashboard.inventory.allCategories") : c,
                }))}
                aria-label={t("dashboard.lowStockPage.filterCategory")}
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <ModernSelect
                value={sort}
                onChange={(v) => setSort(v as typeof sort)}
                options={[
                  { value: "deficit", label: t("dashboard.lowStockPage.sortDeficitDesc") },
                  { value: "stock", label: t("dashboard.lowStockPage.sortStockAsc") },
                  { value: "name", label: t("dashboard.lowStockPage.sortName") },
                ]}
                aria-label="Sort"
              />
            </div>
          </div>

          {filteredRows.length > 0 && (
            <section className="mb-8 overflow-hidden rounded-md border border-amber-200/60 bg-white shadow-sm">
              <div className="border-b border-amber-100/80 bg-amber-50/50 px-4 py-3">
                <h2 className="text-sm font-bold text-amber-900">
                  {t("dashboard.lowStockPage.lowStockAlerts")}{" "}
                  <span className="font-normal text-amber-800/80">({filteredRows.length})</span>
                </h2>
              </div>
              <div className="overflow-x-auto scrollbar-brand">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colItem")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colCategory")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colStock")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colReorder")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colDeficit")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colFill")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colPriority")}</th>
                      <th className="px-4 py-3">{t("dashboard.lowStockPage.colSuggested")}</th>
                      <th className="px-4 py-3 text-right">{t("dashboard.lowStockPage.colValue")}</th>
                      <th className="px-4 py-3 text-right">{t("dashboard.lowStockPage.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <AlertRowCard
                        key={row.item.id}
                        row={row}
                        priorityLabel={priorityLabels[row.priority]}
                        daysLabel={formatMessage(t("dashboard.lowStockPage.daysFlagged"), {
                          days: row.daysSinceFlagged,
                        })}
                        onReorder={handleReorder}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {filteredOut.length > 0 && (
            <section className="mb-8 overflow-hidden rounded-md border border-red-200/70 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50/60 px-4 py-3">
                <h2 className="text-sm font-bold text-red-900">
                  {t("dashboard.lowStockPage.outOfStockSection")}{" "}
                  <span className="font-normal text-red-800/80">({filteredOut.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredOut.map((item) => {
                  const reorderLevel = 10;
                  const suggested = reorderLevel;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand-primary">{item.name}</p>
                          <PriorityBadge
                            priority="critical"
                            label={priorityLabels.critical}
                          />
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-brand-primary-muted">
                          {item.sku} · {item.category}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-red-700">
                          0 {item.unit} / {reorderLevel} {t("dashboard.lowStockPage.colReorder").toLowerCase()}
                        </span>
                        <span className="text-brand-orange-2 font-semibold">
                          +{suggested} {item.unit} {t("dashboard.lowStockPage.colSuggested").toLowerCase()}
                        </span>
                        <button
                          type="button"
                          onClick={handleReorder}
                          className="h-8 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-3 text-xs font-semibold text-white"
                        >
                          {t("dashboard.lowStockPage.reorder")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-md border border-slate-200/90 bg-brand-surface/40 p-4 lg:p-5">
            <h3 className="text-sm font-bold text-brand-primary">{t("dashboard.lowStockPage.tipsTitle")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-brand-primary-mid">
              <li className="flex gap-2">
                <span className="font-bold text-brand-orange-2">1.</span>
                {t("dashboard.lowStockPage.tip1")}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand-orange-2">2.</span>
                {t("dashboard.lowStockPage.tip2")}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand-orange-2">3.</span>
                {t("dashboard.lowStockPage.tip3")}
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  ChartLegend,
  DonutChart,
  HorizontalBarChart,
  TrendLineChart,
} from "@/components/dashboard/inventory/stock-summary-charts";
import {
  computeStockSummaryAnalytics,
  formatInrBrief,
  formatInrFull,
  formatPct,
  generateAiStockInsights,
  type StockSummaryAnalytics,
} from "@/lib/dashboard/stock-summary-analytics";
import { useAllInventoryItems } from "@/lib/inventory/use-inventory-items";
import { useTranslation } from "@/lib/localization";

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M10 2l1.2 4.2L15.5 7.5 11.2 8.7 10 13l-1.2-4.3L4.5 7.5l4.3-1.3L10 2Z"
        fill="currentColor"
      />
      <path
        d="M15 12l.6 2.1 2.1.6-2.1.6L15 17.3l-.6-2.1-2.1-.6 2.1-.6L15 12Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

function KpiTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "navy" | "orange" | "green" | "amber" | "red";
}) {
  const border =
    accent === "orange"
      ? "border-brand-orange-1/20"
      : accent === "green"
        ? "border-emerald-200/80"
        : accent === "amber"
          ? "border-amber-200/80"
          : accent === "red"
            ? "border-red-200/80"
            : "border-slate-200/90";

  return (
    <div className={`rounded-md border bg-white px-3.5 py-3 ${border} shadow-sm`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-primary-muted">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-sm border border-slate-200/90 bg-white p-4 lg:p-5 ${className}`}
    >
      <h3 className="text-sm font-bold text-brand-primary">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AiAnalysisPanel({
  open,
  loading,
  insights,
  onClose,
  onRegenerate,
}: {
  open: boolean;
  loading: boolean;
  insights: string[];
  onClose: () => void;
  onRegenerate: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[115] flex justify-end bg-brand-primary/40 p-0 backdrop-blur-[2px] sm:p-4">
      <div
        className="flex h-full w-full max-w-lg flex-col border-slate-200/90 bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-lg sm:border"
        role="dialog"
        aria-labelledby="ai-stock-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-brand-orange-2">
              <SparkleIcon />
              <h2 id="ai-stock-title" className="text-lg font-bold text-brand-primary">
                {t("dashboard.stockSummary.aiTitle")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-brand-primary-muted">
              {t("dashboard.stockSummary.aiSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-semibold text-brand-primary-muted hover:bg-slate-100"
          >
            {t("dashboard.stockSummary.aiClose")}
          </button>
        </div>

        <div className="scrollbar-brand flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-md bg-slate-100" />
              ))}
              <p className="text-center text-sm text-brand-primary-muted">
                {t("dashboard.stockSummary.analyzing")}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {insights.map((text, i) => (
                <li
                  key={i}
                  className="rounded-md border border-brand-orange-1/15 bg-brand-surface-warm/40 px-4 py-3 text-sm leading-relaxed text-brand-primary"
                >
                  {text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onRegenerate}
            className="h-10 w-full rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {t("dashboard.stockSummary.aiRegenerate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTable({
  rows,
  columns,
}: {
  rows: Record<string, string | number>[];
  columns: { key: string; label: string; align?: "right" }[];
}) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="overflow-x-auto scrollbar-brand">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 tabular-nums text-brand-primary ${col.align === "right" ? "text-right" : ""}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StockSummaryPage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const { items, loading, error, reload } = useAllInventoryItems(activeOrganisationId);
  const analytics = useMemo(() => computeStockSummaryAnalytics(items), [items]);
  const isLoading = isWorkspaceLoading || loading;
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  const statusSlices = useMemo(() => {
    const labels: Record<string, string> = {
      in_stock: t("dashboard.inventory.statusInStock"),
      low_stock: t("dashboard.inventory.statusLowStock"),
      out_of_stock: t("dashboard.inventory.statusOutOfStock"),
    };
    return analytics.statusSlices.map((s) => ({
      ...s,
      label: labels[s.id] ?? s.label,
    }));
  }, [analytics.statusSlices, t]);

  const runAiAnalysis = useCallback(() => {
    setAiLoading(true);
    setAiInsights([]);
    window.setTimeout(() => {
      setAiInsights(generateAiStockInsights(analytics));
      setAiLoading(false);
    }, 1400);
  }, [analytics]);

  const openAi = () => {
    setAiOpen(true);
    runAiAnalysis();
  };

  const generatedLabel = new Date(analytics.generatedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const { totals } = analytics;

  return (
    <div className="p-4 lg:p-6">
      {!activeOrganisationId && !isWorkspaceLoading && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.inventory.noOrganisation")}
        </p>
      )}
      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          <p>{t("dashboard.inventory.loadError")}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="shrink-0 rounded-md border border-red-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50"
          >
            {t("dashboard.serialTrackingPage.retry")}
          </button>
        </div>
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
            ← {t("dashboard.stockSummary.backToItems")}
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.stockSummary.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-primary-muted">
            {t("dashboard.stockSummary.subtitle")}
          </p>
          <p className="mt-1 text-xs text-brand-primary-muted/80">
            {t("dashboard.stockSummary.generatedAt")} {generatedLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={openAi}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white shadow-[0_4px_14px_-6px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <SparkleIcon />
          {t("dashboard.stockSummary.getAiAnalysis")}
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-md border border-brand-primary/15 bg-gradient-to-r from-brand-primary/[0.06] to-brand-orange-1/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between lg:p-5">
        <div>
          <p className="text-sm font-semibold text-brand-primary">
            {t("dashboard.stockSummary.healthScore")}
          </p>
          <p className="text-xs text-brand-primary-muted">{t("dashboard.stockSummary.healthHint")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#10B981 ${analytics.healthScore * 3.6}deg, #e2e8f0 0deg)`,
            }}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-brand-primary">
              {analytics.healthScore}
            </span>
          </div>
          <div className="text-sm text-brand-primary-mid">
            <p>
              <span className="font-semibold text-brand-primary">
                {t("dashboard.stockSummary.concentration")}:
              </span>{" "}
              {analytics.concentration.topCategory} ({formatPct(analytics.concentration.topCategorySharePct)})
            </p>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
        {t("dashboard.stockSummary.overview")}
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiTile label={t("dashboard.stockSummary.totalSkus")} value={String(totals.skuCount)} accent="navy" />
        <KpiTile label={t("dashboard.stockSummary.totalUnits")} value={totals.totalUnits.toLocaleString("en-IN")} />
        <KpiTile label={t("dashboard.stockSummary.costValue")} value={formatInrFull(totals.costValue)} accent="navy" />
        <KpiTile label={t("dashboard.stockSummary.retailValue")} value={formatInrFull(totals.retailValue)} accent="green" />
        <KpiTile
          label={t("dashboard.stockSummary.grossMargin")}
          value={formatInrBrief(totals.grossMargin)}
          sub={formatPct(totals.marginPct)}
          accent="green"
        />
        <KpiTile label={t("dashboard.stockSummary.marginPct")} value={formatPct(totals.marginPct)} />
        <KpiTile
          label={t("dashboard.stockSummary.avgUnitsPerSku")}
          value={totals.avgUnitsPerSku.toFixed(1)}
        />
        <KpiTile
          label={t("dashboard.stockSummary.avgCostPerUnit")}
          value={formatInrBrief(totals.avgCostPerUnit)}
        />
        <KpiTile label={t("dashboard.stockSummary.categories")} value={String(totals.categoryCount)} />
        <KpiTile label={t("dashboard.stockSummary.hsnCodes")} value={String(totals.hsnCount)} />
        <KpiTile label={t("dashboard.stockSummary.unitTypes")} value={String(totals.unitTypeCount)} />
        <KpiTile label={t("dashboard.stockSummary.serializedSkus")} value={String(totals.serializedSkus)} />
        <KpiTile label={t("dashboard.stockSummary.inStockSkus")} value={String(totals.healthySkus)} accent="green" />
        <KpiTile label={t("dashboard.stockSummary.lowStockSkus")} value={String(totals.lowStockSkus)} accent="amber" />
        <KpiTile label={t("dashboard.stockSummary.outOfStockSkus")} value={String(totals.zeroStockSkus)} accent="red" />
        <KpiTile
          label={t("dashboard.stockSummary.topCategoryShare")}
          value={formatPct(analytics.concentration.topCategorySharePct)}
          sub={analytics.concentration.topCategory}
        />
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
        {t("dashboard.stockSummary.charts")}
      </h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <SectionCard title={t("dashboard.stockSummary.valueByCategory")}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DonutChart slices={analytics.categoryValueSlices} />
            <ChartLegend slices={analytics.categoryValueSlices} valueFormatter={formatInrBrief} />
          </div>
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.statusDistribution")}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DonutChart slices={statusSlices} />
            <ChartLegend slices={statusSlices} valueFormatter={(n) => `${n} SKUs`} />
          </div>
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.gstBreakdown")}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DonutChart slices={analytics.gstValueSlices} />
            <ChartLegend slices={analytics.gstValueSlices} valueFormatter={formatInrBrief} />
          </div>
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.unitsByType")}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <DonutChart slices={analytics.unitSlices} />
            <ChartLegend slices={analytics.unitSlices} valueFormatter={(n) => `${n} units`} />
          </div>
        </SectionCard>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("dashboard.stockSummary.topCategories")}>
          <HorizontalBarChart
            rows={analytics.categoryRows.slice(0, 6).map((r, i) => ({
              id: r.category,
              label: r.category,
              value: r.costValue,
              sublabel: `${r.items} items · ${r.units} units`,
              color: analytics.categoryValueSlices[i]?.color ?? "#031F49",
            }))}
            valueLabel={formatInrBrief}
          />
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.topItemsByValue")}>
          <HorizontalBarChart
            rows={analytics.topByCostValue.map((m, i) => ({
              id: m.id,
              label: m.name,
              value: m.costValue,
              sublabel: `${m.stock} ${m.unit}`,
              color: analytics.categoryValueSlices[i % analytics.categoryValueSlices.length]?.color ?? "#F63E16",
            }))}
            valueLabel={formatInrBrief}
          />
        </SectionCard>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("dashboard.stockSummary.trendUnits")}>
          <TrendLineChart points={analytics.weeklyTrend} valueKey="units" />
          <p className="mt-2 text-[11px] text-brand-primary-muted">{t("dashboard.stockSummary.trendNote")}</p>
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.trendValue")}>
          <TrendLineChart points={analytics.weeklyTrend} valueKey="value" />
          <p className="mt-2 text-[11px] text-brand-primary-muted">{t("dashboard.stockSummary.trendNote")}</p>
        </SectionCard>
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
        {t("dashboard.stockSummary.categoryBreakdown")}
      </h2>
      <SectionCard title={t("dashboard.stockSummary.categoryBreakdown")} className="mb-8">
        <StatusTable
          rows={analytics.categoryRows.map((r) => ({
            category: r.category,
            items: r.items,
            units: r.units.toLocaleString("en-IN"),
            cost: formatInrBrief(r.costValue),
            retail: formatInrBrief(r.retailValue),
            share: formatPct(r.sharePct),
          }))}
          columns={[
            { key: "category", label: t("dashboard.stockSummary.colCategory") },
            { key: "items", label: t("dashboard.stockSummary.colItems"), align: "right" },
            { key: "units", label: t("dashboard.stockSummary.colUnits"), align: "right" },
            { key: "cost", label: t("dashboard.stockSummary.colCost"), align: "right" },
            { key: "retail", label: t("dashboard.stockSummary.colRetail"), align: "right" },
            { key: "share", label: t("dashboard.stockSummary.colShare"), align: "right" },
          ]}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <KpiTile
            label={t("dashboard.stockSummary.top3Share")}
            value={formatPct(analytics.concentration.top3CategorySharePct)}
          />
          <KpiTile
            label={t("dashboard.stockSummary.topItemShare")}
            value={formatPct(analytics.concentration.topItemSharePct)}
          />
          <KpiTile
            label={t("dashboard.stockSummary.topCategoryShare")}
            value={analytics.concentration.topCategory}
            sub={formatPct(analytics.concentration.topCategorySharePct)}
          />
        </div>
      </SectionCard>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
        {t("dashboard.stockSummary.itemInsights")}
      </h2>
      <div className="mb-8 grid gap-4 xl:grid-cols-2">
        <SectionCard title={t("dashboard.stockSummary.topItemsByUnits")}>
          <ItemMiniTable
            metrics={analytics.topByUnits}
            t={t}
            showStock
          />
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.highestMargin")}>
          <ItemMiniTable metrics={analytics.topByMargin} t={t} showMargin />
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.lowestQty")}>
          <ItemMiniTable metrics={analytics.lowestStock} t={t} showStock />
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.hsnTable")}>
          <StatusTable
            rows={analytics.hsnBreakdown.map((h) => ({
              hsn: h.hsn,
              items: h.items,
              units: h.units,
              cost: formatInrBrief(h.costValue),
            }))}
            columns={[
              { key: "hsn", label: t("dashboard.stockSummary.colHsn") },
              { key: "items", label: t("dashboard.stockSummary.colItems"), align: "right" },
              { key: "units", label: t("dashboard.stockSummary.colUnits"), align: "right" },
              { key: "cost", label: t("dashboard.stockSummary.colCost"), align: "right" },
            ]}
          />
        </SectionCard>
      </div>

      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
        {t("dashboard.stockSummary.riskAlerts")}
      </h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("dashboard.stockSummary.outOfStockList")}>
          {analytics.outOfStock.length === 0 ? (
            <p className="text-sm text-emerald-700">{t("dashboard.stockSummary.noOutOfStock")}</p>
          ) : (
            <ItemMiniTable metrics={analytics.outOfStock} t={t} showStock />
          )}
        </SectionCard>
        <SectionCard title={t("dashboard.stockSummary.lowStockList")}>
          {analytics.lowStock.length === 0 ? (
            <p className="text-sm text-emerald-700">{t("dashboard.stockSummary.noLowStock")}</p>
          ) : (
            <ItemMiniTable metrics={analytics.lowStock} t={t} showStock />
          )}
        </SectionCard>
      </div>

      <AiAnalysisPanel
        open={aiOpen}
        loading={aiLoading}
        insights={aiInsights}
        onClose={() => setAiOpen(false)}
        onRegenerate={runAiAnalysis}
      />
    </div>
  );
}

function ItemMiniTable({
  metrics,
  t,
  showStock,
  showMargin,
}: {
  metrics: StockSummaryAnalytics["topByCostValue"];
  t: (key: import("@/lib/localization").TranslationKey) => string;
  showStock?: boolean;
  showMargin?: boolean;
}) {
  return (
    <div className="overflow-x-auto scrollbar-brand">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-brand-primary-muted">
            <th className="py-2 pr-2">{t("dashboard.stockSummary.colItem")}</th>
            <th className="py-2 pr-2">{t("dashboard.stockSummary.colSku")}</th>
            {showStock && <th className="py-2 text-right">{t("dashboard.stockSummary.colStock")}</th>}
            {showMargin && <th className="py-2 text-right">{t("dashboard.stockSummary.colMargin")}</th>}
            <th className="py-2 text-right">{t("dashboard.stockSummary.colCost")}</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2 pr-2 font-medium text-brand-primary">{m.name}</td>
              <td className="py-2 pr-2 font-mono text-xs text-brand-primary-muted">{m.sku}</td>
              {showStock && (
                <td className="py-2 text-right tabular-nums">
                  {m.stock} {m.unit}
                </td>
              )}
              {showMargin && (
                <td className="py-2 text-right tabular-nums text-emerald-700">
                  {formatInrBrief(m.margin)} ({formatPct(m.marginPct, 0)})
                </td>
              )}
              <td className="py-2 text-right tabular-nums">{formatInrBrief(m.costValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

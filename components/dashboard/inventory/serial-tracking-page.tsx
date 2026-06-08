"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  ChartLegend,
  DonutChart,
  HorizontalBarChart,
} from "@/components/dashboard/inventory/stock-summary-charts";
import { formatDetailDate } from "@/lib/inventory/item-detail-utils";
import type { SerialRecord, SerialStatus } from "@/lib/inventory/serial-registry";
import {
  computeSerialTrackingAnalytics,
  exportSerialRegistryCsv,
  formatInr,
} from "@/lib/inventory/serial-tracking-analytics";
import { useSerialTracking } from "@/lib/inventory/use-serial-tracking";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M3 6V4a1 1 0 011-1h2M14 3h2a1 1 0 011 1v2M17 14v2a1 1 0 01-1 1h-2M6 17H4a1 1 0 01-1-1v-2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "navy" | "green" | "amber" | "red" | "violet";
}) {
  const styles = {
    default: "border-slate-200/90 bg-white",
    navy: "border-brand-primary/15 bg-brand-primary/[0.03]",
    green: "border-emerald-200/80 bg-emerald-50/30",
    amber: "border-amber-200/80 bg-amber-50/30",
    red: "border-red-200/80 bg-red-50/25",
    violet: "border-violet-200/80 bg-violet-50/30",
  };
  return (
    <div className={`rounded-md border px-3.5 py-3 ${styles[variant]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: SerialStatus; label: string }) {
  const styles: Record<SerialStatus, string> = {
    in_stock: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    sold: "bg-brand-primary/[0.08] text-brand-primary ring-brand-primary/15",
    returned: "bg-blue-50 text-blue-800 ring-blue-600/15",
    damaged: "bg-red-50 text-red-800 ring-red-600/15",
    reserved: "bg-amber-50 text-amber-900 ring-amber-600/15",
  };
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {label}
    </span>
  );
}

export function SerialTrackingPage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const { items, loading, error, reload } = useSerialTracking(activeOrganisationId);
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [product, setProduct] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const analytics = useMemo(() => computeSerialTrackingAnalytics(items), [items]);

  const statusLabels: Record<SerialStatus, string> = {
    in_stock: t("dashboard.serialTrackingPage.statusInStock"),
    sold: t("dashboard.serialTrackingPage.statusSold"),
    returned: t("dashboard.serialTrackingPage.statusReturned"),
    damaged: t("dashboard.serialTrackingPage.statusDamaged"),
    reserved: t("dashboard.serialTrackingPage.statusReserved"),
  };

  const statusOptions = [
    { value: "all", label: t("dashboard.serialTrackingPage.allStatuses") },
    ...(["in_stock", "sold", "returned", "damaged", "reserved"] as const).map((s) => ({
      value: s,
      label: statusLabels[s],
    })),
  ];

  const categories = useMemo(() => {
    const set = new Set(analytics.records.map((r) => r.category));
    return ["all", ...Array.from(set).sort()];
  }, [analytics.records]);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of analytics.records) map.set(r.itemId, r.itemName);
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [analytics.records]);

  const statusSlices = useMemo(
    () =>
      analytics.statusSlices.map((s) => ({
        ...s,
        label: statusLabels[s.id as SerialStatus] ?? s.label,
      })),
    [analytics.statusSlices, statusLabels],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return analytics.records.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (category !== "all" && r.category !== category) return false;
      if (product !== "all" && r.itemId !== product) return false;
      if (!q) return true;
      return (
        r.serialNumber.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [analytics.records, query, status, category, product]);

  const copySerial = async (record: SerialRecord) => {
    try {
      await navigator.clipboard.writeText(record.serialNumber);
      setCopiedId(record.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const showNoOrganisation = !isWorkspaceLoading && !activeOrganisationId;
  const isLoading = loading || isWorkspaceLoading;
  const hasSerializedSkus = analytics.totals.serializedSkus > 0;
  const hasSerials = analytics.totals.totalSerials > 0;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/inventory/items"
            className="text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
          >
            ← {t("dashboard.serialTrackingPage.backToItems")}
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.serialTrackingPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-primary-muted">
            {t("dashboard.serialTrackingPage.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => searchRef.current?.focus()}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-violet-200/80 bg-violet-50/50 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-50"
          >
            <ScanIcon />
            {t("dashboard.serialTrackingPage.scanSerial")}
          </button>
          <button
            type="button"
            onClick={() => exportSerialRegistryCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-50"
          >
            {t("dashboard.serialTrackingPage.exportList")}
          </button>
          <Link
            href="/dashboard/inventory/items"
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-violet-600 to-violet-500 px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(124,58,237,0.4)] hover:brightness-105"
          >
            + {t("dashboard.serialTrackingPage.addSerial")}
          </Link>
        </div>
      </div>

      {showNoOrganisation && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.inventory.noOrganisation")}
        </p>
      )}

      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-red-200/80 bg-red-50/60 px-4 py-3">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            {t("dashboard.serialTrackingPage.retry")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-sm border border-slate-200/90 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          <p className="text-sm text-brand-primary-muted">{t("dashboard.serialTrackingPage.loading")}</p>
        </div>
      ) : !hasSerializedSkus ? (
        <div className="rounded-md border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <ScanIcon />
          </div>
          <h2 className="text-lg font-bold text-brand-primary">
            {t("dashboard.serialTrackingPage.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-primary-muted">
            {t("dashboard.serialTrackingPage.emptySubtitle")}
          </p>
          <Link
            href="/dashboard/inventory/items"
            className="mt-6 inline-flex h-10 items-center rounded-md bg-gradient-to-r from-violet-600 to-violet-500 px-5 text-sm font-semibold text-white hover:brightness-105"
          >
            {t("dashboard.serialTrackingPage.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          {analytics.totals.mismatchSkus > 0 && (
            <div className="mb-6 flex gap-3 rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-4">
              <span className="text-lg" aria-hidden>
                ⚠
              </span>
              <div>
                <p className="font-bold text-amber-900">
                  {formatMessage(t("dashboard.serialTrackingPage.mismatchBanner"), {
                    count: analytics.totals.mismatchSkus,
                  })}
                </p>
                <p className="mt-0.5 text-sm text-amber-800/90">
                  {t("dashboard.serialTrackingPage.mismatchHint")}
                </p>
              </div>
            </div>
          )}

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-primary-muted">
            {t("dashboard.serialTrackingPage.overview")}
          </p>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            <KpiCard
              label={t("dashboard.serialTrackingPage.totalSerials")}
              value={String(analytics.totals.totalSerials)}
              variant="navy"
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.inStock")}
              value={String(analytics.totals.inStock)}
              variant="green"
            />
            <KpiCard label={t("dashboard.serialTrackingPage.sold")} value={String(analytics.totals.sold)} />
            <KpiCard
              label={t("dashboard.serialTrackingPage.returned")}
              value={String(analytics.totals.returned)}
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.damaged")}
              value={String(analytics.totals.damaged)}
              variant="red"
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.reserved")}
              value={String(analytics.totals.reserved)}
              variant="amber"
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.serializedSkus")}
              value={String(analytics.totals.serializedSkus)}
              variant="violet"
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.valueInStock")}
              value={formatInr(analytics.totals.costValueInStock)}
              variant="navy"
            />
            <KpiCard
              label={t("dashboard.serialTrackingPage.mismatchSkus")}
              value={String(analytics.totals.mismatchSkus)}
              variant={analytics.totals.mismatchSkus > 0 ? "amber" : "green"}
            />
          </div>

          {hasSerials && (
            <div className="mb-8 grid gap-4 lg:grid-cols-3">
              <section className="rounded-sm border border-slate-200/90 bg-white p-4 lg:p-5">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.serialTrackingPage.statusChart")}
                </h3>
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <DonutChart slices={statusSlices} size={132} />
                  <ChartLegend slices={statusSlices} valueFormatter={(n) => `${n}`} />
                </div>
              </section>
              <section className="rounded-sm border border-slate-200/90 bg-white p-4 lg:p-5">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.serialTrackingPage.byProduct")}
                </h3>
                <div className="mt-4">
                  {analytics.itemSlices.length > 0 ? (
                    <HorizontalBarChart
                      rows={analytics.itemSlices.map((s) => ({
                        id: s.id,
                        label: s.label.length > 22 ? `${s.label.slice(0, 22)}…` : s.label,
                        value: s.value,
                        color: s.color,
                      }))}
                      valueLabel={(n) => `${n}`}
                    />
                  ) : (
                    <p className="text-sm text-brand-primary-muted">—</p>
                  )}
                </div>
              </section>
              <section className="rounded-sm border border-slate-200/90 bg-white p-4 lg:p-5">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.serialTrackingPage.byCategory")}
                </h3>
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
                  {analytics.categorySlices.length > 0 ? (
                    <>
                      <DonutChart slices={analytics.categorySlices} size={120} />
                      <ChartLegend slices={analytics.categorySlices} valueFormatter={(n) => `${n}`} />
                    </>
                  ) : (
                    <p className="text-sm text-brand-primary-muted">—</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {hasSerials && (
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
              <section className="rounded-sm border border-slate-200/90 bg-white p-4">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.serialTrackingPage.recentAdded")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {analytics.recentAdded.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link
                        href={`/dashboard/inventory/items/${r.itemId}`}
                        className="min-w-0 font-mono text-xs font-semibold text-violet-700 hover:underline"
                      >
                        {r.serialNumber}
                      </Link>
                      <span className="shrink-0 text-brand-primary-muted">
                        {formatDetailDate(r.dateAdded)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-sm border border-slate-200/90 bg-white p-4">
                <h3 className="text-sm font-bold text-brand-primary">
                  {t("dashboard.serialTrackingPage.recentSold")}
                </h3>
                <ul className="mt-3 space-y-2">
                  {analytics.recentSold.length === 0 ? (
                    <li className="text-sm text-brand-primary-muted">
                      {t("dashboard.serialTrackingPage.noSoldYet")}
                    </li>
                  ) : (
                    analytics.recentSold.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                        <Link
                          href={`/dashboard/inventory/items/${r.itemId}`}
                          className="min-w-0 truncate font-mono text-xs font-semibold text-brand-primary hover:underline"
                        >
                          {r.serialNumber}
                        </Link>
                        <StatusBadge status="sold" label={statusLabels.sold} />
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          )}

          <section className="mb-8 overflow-hidden rounded-md border border-violet-200/50 bg-white">
            <div className="border-b border-violet-100/80 bg-violet-50/40 px-4 py-3">
              <h2 className="text-sm font-bold text-violet-900">
                {t("dashboard.serialTrackingPage.productSync")}
              </h2>
            </div>
            <div className="overflow-x-auto scrollbar-brand">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colItem")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colSku")}</th>
                    <th className="px-4 py-3 text-right">{t("dashboard.serialTrackingPage.colStock")}</th>
                    <th className="px-4 py-3 text-right">{t("dashboard.serialTrackingPage.colInStockSerials")}</th>
                    <th className="px-4 py-3 text-right">{t("dashboard.serialTrackingPage.colRecorded")}</th>
                    <th className="px-4 py-3 text-right">{t("dashboard.serialTrackingPage.colGap")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colSync")}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.serializedProducts.map((p) => (
                    <tr key={p.itemId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/inventory/items/${p.itemId}`}
                          className="font-semibold text-brand-primary hover:text-violet-700 hover:underline"
                        >
                          {p.itemName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stockQty}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                        {p.inStockSerials}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.serialsRecorded}</td>
                      <td
                        className={`px-4 py-3 text-right font-semibold tabular-nums ${p.gap !== 0 ? "text-amber-700" : "text-emerald-700"}`}
                      >
                        {p.gap > 0 ? `+${p.gap}` : p.gap}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                            p.match
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
                              : "bg-amber-50 text-amber-900 ring-amber-600/15"
                          }`}
                        >
                          {p.match
                            ? t("dashboard.serialTrackingPage.matched")
                            : t("dashboard.serialTrackingPage.mismatch")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.serialTrackingPage.searchPlaceholder")}
              className="h-10 min-w-0 flex-1 rounded-sm border border-slate-200/90 bg-white px-3 text-sm outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/15"
            />
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[540px]">
              <ModernSelect
                value={status}
                onChange={setStatus}
                options={statusOptions}
                aria-label={t("dashboard.serialTrackingPage.filterStatus")}
              />
              <ModernSelect
                value={category}
                onChange={setCategory}
                options={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? t("dashboard.serialTrackingPage.allCategories") : c,
                }))}
                aria-label={t("dashboard.serialTrackingPage.filterCategory")}
              />
              <ModernSelect
                value={product}
                onChange={setProduct}
                options={[
                  { value: "all", label: t("dashboard.serialTrackingPage.allProducts") },
                  ...productOptions.map(([id, name]) => ({ value: id, label: name })),
                ]}
                searchable
                aria-label={t("dashboard.serialTrackingPage.filterProduct")}
              />
            </div>
          </div>

          <section className="mb-8 overflow-hidden rounded-sm border border-slate-200/90 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-brand-surface/50 px-4 py-3">
              <h2 className="text-sm font-bold text-brand-primary">
                {t("dashboard.serialTrackingPage.registry")}{" "}
                <span className="font-normal text-brand-primary-muted">({filtered.length})</span>
              </h2>
            </div>
            <div className="overflow-x-auto scrollbar-brand">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colSerial")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colItem")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colCategory")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colStatus")}</th>
                    <th className="px-4 py-3">{t("dashboard.serialTrackingPage.colAdded")}</th>
                    <th className="px-4 py-3 text-right">{t("dashboard.serialTrackingPage.colValue")}</th>
                    <th className="w-28 px-2 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                        {hasSerials
                          ? t("dashboard.serialTrackingPage.noResults")
                          : t("dashboard.serialTrackingPage.noSerialsYet")}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 last:border-0 transition-colors hover:bg-violet-50/20"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-brand-primary">
                            {r.serialNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/inventory/items/${r.itemId}`}
                            className="font-medium text-brand-primary hover:text-violet-700 hover:underline"
                          >
                            {r.itemName}
                          </Link>
                          <p className="text-[11px] text-brand-primary-muted">{r.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-brand-primary-mid">{r.category}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} label={statusLabels[r.status]} />
                        </td>
                        <td className="px-4 py-3 text-brand-primary-muted">
                          {formatDetailDate(r.dateAdded)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatInr(r.purchasePrice)}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copySerial(r)}
                              className="text-xs font-semibold text-brand-orange-2 hover:underline"
                            >
                              {copiedId === r.id
                                ? t("dashboard.serialTrackingPage.copied")
                                : t("dashboard.serialTrackingPage.copySerial")}
                            </button>
                            <Link
                              href={`/dashboard/inventory/items/${r.itemId}`}
                              className="text-xs font-semibold text-violet-700 hover:underline"
                            >
                              {t("dashboard.serialTrackingPage.viewItem")}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-md border border-slate-200/90 bg-brand-surface/40 p-4 lg:p-5">
            <h3 className="text-sm font-bold text-brand-primary">
              {t("dashboard.serialTrackingPage.tipsTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-brand-primary-mid">
              <li>
                <span className="font-bold text-brand-orange-2">1.</span>{" "}
                {t("dashboard.serialTrackingPage.tip1")}
              </li>
              <li>
                <span className="font-bold text-brand-orange-2">2.</span>{" "}
                {t("dashboard.serialTrackingPage.tip2")}
              </li>
              <li>
                <span className="font-bold text-brand-orange-2">3.</span>{" "}
                {t("dashboard.serialTrackingPage.tip3")}
              </li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

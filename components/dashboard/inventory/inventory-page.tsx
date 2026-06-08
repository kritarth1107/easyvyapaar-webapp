"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  type InventoryItem,
  type InventoryItemStatus,
} from "@/lib/types/inventory-ui";
import { fetchInventoryCategories, fetchInventoryStockStats } from "@/lib/inventory/inventory-api-client";
import { useInventoryItems } from "@/lib/inventory/use-inventory-items";
import type { InventoryStockStats } from "@/lib/types/inventory-api";
import { CreateItemModal } from "@/components/dashboard/inventory/create-item-modal";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatInrCompact(amount: number): string {
  return formatInr(amount).replace(/\u00A0/g, " ");
}

function StatusBadge({ status }: { status: InventoryItemStatus }) {
  const { t } = useTranslation();
  const styles: Record<InventoryItemStatus, string> = {
    in_stock: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    low_stock: "bg-amber-50 text-amber-800 ring-amber-600/15",
    out_of_stock: "bg-red-50 text-red-700 ring-red-600/15",
  };
  const labels: Record<InventoryItemStatus, string> = {
    in_stock: t("dashboard.inventory.statusInStock"),
    low_stock: t("dashboard.inventory.statusLowStock"),
    out_of_stock: t("dashboard.inventory.statusOutOfStock"),
  };

  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M6 2.5h7v7M13 3 6.5 9.5M9 2.5H3.5v9H12"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StockValueIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3 14l4.5-5 3.5 3.5L17 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 6h4v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LowStockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M4 7.5h12v8.5H4V7.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M7 7.5V5.5a3 3 0 0 1 6 0V7.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path d="M8 11h4" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7v4M8 5.25h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CompactStatCard({
  variant,
  label,
  value,
  hint,
  href,
}: {
  variant: "stock-value" | "low-stock";
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const isStockValue = variant === "stock-value";
  const labelClass = isStockValue ? "text-brand-primary-light" : "text-brand-orange-2";
  const iconWrapClass = isStockValue
    ? "bg-brand-primary/[0.08] text-brand-primary-light"
    : "bg-brand-orange-1/10 text-brand-orange-2";

  return (
    <div className="relative rounded-sm border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconWrapClass}`}
          >
            {isStockValue ? <StockValueIcon /> : <LowStockIcon />}
          </span>
          <div className="flex min-w-0 items-center gap-1">
            <span className={`truncate text-sm font-semibold ${labelClass}`}>{label}</span>
            {hint && (
              <button
                type="button"
                className="shrink-0 rounded-full p-0.5 text-brand-primary-muted/80 transition-colors hover:bg-slate-100 hover:text-brand-primary"
                title={hint}
                aria-label={hint}
              >
                <InfoIcon />
              </button>
            )}
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded p-1 text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
            aria-label={label}
          >
            <ExternalLinkIcon />
          </Link>
        )}
      </div>
      <p className="mt-2.5 truncate text-xl font-bold tracking-tight text-brand-primary tabular-nums sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

export function InventoryPage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [stockStats, setStockStats] = useState<InventoryStockStats | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category]);

  const { items, pagination, loading, error, reload } = useInventoryItems(activeOrganisationId, {
    search: debouncedQuery,
    category,
    page,
    limit: 20,
  });

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setCategoryOptions([]);
      setStockStats(null);
      return;
    }

    void Promise.all([fetchInventoryCategories(orgId), fetchInventoryStockStats(orgId)])
      .then(([categories, stats]) => {
        setCategoryOptions(categories.map((row) => row.name).sort());
        setStockStats(stats);
      })
      .catch(() => {
        setCategoryOptions([]);
        setStockStats(null);
      });
  }, [activeOrganisationId]);

  const categories = useMemo(() => ["all", ...categoryOptions], [categoryOptions]);

  const isLoading = isWorkspaceLoading || loading;
  const showNoOrganisation = !isWorkspaceLoading && !activeOrganisationId;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">
            {t("dashboard.inventory.subtitle")}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.items")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!activeOrganisationId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(246,62,22,0.4)] transition-all hover:brightness-105 disabled:opacity-60"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.inventory.addItem")}
        </button>
      </div>

      {showNoOrganisation && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.inventory.noOrganisation")}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-sm border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          {t("dashboard.inventory.loadError")}
        </p>
      )}

      <div className="mb-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <CompactStatCard
          variant="stock-value"
          label={t("dashboard.inventory.stockValue")}
          value={isLoading ? "—" : formatInrCompact(stockStats?.stockValue ?? 0)}
          hint={t("dashboard.inventory.stockValueHint")}
          href="/dashboard/inventory/stock-summary"
        />
        <CompactStatCard
          variant="low-stock"
          label={t("dashboard.inventory.lowStock")}
          value={isLoading ? "—" : String(stockStats?.lowStockCount ?? 0)}
          href="/dashboard/inventory/low-stock"
        />
      </div>

      <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.inventory.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.inventory.searchPlaceholder")}
              className="h-10 w-full rounded-sm border border-slate-200/90 bg-slate-50/80 pl-3 pr-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[180px] shrink-0 sm:w-[200px]">
            <ModernSelect
              value={category}
              onChange={setCategory}
              searchable
              searchPlaceholder={t("dashboard.inventory.createItem.searchCategories")}
              options={categories.map((c) => ({
                value: c,
                label: c === "all" ? t("dashboard.inventory.allCategories") : c,
              }))}
              aria-label={t("dashboard.inventory.filterCategory")}
            />
          </div>
          <Link
            href="/dashboard/inventory/low-stock"
            className="shrink-0 text-center text-sm font-semibold text-brand-orange-2 transition-colors hover:text-brand-orange-1 hover:underline"
          >
            {t("dashboard.inventory.viewLowStock")}
          </Link>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.inventory.colItem")}</th>
                <th className="px-4 py-3">{t("dashboard.inventory.colSku")}</th>
                <th className="px-4 py-3">{t("dashboard.inventory.colCategory")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.inventory.colStock")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.inventory.colPrice")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.inventory.colGst")}</th>
                <th className="px-4 py-3">{t("dashboard.inventory.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    {t("dashboard.inventory.loading")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    {t("dashboard.inventory.empty")}
                  </td>
                </tr>
              ) : (
                items.map((item) => <InventoryRow key={item.id} item={item} />)
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-brand-primary-muted">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-sm border border-slate-200/90 px-3 text-xs font-semibold text-brand-primary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 rounded-sm border border-slate-200/90 px-3 text-xs font-semibold text-brand-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateItemModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organisationId={activeOrganisationId}
        onSaved={() => void reload()}
      />
    </div>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const { t } = useTranslation();
  const router = useRouter();
  const itemHref = `/dashboard/inventory/items/${encodeURIComponent(item.id)}`;

  const openItem = () => {
    router.push(itemHref);
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/60"
      onClick={openItem}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={item.name}
    >
      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-0.5">
          <p className="font-semibold text-brand-primary">{item.name}</p>
          {item.serialised && (
            <Link
              href="/dashboard/inventory/serial-tracking"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-violet-600 hover:text-violet-800 hover:underline"
            >
              {t("dashboard.inventory.serialTracking")}
            </Link>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-brand-primary">{item.sku}</p>
        <p className="mt-0.5 text-[11px] text-brand-primary-muted">
          {t("dashboard.inventory.hsn")}: {item.hsn}
        </p>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{item.category}</td>
      <td className="px-4 py-3 text-right font-medium tabular-nums text-brand-primary">
        {item.stock} {item.unit}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-brand-primary">
        {formatInr(item.salePrice)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-brand-primary-muted">
        {item.gstPercent}%
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
    </tr>
  );
}

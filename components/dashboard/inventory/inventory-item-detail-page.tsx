"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdjustSerialStockModal } from "@/components/dashboard/inventory/adjust-serial-stock-modal";
import { AdjustStockModal } from "@/components/dashboard/inventory/adjust-stock-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import type { InventoryItemStatus } from "@/lib/types/inventory-ui";
import {
  fetchInventoryItemDetail,
  fetchStockAdjustments,
} from "@/lib/inventory/inventory-api-client";
import {
  computeDetailStockStatus,
  formatDateTime,
  formatDetailDate,
  formatGstRateLabel,
  formatInr,
} from "@/lib/inventory/item-detail-utils";
import type { InventoryItemDetail, InventoryStockAdjustment } from "@/lib/types/inventory-api";
import { useTranslation } from "@/lib/localization";

type InventoryItemDetailPageProps = {
  itemId: string;
};

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
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ItemStatusBadge({ status }: { status: InventoryItemDetail["status"] }) {
  const { t } = useTranslation();
  const styles: Record<InventoryItemDetail["status"], string> = {
    ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    INACTIVE: "bg-slate-100 text-slate-700 ring-slate-400/20",
    ARCHIVED: "bg-amber-50 text-amber-900 ring-amber-600/15",
  };
  const labels: Record<InventoryItemDetail["status"], string> = {
    ACTIVE: t("dashboard.inventory.itemDetail.statusActive"),
    INACTIVE: t("dashboard.inventory.itemDetail.statusInactive"),
    ARCHIVED: t("dashboard.inventory.itemDetail.statusArchived"),
  };

  return (
    <span
      className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "navy" | "orange" | "green" | "amber";
}) {
  const border =
    accent === "orange"
      ? "border-brand-orange-1/20 bg-brand-surface-warm/30"
      : accent === "green"
        ? "border-emerald-200/80 bg-emerald-50/20"
        : accent === "amber"
          ? "border-amber-200/80 bg-amber-50/20"
          : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-4 py-3.5 ${border}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-primary-muted">{sub}</p>}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-slate-200/90 bg-white p-4 lg:p-5">
      <h2 className="text-sm font-bold text-brand-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-brand-primary">{value}</p>
    </div>
  );
}

export function InventoryItemDetailPage({ itemId }: InventoryItemDetailPageProps) {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [adjustments, setAdjustments] = useState<InventoryStockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const loadItem = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    const id = itemId?.trim();
    if (!orgId || !id) {
      setItem(null);
      setAdjustments([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const detail = await fetchInventoryItemDetail(orgId, id);
      setItem(detail);
    } catch (err) {
      setItem(null);
      setError(err instanceof Error ? err.message : t("dashboard.inventory.itemDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, itemId, t]);

  const loadHistory = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    const id = itemId?.trim();
    if (!orgId || !id) {
      setAdjustments([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const rows = await fetchStockAdjustments(orgId, id);
      setAdjustments(rows);
    } catch {
      setAdjustments([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeOrganisationId, itemId]);

  useEffect(() => {
    void loadItem();
    void loadHistory();
  }, [loadItem, loadHistory]);

  const handleStockAdjusted = (updated: InventoryItemDetail) => {
    setItem(updated);
    void loadHistory();
  };

  const stockStatus = useMemo(
    () => (item ? computeDetailStockStatus(item) : null),
    [item],
  );

  const stockValue = item ? item.currentStock * item.purchasePrice : 0;
  const showNoOrganisation = !isWorkspaceLoading && !activeOrganisationId;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/inventory/items"
          className="text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 hover:underline"
        >
          ← {t("dashboard.inventory.itemDetail.backToItems")}
        </Link>
      </div>

      {showNoOrganisation && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.inventory.noOrganisation")}
        </p>
      )}

      {loading || isWorkspaceLoading ? (
        <p className="text-sm text-brand-primary-muted">{t("dashboard.inventory.loading")}</p>
      ) : error ? (
        <div className="rounded-sm border border-red-200/80 bg-red-50/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <Link
            href="/dashboard/inventory/items"
            className="mt-4 inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.inventory.itemDetail.backToItems")}
          </Link>
        </div>
      ) : item ? (
        <>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
                  {item.name}
                </h1>
                {stockStatus && <StatusBadge status={stockStatus} />}
                <ItemStatusBadge status={item.status} />
              </div>
              <p className="mt-1 font-mono text-sm text-brand-primary-muted">{item.itemCode}</p>
              <p className="mt-1 text-sm text-brand-primary-muted">
                {item.categoryName} ·{" "}
                {item.itemType === "product"
                  ? t("dashboard.inventory.createItem.product")
                  : t("dashboard.inventory.createItem.service")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                className={`inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors ${
                  item.serialised
                    ? "border-violet-200/80 bg-violet-50/50 text-violet-700 hover:bg-violet-50"
                    : "border-brand-primary/20 bg-brand-primary/[0.04] text-brand-primary hover:bg-brand-primary/[0.08]"
                }`}
              >
                {item.serialised ? (
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                    <path
                      d="M3 6v8M5 6v8M7 4v12M9 6v8M11 6v8M13 6v8M15 6v8M17 6v8"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                    <path
                      d="M4 7.5h12v8.5H4V7.5ZM7 7.5V5.5a3 3 0 0 1 6 0V7.5"
                      stroke="currentColor"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {item.serialised
                  ? t("dashboard.inventory.itemDetail.adjustStock.serialButton")
                  : t("dashboard.inventory.itemDetail.adjustStock.button")}
              </button>
              {item.serialised && (
                <Link
                  href="/dashboard/inventory/serial-tracking"
                  className="inline-flex h-10 items-center rounded-sm border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
                >
                  {t("dashboard.inventory.serialTracking")}
                </Link>
              )}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={t("dashboard.inventory.colStock")}
              value={`${item.currentStock} ${item.unit}`}
              sub={
                item.lowStockWarning
                  ? `${t("dashboard.inventory.itemDetail.lowStockAt")} ${item.lowStockQty} ${item.unit}`
                  : undefined
              }
              accent={stockStatus === "low_stock" ? "amber" : stockStatus === "out_of_stock" ? "orange" : "green"}
            />
            <KpiCard
              label={t("dashboard.inventory.stockValue")}
              value={formatInr(stockValue)}
              accent="navy"
            />
            <KpiCard
              label={t("dashboard.inventory.colPrice")}
              value={formatInr(item.salesPrice)}
              sub={
                item.salesTaxMode === "with_tax"
                  ? t("dashboard.inventory.createItem.withTax")
                  : t("dashboard.inventory.createItem.withoutTax")
              }
              accent="orange"
            />
            <KpiCard
              label={t("dashboard.inventory.itemDetail.purchasePrice")}
              value={formatInr(item.purchasePrice)}
              sub={
                item.purchaseTaxMode === "with_tax"
                  ? t("dashboard.inventory.createItem.withTax")
                  : t("dashboard.inventory.createItem.withoutTax")
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("dashboard.inventory.createItem.sections.basic")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label={t("dashboard.inventory.colCategory")} value={item.categoryName} />
                <DetailField
                  label={t("dashboard.inventory.createItem.itemType")}
                  value={
                    item.itemType === "product"
                      ? t("dashboard.inventory.createItem.product")
                      : t("dashboard.inventory.createItem.service")
                  }
                />
                <DetailField label={t("dashboard.inventory.colSku")} value={item.itemCode} />
                <DetailField
                  label={t("dashboard.inventory.hsn")}
                  value={item.hsn?.trim() || "—"}
                />
                <DetailField label={t("dashboard.inventory.createItem.measuringUnit")} value={item.unit} />
                <DetailField
                  label={t("dashboard.inventory.createItem.onlineStore")}
                  value={
                    item.showInOnlineStore
                      ? t("dashboard.inventory.itemDetail.yes")
                      : t("dashboard.inventory.itemDetail.no")
                  }
                />
                {item.description?.trim() && (
                  <div className="sm:col-span-2">
                    <DetailField
                      label={t("dashboard.inventory.createItem.description")}
                      value={item.description}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title={t("dashboard.inventory.createItem.sections.pricing")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label={t("dashboard.inventory.colPrice")} value={formatInr(item.salesPrice)} />
                <DetailField
                  label={t("dashboard.inventory.itemDetail.purchasePrice")}
                  value={formatInr(item.purchasePrice)}
                />
                <DetailField label={t("dashboard.inventory.colGst")} value={formatGstRateLabel(item.gstRate)} />
                <DetailField
                  label={t("dashboard.inventory.createItem.salesDiscount")}
                  value={`${item.salesDiscountPercent}%`}
                />
                <DetailField
                  label={t("dashboard.inventory.createItem.salesPrice")}
                  value={
                    item.salesTaxMode === "with_tax"
                      ? t("dashboard.inventory.createItem.withTax")
                      : t("dashboard.inventory.createItem.withoutTax")
                  }
                />
                <DetailField
                  label={t("dashboard.inventory.createItem.purchasePrice")}
                  value={
                    item.purchaseTaxMode === "with_tax"
                      ? t("dashboard.inventory.createItem.withTax")
                      : t("dashboard.inventory.createItem.withoutTax")
                  }
                />
              </div>
            </SectionCard>

            <SectionCard title={t("dashboard.inventory.createItem.sections.stock")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label={t("dashboard.inventory.itemDetail.openingStock")}
                  value={`${item.openingStock} ${item.unit}`}
                />
                <DetailField
                  label={t("dashboard.inventory.colStock")}
                  value={`${item.currentStock} ${item.unit}`}
                />
                <DetailField
                  label={t("dashboard.inventory.createItem.asOfDate")}
                  value={formatDetailDate(item.asOfDate)}
                />
                <DetailField
                  label={t("dashboard.inventory.createItem.lowStockWarning")}
                  value={
                    item.lowStockWarning
                      ? `${item.lowStockQty} ${item.unit}`
                      : t("dashboard.inventory.itemDetail.disabled")
                  }
                />
                <DetailField
                  label={t("dashboard.inventory.createItem.serialisation")}
                  value={
                    item.serialised
                      ? t("dashboard.inventory.itemDetail.enabled")
                      : t("dashboard.inventory.itemDetail.disabled")
                  }
                />
              </div>
            </SectionCard>

            <SectionCard title={t("dashboard.inventory.itemDetail.recordInfo")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label={t("dashboard.inventory.itemDetail.itemId")} value={item.itemId} />
                <DetailField
                  label={t("dashboard.inventory.itemDetail.createdAt")}
                  value={formatDateTime(item.createdAt)}
                />
                <DetailField
                  label={t("dashboard.inventory.itemDetail.updatedAt")}
                  value={formatDateTime(item.updatedAt)}
                />
              </div>
            </SectionCard>
          </div>

          {item.serialised && item.serialNumbers.length > 0 && (
            <SectionCard title={t("dashboard.inventory.createItem.sections.serial")}>
              <div className="overflow-x-auto scrollbar-brand">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                      <th className="px-3 py-2">{t("dashboard.inventory.createItem.colSerial")}</th>
                      <th className="px-3 py-2">{t("dashboard.inventory.createItem.colDateCreated")}</th>
                      <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.serialStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.serialNumbers.map((row) => (
                      <tr key={row.serialNumber} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 font-mono text-xs text-brand-primary">
                          {row.serialNumber}
                        </td>
                        <td className="px-3 py-2.5 text-brand-primary-mid">
                          {formatDetailDate(row.dateCreated)}
                        </td>
                        <td className="px-3 py-2.5 capitalize text-brand-primary-muted">
                          {row.status.replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {item.partyPrices.length > 0 && (
            <div className="mt-4">
              <SectionCard title={t("dashboard.inventory.createItem.sections.party")}>
                <div className="overflow-x-auto scrollbar-brand">
                  <table className="w-full min-w-[360px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                        <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.partyId")}</th>
                        <th className="px-3 py-2 text-right">{t("dashboard.inventory.colPrice")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.partyPrices.map((row) => (
                        <tr key={`${row.partyId}-${row.price}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2.5 text-brand-primary">{row.partyId}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-brand-primary">
                            {formatInr(row.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {item.customFields.length > 0 && (
            <div className="mt-4">
              <SectionCard title={t("dashboard.inventory.createItem.sections.custom")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {item.customFields.map((row) => (
                    <DetailField key={`${row.field}-${row.value}`} label={row.field} value={row.value} />
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          <div className="mt-4">
            <SectionCard title={t("dashboard.inventory.itemDetail.adjustStock.historyTitle")}>
              {historyLoading ? (
                <p className="text-sm text-brand-primary-muted">{t("dashboard.inventory.loading")}</p>
              ) : adjustments.length === 0 ? (
                <p className="text-sm text-brand-primary-muted">
                  {t("dashboard.inventory.itemDetail.adjustStock.historyEmpty")}
                </p>
              ) : (
                <div className="overflow-x-auto scrollbar-brand">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                        <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.adjustStock.date")}</th>
                        <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.adjustStock.type")}</th>
                        <th className="px-3 py-2 text-right">
                          {t("dashboard.inventory.itemDetail.adjustStock.quantity")}
                        </th>
                        <th className="px-3 py-2">
                          {t("dashboard.inventory.itemDetail.adjustStock.serialNumbers")}
                        </th>
                        <th className="px-3 py-2 text-right">
                          {t("dashboard.inventory.itemDetail.adjustStock.before")}
                        </th>
                        <th className="px-3 py-2 text-right">
                          {t("dashboard.inventory.itemDetail.adjustStock.after")}
                        </th>
                        <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.adjustStock.remarks")}</th>
                        <th className="px-3 py-2">{t("dashboard.inventory.itemDetail.adjustStock.recordedAt")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustments.map((row) => (
                        <tr key={row.adjustmentId} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2.5 text-brand-primary">
                            {formatDetailDate(row.adjustmentDate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold ${
                                row.type === "add"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {row.type === "add"
                                ? t("dashboard.inventory.itemDetail.adjustStock.add")
                                : t("dashboard.inventory.itemDetail.adjustStock.reduce")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-brand-primary">
                            {row.type === "add" ? "+" : "−"}
                            {row.quantity} {row.unit}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.serialNumbers?.length ? (
                              <div className="flex max-w-[220px] flex-wrap gap-1">
                                {row.serialNumbers.map((sn) => (
                                  <span
                                    key={sn}
                                    className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-violet-800"
                                  >
                                    {sn}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-brand-primary-muted">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-brand-primary-muted">
                            {row.stockBefore} {row.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-brand-primary">
                            {row.stockAfter} {row.unit}
                          </td>
                          <td className="px-3 py-2.5 text-brand-primary-mid">
                            {row.remarks?.trim() || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-brand-primary-muted">
                            {formatDateTime(row.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          {activeOrganisationId &&
            (item.serialised ? (
              <AdjustSerialStockModal
                open={adjustOpen}
                onClose={() => setAdjustOpen(false)}
                organisationId={activeOrganisationId}
                item={item}
                onSaved={handleStockAdjusted}
              />
            ) : (
              <AdjustStockModal
                open={adjustOpen}
                onClose={() => setAdjustOpen(false)}
                organisationId={activeOrganisationId}
                item={item}
                onSaved={handleStockAdjusted}
              />
            ))}
        </>
      ) : null}
    </div>
  );
}

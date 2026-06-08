"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDate, formatInr, StatCard } from "@/lib/dashboard/page-utils";
import { fetchPurchaseOrders } from "@/lib/purchase/purchases-api-client";
import type { PurchaseOrderStatus, PurchaseOrderSummary } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

function OrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const { t } = useTranslation();
  const styles: Record<PurchaseOrderStatus, string> = {
    draft: "bg-slate-100 text-slate-700",
    open: "bg-blue-50 text-blue-800",
    partial: "bg-amber-50 text-amber-900",
    received: "bg-emerald-50 text-emerald-800",
    cancelled: "bg-red-50 text-red-800",
  };
  const labels: Record<PurchaseOrderStatus, string> = {
    draft: t("dashboard.purchases.orderStatusDraft"),
    open: t("dashboard.purchases.orderStatusOpen"),
    partial: t("dashboard.purchases.orderStatusPartial"),
    received: t("dashboard.purchases.orderStatusReceived"),
    cancelled: t("dashboard.purchases.orderStatusCancelled"),
  };
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return setOrders([]);
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPurchaseOrders(orgId, { status: status as PurchaseOrderStatus | "all", search: query.trim() || undefined, limit: 100, page: 1 });
      setOrders(data.items);
    } catch (err) {
      setOrders([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.purchases.ordersEmpty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => ({
    total: orders.length,
    open: orders.filter((o) => o.status === "open" || o.status === "partial").length,
    amount: orders.reduce((s, o) => s + o.totalAmount, 0),
  }), [orders]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.purchases.ordersSubtitle")}</p>
          <h2 className="mt-1 text-xl font-bold text-brand-primary lg:text-2xl">{t("dashboard.nav.purchaseOrders")}</h2>
        </div>
        <Link href="/dashboard/purchases/purchase-orders/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white">
          + {t("dashboard.purchases.createOrder")}
        </Link>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label={t("dashboard.purchases.totalCount")} value={String(summary.total)} />
        <StatCard label={t("dashboard.purchases.openOrders")} value={String(summary.open)} accent="amber" />
        <StatCard label={t("dashboard.purchases.ordersValue")} value={formatInr(summary.amount)} accent="navy" />
      </div>
      <div className="overflow-hidden rounded-sm border border-slate-200/90 bg-white">
        <div className="flex gap-3 border-b p-4">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dashboard.purchases.searchPlaceholder")} className="h-10 flex-1 rounded-md border border-slate-200/90 px-3 text-sm" />
          <div className="w-40"><ModernSelect value={status} onChange={setStatus} options={[{ value: "all", label: t("dashboard.purchases.allStatuses") }, { value: "open", label: t("dashboard.purchases.orderStatusOpen") }, { value: "received", label: t("dashboard.purchases.orderStatusReceived") }]} /></div>
        </div>
        <table className="w-full min-w-[800px] text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase text-brand-primary-muted"><th className="px-4 py-3">{t("dashboard.purchases.colOrder")}</th><th className="px-4 py-3">{t("dashboard.purchases.colDate")}</th><th className="px-4 py-3">{t("dashboard.purchases.colSupplier")}</th><th className="px-4 py-3 text-right">{t("dashboard.purchases.colAmount")}</th><th className="px-4 py-3">{t("dashboard.purchases.colStatus")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && loadError && <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{loadError}</td></tr>}
            {!loading && !loadError && orders.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.purchases.ordersEmpty")}</td></tr>}
            {!loading && orders.map((order) => (
              <tr key={order.purchaseOrderId} className="cursor-pointer border-b hover:bg-brand-surface/40" onClick={() => router.push(`/dashboard/purchases/purchase-orders/${order.purchaseOrderId}`)}>
                <td className="px-4 py-3 font-semibold">{order.displayNumber}</td>
                <td className="px-4 py-3">{formatDate(order.orderDate)}</td>
                <td className="px-4 py-3">{order.partyName}</td>
                <td className="px-4 py-3 text-right">{formatInr(order.totalAmount)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

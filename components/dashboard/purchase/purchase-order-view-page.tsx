"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatDate, formatInr } from "@/lib/dashboard/page-utils";
import {
  convertPurchaseOrderToBill,
  fetchPurchaseOrderDetail,
  markPurchaseOrderReceived,
} from "@/lib/purchase/purchases-api-client";
import type { PurchaseOrderDetail } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

export function PurchaseOrderViewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !params.id) return;
    setLoading(true);
    try {
      setOrder(await fetchPurchaseOrderDetail(orgId, params.id));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : t("dashboard.purchases.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, params.id, t]);

  useEffect(() => { void load(); }, [load]);

  const handleReceived = async () => {
    if (!orgId || !params.id) return;
    setActionLoading(true);
    try {
      setOrder(await markPurchaseOrderReceived(orgId, params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.orderReceivedError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!orgId || !params.id) return;
    setActionLoading(true);
    try {
      const bill = await convertPurchaseOrderToBill(orgId, params.id);
      router.push(`/dashboard/purchases/${bill.purchaseBillId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.purchases.convertError"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-6">{t("common.pleaseWait")}</div>;
  if (!order) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/purchases/purchase-orders" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.purchases.backToOrders")}</Link>
      <h2 className="mt-2 text-xl font-bold text-brand-primary">{order.displayNumber}</h2>
      <p className="text-sm text-brand-primary-muted">{order.partyName} · {formatDate(order.orderDate)}</p>
      <div className="mt-4 flex gap-2">
        {order.status !== "received" && order.status !== "cancelled" && (
          <button type="button" disabled={actionLoading} onClick={() => void handleReceived()} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">{t("dashboard.purchases.markReceived")}</button>
        )}
        {order.status !== "cancelled" && (
          <button type="button" disabled={actionLoading} onClick={() => void handleConvert()} className="rounded-md border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary">{t("dashboard.purchases.convertToBill")}</button>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3 text-left">{t("dashboard.purchases.create.colItem")}</th><th className="px-4 py-3 text-right">{t("dashboard.purchases.create.colQty")}</th><th className="px-4 py-3 text-right">{t("dashboard.purchases.create.colAmount")}</th></tr></thead>
          <tbody>{order.lineItems.map((line) => (<tr key={line.lineId} className="border-b"><td className="px-4 py-3">{line.name}</td><td className="px-4 py-3 text-right">{line.qty}</td><td className="px-4 py-3 text-right">{formatInr(line.amount)}</td></tr>))}</tbody>
        </table>
        <p className="px-4 py-3 text-right font-bold">{formatInr(order.totalAmount)}</p>
      </div>
    </div>
  );
}

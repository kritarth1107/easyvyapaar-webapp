"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  fetchDeliveryChallanDetail,
  updateDeliveryChallan,
} from "@/lib/sales/delivery-challans-api-client";
import { canCancelChallan, nextStatusForAction } from "@/lib/sales/map-create-delivery-challan-request";
import type { DeliveryChallanDetail, DeliveryChallanStatus } from "@/lib/types/delivery-challans-api";
import { useTranslation } from "@/lib/localization";

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: DeliveryChallanStatus }) {
  const { t } = useTranslation();
  const styles: Record<DeliveryChallanStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    dispatched: "bg-blue-50 text-blue-800 ring-blue-600/15",
    delivered: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    cancelled: "bg-red-50 text-red-800 ring-red-600/15",
  };
  const labels: Record<DeliveryChallanStatus, string> = {
    draft: t("dashboard.deliveryChallans.statusDraft"),
    dispatched: t("dashboard.deliveryChallans.statusDispatched"),
    delivered: t("dashboard.deliveryChallans.statusDelivered"),
    cancelled: t("dashboard.deliveryChallans.statusCancelled"),
  };

  return (
    <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function DeliveryChallanViewPage({ deliveryChallanId }: { deliveryChallanId: string }) {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [challan, setChallan] = useState<DeliveryChallanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !deliveryChallanId.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const detail = await fetchDeliveryChallanDetail(orgId, deliveryChallanId.trim());
      setChallan(detail);
    } catch (err) {
      setChallan(null);
      setError(err instanceof Error ? err.message : t("dashboard.deliveryChallans.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, deliveryChallanId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (action: "dispatch" | "deliver" | "cancel") => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !challan) return;

    setUpdating(true);
    setError(null);
    try {
      const updated = await updateDeliveryChallan(orgId, challan.deliveryChallanId, {
        status: nextStatusForAction(challan.status, action),
      });
      setChallan(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.deliveryChallans.view.updateError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-sm text-red-600">{error ?? t("dashboard.deliveryChallans.view.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/sales/delivery-challan"
            className="text-sm font-medium text-brand-primary-muted hover:text-brand-primary"
          >
            ← {t("dashboard.deliveryChallans.backToList")}
          </Link>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.deliveryChallans.view.title").replace("{number}", challan.displayNumber)}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={challan.status} />
            {challan.stockDeducted ? (
              <span className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.stockDeducted")}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {challan.status === "draft" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => void changeStatus("dispatch")}
              className="h-9 rounded-md bg-brand-primary px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {t("dashboard.deliveryChallans.view.markDispatched")}
            </button>
          ) : null}
          {challan.status === "dispatched" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => void changeStatus("deliver")}
              className="h-9 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {t("dashboard.deliveryChallans.view.markDelivered")}
            </button>
          ) : null}
          {canCancelChallan(challan.status) ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => void changeStatus("cancel")}
              className="h-9 rounded-sm border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {t("dashboard.deliveryChallans.view.cancel")}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-sm border border-slate-200/90 bg-white p-4">
          <h3 className="text-sm font-semibold text-brand-primary">{t("dashboard.deliveryChallans.view.items")}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                  <th className="px-2 py-2">{t("dashboard.deliveryChallans.view.colItem")}</th>
                  <th className="px-2 py-2">{t("dashboard.deliveryChallans.view.colHsn")}</th>
                  <th className="px-2 py-2 text-right">{t("dashboard.deliveryChallans.view.colQty")}</th>
                  <th className="px-2 py-2">{t("dashboard.deliveryChallans.view.colSerial")}</th>
                </tr>
              </thead>
              <tbody>
                {challan.lineItems.map((line) => (
                  <tr key={line.lineId} className="border-b border-slate-50">
                    <td className="px-2 py-2">
                      <p className="font-medium text-brand-primary">{line.name}</p>
                      <p className="text-xs text-brand-primary-muted">{line.unit}</p>
                    </td>
                    <td className="px-2 py-2 text-brand-primary-mid">{line.hsn || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{line.qty}</td>
                    <td className="px-2 py-2 text-xs text-brand-primary-muted">
                      {line.serialNumbers?.length ? line.serialNumbers.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-sm border border-slate-200/90 bg-white p-4 text-sm">
            <h3 className="font-semibold text-brand-primary">{t("dashboard.deliveryChallans.view.details")}</h3>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.party")}</dt>
                <dd className="font-medium text-brand-primary">{challan.partyName}</dd>
                {challan.partyPhone ? <dd className="text-brand-primary-muted">{challan.partyPhone}</dd> : null}
              </div>
              <div>
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.challanDate")}</dt>
                <dd>{formatDate(challan.challanDate)}</dd>
              </div>
              {challan.deliveryDate ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.deliveryDate")}</dt>
                  <dd>{formatDate(challan.deliveryDate)}</dd>
                </div>
              ) : null}
              {challan.invoiceId ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.invoice")}</dt>
                  <dd>
                    <Link
                      href={`/dashboard/sales/invoices/${encodeURIComponent(challan.invoiceId)}`}
                      className="font-mono text-xs font-semibold text-brand-primary hover:underline"
                    >
                      {challan.invoiceDisplayNumber ?? challan.invoiceId}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {challan.shippingAddress ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.shippingAddress")}</dt>
                  <dd className="whitespace-pre-wrap">{challan.shippingAddress}</dd>
                </div>
              ) : null}
              {challan.vehicleNumber ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.vehicleNumber")}</dt>
                  <dd>{challan.vehicleNumber}</dd>
                </div>
              ) : null}
              {challan.transportRef ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.transportRef")}</dt>
                  <dd>{challan.transportRef}</dd>
                </div>
              ) : null}
              {challan.notes ? (
                <div>
                  <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.notes")}</dt>
                  <dd className="whitespace-pre-wrap">{challan.notes}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.deliveryChallans.view.totalQty")}</dt>
                <dd className="text-lg font-bold tabular-nums text-brand-primary">{challan.totalQty}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

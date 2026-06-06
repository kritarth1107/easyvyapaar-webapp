"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchDeliveryChallans } from "@/lib/sales/delivery-challans-api-client";
import type { DeliveryChallanStatus, DeliveryChallanSummary } from "@/lib/types/delivery-challans-api";
import { useTranslation } from "@/lib/localization";

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: "navy" | "green" | "amber" }) {
  const ring =
    accent === "green"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : accent === "amber"
        ? "border-amber-200/80 bg-amber-50/30"
        : accent === "navy"
          ? "border-brand-primary/15 bg-brand-primary/[0.03]"
          : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
    </div>
  );
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
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function DeliveryChallansPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [challans, setChallans] = useState<DeliveryChallanSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setChallans([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDeliveryChallans(orgId, {
        status: status as DeliveryChallanStatus | "all",
        search: query.trim() || undefined,
        limit: 100,
        page: 1,
      });
      setChallans(data.items);
    } catch (err) {
      setChallans([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.deliveryChallans.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, status, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);
    let todayQty = 0;
    let monthQty = 0;
    let draftCount = 0;
    let dispatchedCount = 0;

    for (const row of challans) {
      if (row.challanDate === today) todayQty += row.totalQty;
      if (row.challanDate.startsWith(monthPrefix)) monthQty += row.totalQty;
      if (row.status === "draft") draftCount += 1;
      if (row.status === "dispatched") dispatchedCount += 1;
    }

    return { todayQty, monthQty, totalCount: challans.length, draftCount, dispatchedCount };
  }, [challans]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.deliveryChallans.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.deliveryChallan")}
          </h2>
        </div>
        <Link
          href="/dashboard/sales/delivery-challan/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.deliveryChallans.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.deliveryChallans.todayQty")}
          value={String(summary.todayQty)}
          accent="green"
        />
        <StatCard label={t("dashboard.deliveryChallans.monthQty")} value={String(summary.monthQty)} accent="navy" />
        <StatCard label={t("dashboard.deliveryChallans.totalCount")} value={String(summary.totalCount)} />
        <StatCard
          label={t("dashboard.deliveryChallans.draftDispatched")}
          value={`${summary.draftCount} / ${summary.dispatchedCount}`}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.deliveryChallans.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.deliveryChallans.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[160px] shrink-0 sm:w-[180px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.deliveryChallans.allStatuses") },
                { value: "draft", label: t("dashboard.deliveryChallans.statusDraft") },
                { value: "dispatched", label: t("dashboard.deliveryChallans.statusDispatched") },
                { value: "delivered", label: t("dashboard.deliveryChallans.statusDelivered") },
                { value: "cancelled", label: t("dashboard.deliveryChallans.statusCancelled") },
              ]}
              aria-label={t("dashboard.deliveryChallans.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.deliveryChallans.colChallan")}</th>
                <th className="px-4 py-3">{t("dashboard.deliveryChallans.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.deliveryChallans.colParty")}</th>
                <th className="px-4 py-3">{t("dashboard.deliveryChallans.colInvoice")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.deliveryChallans.colQty")}</th>
                <th className="px-4 py-3">{t("dashboard.deliveryChallans.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.deliveryChallans.empty")}
                  </td>
                </tr>
              ) : (
                challans.map((challan) => <ChallanRow key={challan.deliveryChallanId} challan={challan} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChallanRow({ challan }: { challan: DeliveryChallanSummary }) {
  const router = useRouter();
  const href = `/dashboard/sales/delivery-challan/${encodeURIComponent(challan.deliveryChallanId)}`;

  const openChallan = () => {
    router.push(href);
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/40 hover:[&_span]:underline"
      onClick={openChallan}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openChallan();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open delivery challan ${challan.displayNumber}`}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-brand-primary underline-offset-2">
          {challan.displayNumber}
        </span>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(challan.challanDate)}</td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{challan.partyName}</p>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">
        {challan.invoiceDisplayNumber ? (
          <span className="font-mono text-xs">{challan.invoiceDisplayNumber}</span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums text-brand-primary">{challan.totalQty}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={challan.status} />
      </td>
    </tr>
  );
}

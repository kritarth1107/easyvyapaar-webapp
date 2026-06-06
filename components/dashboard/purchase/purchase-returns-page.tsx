"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatDate, formatInr, StatCard } from "@/lib/dashboard/page-utils";
import { fetchPurchaseReturns } from "@/lib/purchase/purchases-api-client";
import type { PurchaseReturnSummary } from "@/lib/types/purchase-api";
import { useTranslation } from "@/lib/localization";

export function PurchaseReturnsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [returns, setReturns] = useState<PurchaseReturnSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return setReturns([]);
    setLoading(true);
    try {
      const data = await fetchPurchaseReturns(orgId, { search: query.trim() || undefined, limit: 100, page: 1 });
      setReturns(data.items);
    } catch (err) {
      setReturns([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.purchases.returnsEmpty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const total = returns.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex justify-between">
        <div><p className="text-sm text-brand-primary-muted">{t("dashboard.purchases.returnsSubtitle")}</p><h2 className="text-xl font-bold">{t("dashboard.nav.purchaseReturns")}</h2></div>
        <Link href="/dashboard/purchases/purchase-returns/new" className="inline-flex h-10 items-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white">+ {t("dashboard.purchases.createReturn")}</Link>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3"><StatCard label={t("dashboard.purchases.totalCount")} value={String(returns.length)} /><StatCard label={t("dashboard.purchases.returnsTotal")} value={formatInr(total)} accent="amber" /></div>
      <div className="overflow-hidden rounded-md border bg-white">
        <div className="border-b p-4"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("dashboard.purchases.searchPlaceholder")} className="h-10 w-full rounded-md border px-3 text-sm" /></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.purchases.colReturn")}</th><th className="px-4 py-3">{t("dashboard.purchases.colBill")}</th><th className="px-4 py-3">{t("dashboard.purchases.colDate")}</th><th className="px-4 py-3">{t("dashboard.purchases.colSupplier")}</th><th className="px-4 py-3 text-right">{t("dashboard.purchases.colAmount")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && loadError && <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{loadError}</td></tr>}
            {!loading && returns.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.purchases.returnsEmpty")}</td></tr>}
            {!loading && returns.map((ret) => (
              <tr key={ret.purchaseReturnId} className="border-b">
                <td className="px-4 py-3 font-semibold">{ret.displayNumber}</td>
                <td className="px-4 py-3">{ret.purchaseBillDisplayNumber}</td>
                <td className="px-4 py-3">{formatDate(ret.returnDate)}</td>
                <td className="px-4 py-3">{ret.partyName}</td>
                <td className="px-4 py-3 text-right">{formatInr(ret.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

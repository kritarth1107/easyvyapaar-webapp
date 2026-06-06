"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { fetchQuotations } from "@/lib/sales/quotations-api-client";
import type { QuotationStatus, QuotationSummary } from "@/lib/types/quotations-api";
import { useTranslation } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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

function StatusBadge({ status }: { status: QuotationStatus }) {
  const { t } = useTranslation();
  const styles: Record<QuotationStatus, string> = {
    draft: "bg-slate-100 text-slate-700 ring-slate-400/20",
    sent: "bg-blue-50 text-blue-800 ring-blue-600/15",
    accepted: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    rejected: "bg-red-50 text-red-800 ring-red-600/15",
    expired: "bg-amber-50 text-amber-900 ring-amber-600/15",
    converted: "bg-violet-50 text-violet-800 ring-violet-600/15",
  };
  const labels: Record<QuotationStatus, string> = {
    draft: t("dashboard.quotations.statusDraft"),
    sent: t("dashboard.quotations.statusSent"),
    accepted: t("dashboard.quotations.statusAccepted"),
    rejected: t("dashboard.quotations.statusRejected"),
    expired: t("dashboard.quotations.statusExpired"),
    converted: t("dashboard.quotations.statusConverted"),
  };

  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function QuotationsPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setQuotations([]);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchQuotations(orgId, {
        status: status as QuotationStatus | "all",
        search: query.trim() || undefined,
        limit: 100,
        page: 1,
      });
      setQuotations(data.items);
    } catch (err) {
      setQuotations([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.quotations.empty"));
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
    let todayTotal = 0;
    let monthTotal = 0;
    let draftCount = 0;
    let sentCount = 0;

    for (const q of quotations) {
      if (q.quotationDate === today) todayTotal += q.totalAmount;
      if (q.quotationDate.startsWith(monthPrefix)) monthTotal += q.totalAmount;
      if (q.status === "draft") draftCount += 1;
      if (q.status === "sent") sentCount += 1;
    }

    return { todayTotal, monthTotal, totalCount: quotations.length, draftCount, sentCount };
  }, [quotations]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t("dashboard.quotations.subtitle")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.quotations")}
          </h2>
        </div>
        <Link
          href="/dashboard/sales/quotations/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.quotations.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.quotations.todayTotal")} value={formatInr(summary.todayTotal)} accent="green" />
        <StatCard label={t("dashboard.quotations.monthTotal")} value={formatInr(summary.monthTotal)} accent="navy" />
        <StatCard label={t("dashboard.quotations.totalCount")} value={String(summary.totalCount)} />
        <StatCard
          label={t("dashboard.quotations.draftSent")}
          value={`${summary.draftCount} / ${summary.sentCount}`}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.quotations.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.quotations.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[160px] shrink-0 sm:w-[180px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.quotations.allStatuses") },
                { value: "draft", label: t("dashboard.quotations.statusDraft") },
                { value: "sent", label: t("dashboard.quotations.statusSent") },
                { value: "accepted", label: t("dashboard.quotations.statusAccepted") },
                { value: "rejected", label: t("dashboard.quotations.statusRejected") },
                { value: "expired", label: t("dashboard.quotations.statusExpired") },
                { value: "converted", label: t("dashboard.quotations.statusConverted") },
              ]}
              aria-label={t("dashboard.quotations.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.quotations.colQuotation")}</th>
                <th className="px-4 py-3">{t("dashboard.quotations.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.quotations.colValidUntil")}</th>
                <th className="px-4 py-3">{t("dashboard.quotations.colParty")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.quotations.colAmount")}</th>
                <th className="px-4 py-3">{t("dashboard.quotations.colStatus")}</th>
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
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.quotations.empty")}
                  </td>
                </tr>
              ) : (
                quotations.map((quotation) => (
                  <QuotationRow key={quotation.quotationId} quotation={quotation} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuotationRow({ quotation }: { quotation: QuotationSummary }) {
  const router = useRouter();
  const href = `/dashboard/sales/quotations/${encodeURIComponent(quotation.quotationId)}`;

  const openQuotation = () => {
    router.push(href);
  };

  return (
    <tr
      className="cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/40 hover:[&_span]:underline"
      onClick={openQuotation}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openQuotation();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open quotation ${quotation.displayNumber}`}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-brand-primary underline-offset-2">
          {quotation.displayNumber}
        </span>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(quotation.quotationDate)}</td>
      <td className="px-4 py-3 text-brand-primary-mid">
        {quotation.validUntil ? formatDate(quotation.validUntil) : "—"}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{quotation.partyName}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums text-brand-primary">{formatInr(quotation.totalAmount)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={quotation.status} />
      </td>
    </tr>
  );
}

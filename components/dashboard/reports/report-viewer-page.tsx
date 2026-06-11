"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CompactDateField } from "@/components/ui/compact-date-field";
import { useUserMe } from "@/components/providers/user-me-provider";
import { BalanceSheetReportView } from "@/components/dashboard/reports/balance-sheet-report-view";
import { ProfitLossReportView } from "@/components/dashboard/reports/profit-loss-report-view";
import { ReportSectionView } from "@/components/dashboard/reports/report-primitives";
import { formatDateIndian } from "@/lib/dashboard/date-format";
import { AS_OF_DATE_REPORTS, getDefaultReportDateRange } from "@/lib/reports/report-backend-map";
import { fetchReport, isReportSlug } from "@/lib/reports/reports-api-client";
import type { ReportData } from "@/lib/types/reports-api";
import { useTranslation } from "@/lib/localization";

const PAGINATED_REPORTS = new Set([
  "daybook",
  "party-outstanding",
  "stock-detail",
  "item-sales-purchase",
  "bill-wise-profit",
  "party-report-by-item",
]);

export function ReportViewerPage() {
  const { t } = useTranslation();
  const params = useParams<{ reportSlug: string }>();
  const { activeOrganisationId, activeOrganisation } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const slug = params.reportSlug;
  const validSlug = isReportSlug(slug) ? slug : null;

  const defaults = useMemo(() => getDefaultReportDateRange(), []);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAsOfReport = validSlug ? AS_OF_DATE_REPORTS.includes(validSlug) : false;
  const isPaginated = validSlug ? PAGINATED_REPORTS.has(validSlug) : false;
  const isProfitLoss = validSlug === "profit-and-loss";
  const isBalanceSheet = validSlug === "balance-sheet";
  const isMonthReport = isProfitLoss || isBalanceSheet;

  const monthRange = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const lastDay = new Date(y, mo, 0).getDate();
    return {
      fromDate: `${month}-01`,
      toDate: `${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [month]);

  const load = useCallback(async () => {
    if (!orgId || !validSlug) return;
    const range = isMonthReport ? monthRange : { fromDate, toDate };
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport(orgId, validSlug, {
        fromDate: range.fromDate,
        toDate: range.toDate,
        page: isPaginated ? page : 1,
        limit: isPaginated ? 50 : 200,
      });
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : t("dashboard.reports.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, validSlug, fromDate, toDate, monthRange, isMonthReport, page, isPaginated, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasContent =
    report &&
    (report.sections.length > 0 || Boolean(report.profitLoss) || Boolean(report.balanceSheet));

  if (!validSlug) {
    return (
      <div className="p-6">
        <p className="text-red-600">{t("dashboard.reports.invalidReport")}</p>
        <Link
          href="/dashboard/reports"
          className="mt-4 inline-block text-sm font-semibold text-brand-orange-2 hover:underline"
        >
          ← {t("dashboard.reports.backToHub")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Link
        href="/dashboard/reports"
        className="text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        ← {t("dashboard.reports.backToHub")}
      </Link>
      <h2 className="mt-2 text-xl font-bold">{t(`dashboard.reports.slugs.${validSlug}`)}</h2>
      <p className="mt-1 text-sm text-brand-primary-muted">{t(`dashboard.reports.descriptions.${validSlug}`)}</p>

      <div className="mt-4 mb-6 flex flex-wrap items-end gap-3">
        {isMonthReport ? (
          <label className="inline-flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              {isBalanceSheet
                ? t("dashboard.reports.balanceSheet.month")
                : t("dashboard.reports.profitLoss.month")}
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary shadow-sm"
            />
          </label>
        ) : isAsOfReport && !isBalanceSheet ? (
          <CompactDateField
            label={t("dashboard.reports.asOfDate")}
            value={toDate}
            onChange={(v) => {
              setToDate(v);
              setPage(1);
            }}
          />
        ) : (
          <>
            <CompactDateField
              label={t("dashboard.reports.fromDate")}
              value={fromDate}
              onChange={(v) => {
                setFromDate(v);
                setPage(1);
              }}
            />
            <span className="hidden pb-2 text-sm text-brand-primary-muted sm:inline">→</span>
            <CompactDateField
              label={t("dashboard.reports.toDate")}
              value={toDate}
              onChange={(v) => {
                setToDate(v);
                setPage(1);
              }}
            />
          </>
        )}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="h-9 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
        >
          {loading ? t("common.pleaseWait") : t("dashboard.reports.runReport")}
        </button>
        {isMonthReport ? (
          <p className="w-full text-xs text-brand-primary-muted">
            {isBalanceSheet
              ? `${t("dashboard.reports.balanceSheet.asOf")} ${formatDateIndian(monthRange.toDate)}`
              : `${formatDateIndian(monthRange.fromDate)} — ${formatDateIndian(monthRange.toDate)}`}
          </p>
        ) : !isAsOfReport ? (
          <p className="w-full text-xs text-brand-primary-muted">
            {formatDateIndian(fromDate)} — {formatDateIndian(toDate)}
          </p>
        ) : null}
      </div>

      {loading && (
        <p className="rounded-xl border border-slate-200/90 bg-white px-4 py-12 text-center text-brand-primary-muted shadow-sm">
          {t("common.pleaseWait")}
        </p>
      )}
      {!loading && error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-red-600">{error}</p>
      )}
      {!loading && !error && !hasContent && (
        <p className="rounded-xl border border-slate-200/90 bg-white px-4 py-12 text-center text-brand-primary-muted shadow-sm">
          {t("dashboard.reports.noData")}
        </p>
      )}
      {!loading && report && hasContent && (
        <div className="space-y-6">
          {report.profitLoss ? <ProfitLossReportView report={report.profitLoss} /> : null}
          {report.balanceSheet ? (
            <BalanceSheetReportView
              report={report.balanceSheet}
              outletName={activeOrganisation?.name}
            />
          ) : null}
          {report.sections.map((section, idx) => (
            <ReportSectionView key={`${section.type}-${idx}`} section={section} />
          ))}

          {report.pagination && isPaginated ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm text-brand-primary-muted">
                Page {report.pagination.page} of {report.pagination.totalPages} · {report.pagination.total} entries
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-slate-200/90 px-3 py-1.5 text-sm font-semibold text-brand-primary disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= report.pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-sm border border-slate-200/90 px-3 py-1.5 text-sm font-semibold text-brand-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

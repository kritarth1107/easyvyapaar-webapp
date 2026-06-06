"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  formatDate,
  formatInr,
  inputClass,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from "@/lib/dashboard/page-utils";
import { fetchReport, isReportSlug } from "@/lib/reports/reports-api-client";
import type { ReportColumn, ReportData, ReportRow } from "@/lib/types/reports-api";
import { useTranslation } from "@/lib/localization";

function formatCell(value: string | number | null | undefined, format?: ReportColumn["format"]): string {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "currency" && typeof value === "number") return formatInr(value);
  if (format === "date" && typeof value === "string") return formatDate(value);
  return String(value);
}

export function ReportViewerPage() {
  const { t } = useTranslation();
  const params = useParams<{ reportSlug: string }>();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const slug = params.reportSlug;
  const validSlug = isReportSlug(slug) ? slug : null;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !validSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport(orgId, validSlug, { fromDate, toDate, limit: 100, page: 1 });
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : t("dashboard.reports.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, validSlug, fromDate, toDate, t]);

  useEffect(() => { void load(); }, [load]);

  if (!validSlug) {
    return (
      <div className="p-6">
        <p className="text-red-600">{t("dashboard.reports.invalidReport")}</p>
        <Link href="/dashboard/reports" className="mt-4 inline-block text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.reports.backToHub")}</Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/reports" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.reports.backToHub")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t(`dashboard.reports.slugs.${validSlug}`)}</h2>
      <div className="mt-4 mb-6 flex flex-wrap gap-3">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${inputClass} w-auto`} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${inputClass} w-auto`} />
        <button type="button" onClick={() => void load()} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">{t("dashboard.reports.runReport")}</button>
      </div>
      <div className="overflow-hidden rounded-md border bg-white">
        {loading && <p className="px-4 py-8 text-center text-brand-primary-muted">{t("common.pleaseWait")}</p>}
        {!loading && error && <p className="px-4 py-8 text-center text-red-600">{error}</p>}
        {!loading && !error && report && report.rows.length === 0 && (
          <p className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.reports.noData")}</p>
        )}
        {!loading && report && report.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className={`${tableClass} min-w-[640px]`}>
              <thead>
                <tr className={tableHeadRowClass}>
                  {report.columns.map((col) => (
                    <th key={col.key} className={`${tableHeadCellClass} ${col.align === "right" ? "text-right" : "text-left"}`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row: ReportRow, idx) => (
                  <tr key={idx} className={tableBodyRowClass}>
                    {report.columns.map((col) => (
                      <td key={col.key} className={`${tableBodyCellClass} ${col.align === "right" ? "text-right tabular-nums" : ""}`}>
                        {formatCell(row[col.key], col.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

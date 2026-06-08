"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { PayrollMonthDetailModal } from "@/components/dashboard/staff/payroll-month-detail-modal";
import {
  formatInr,
  StatCard,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import { fetchPayrollMonthSummaries } from "@/lib/staff/staff-api-client";
import type { PayrollMonthSummary } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function PayrollPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [summaries, setSummaries] = useState<PayrollMonthSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailMonth, setDetailMonth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchPayrollMonthSummaries(orgId);
      setSummaries(data);
      setError(null);
    } catch (err) {
      setSummaries([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.empty"));
    } finally {
      setLoading(false);
    }
  }, [orgId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalAllTime = summaries.reduce((s, row) => s + row.totalNet, 0);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.payroll.subtitle")}</p>
          <h2 className="text-xl font-bold">{t("dashboard.staff.payroll.title")}</h2>
        </div>
        <Link
          href="/dashboard/staff-payroll/payroll/generate"
          className="h-9 rounded-md bg-brand-primary px-4 text-sm font-semibold leading-9 text-white"
        >
          {t("dashboard.staff.payroll.generate")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dashboard.staff.payroll.monthsGenerated")} value={String(summaries.length)} accent="navy" />
        <StatCard label={t("dashboard.staff.payroll.totalDisbursed")} value={formatInr(totalAllTime)} />
      </div>

      <div className={`${tablePanelClass} overflow-x-auto`}>
        <table className={`${tableClass} min-w-[720px]`}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.colMonth")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.staffCount")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.totalBasic")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.totalNet")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.paidCount")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={`${tableBodyCellClass} text-center`}>
                  {t("common.pleaseWait")}
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className={`${tableBodyCellClass} text-center text-red-600`}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && summaries.length === 0 && (
              <tr>
                <td colSpan={6} className={`${tableBodyCellClass} text-center text-brand-primary-muted`}>
                  {t("dashboard.staff.payroll.empty")}
                </td>
              </tr>
            )}
            {!loading &&
              summaries.map((row) => (
                <tr
                  key={row.month}
                  className={`${tableBodyRowClass} cursor-pointer hover:bg-brand-surface/40`}
                  onClick={() => setDetailMonth(row.month)}
                >
                  <td className={`${tableBodyCellClass} font-semibold`}>{formatMonthLabel(row.month)}</td>
                  <td className={`${tableBodyCellClass} text-right tabular-nums`}>{row.staffCount}</td>
                  <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(row.totalBasic)}</td>
                  <td className={`${tableBodyCellClass} text-right font-semibold tabular-nums`}>{formatInr(row.totalNet)}</td>
                  <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                    {row.paidCount} / {row.staffCount}
                  </td>
                  <td className={tableBodyCellClass}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailMonth(row.month);
                      }}
                      className="text-sm font-semibold text-brand-orange-2 hover:underline"
                    >
                      {t("dashboard.staff.payroll.viewDetail")}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/dashboard/staff-payroll/attendance"
        className="mt-4 inline-block text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        {t("dashboard.staff.payroll.goToAttendance")}
      </Link>

      {orgId ? (
        <PayrollMonthDetailModal
          open={Boolean(detailMonth)}
          month={detailMonth}
          organisationId={orgId}
          onClose={() => setDetailMonth(null)}
        />
      ) : null}
    </div>
  );
}

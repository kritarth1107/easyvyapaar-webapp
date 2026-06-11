"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CompactMonthField } from "@/components/ui/compact-month-field";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatMonthIndian } from "@/lib/dashboard/date-format";
import {
  panelClass,
  StatCard,
  tableBodyCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from "@/lib/dashboard/page-utils";
import { fetchAttendanceReport } from "@/lib/staff/staff-api-client";
import type { AttendanceReportEntry } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

function StaffAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/12 to-brand-orange-1/18 text-sm font-bold text-brand-primary"
      aria-hidden
    >
      {initial}
    </div>
  );
}

function CountBadge({ value, tone }: { value: number; tone: "green" | "rose" | "amber" | "sky" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "rose"
        ? "bg-red-100 text-red-800"
        : tone === "amber"
          ? "bg-amber-100 text-amber-900"
          : "bg-sky-100 text-sky-800";
  return (
    <span className={`inline-flex min-w-[1.75rem] justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${toneClass}`}>
      {value}
    </span>
  );
}

export function AttendanceReportPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState<AttendanceReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchAttendanceReport(orgId, { month });
      setItems(data.items);
      setError(null);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.reportEmpty"));
    } finally {
      setLoading(false);
    }
  }, [orgId, month, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        acc.present += row.presentDays;
        acc.absent += row.absentDays;
        acc.half += row.halfDays;
        acc.leave += row.leaveDays;
        acc.marked += row.totalDays;
        return acc;
      },
      { present: 0, absent: 0, half: 0, leave: 0, marked: 0 },
    );
  }, [items]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.staffName.localeCompare(b.staffName)),
    [items],
  );

  return (
    <div className="p-4 lg:p-6">
      <Link
        href="/dashboard/staff-payroll/attendance"
        className="text-sm font-semibold text-brand-orange-2 hover:underline"
      >
        ← {t("dashboard.staff.attendance.back")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.attendance.reportSubtitle")}</p>
          <h1 className="text-xl font-bold text-brand-primary">{t("dashboard.staff.attendance.reportTitle")}</h1>
        </div>
        <CompactMonthField
          value={month}
          onChange={setMonth}
          label={t("dashboard.staff.attendance.colDate")}
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("dashboard.staff.attendance.staffCount")} value={String(items.length)} accent="navy" />
        <StatCard
          label={t("dashboard.staff.attendance.totalMarkedDays")}
          value={String(summary.marked)}
          accent="blue"
        />
        <StatCard
          label={t("dashboard.staff.attendance.presentDays")}
          value={String(summary.present)}
          accent="green"
        />
        <StatCard
          label={t("dashboard.staff.attendance.absentDays")}
          value={String(summary.absent)}
          accent="rose"
        />
        <StatCard
          label={t("dashboard.staff.attendance.halfDays")}
          value={String(summary.half)}
          accent="amber"
        />
        <StatCard
          label={t("dashboard.staff.attendance.leaveDays")}
          value={String(summary.leave)}
          accent="sky"
        />
      </div>

      <div className="mt-8">
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold text-brand-primary">
              {formatMonthIndian(month)} — {t("dashboard.staff.attendance.reportTitle")}
            </h2>
          </div>
          <div className={`${panelClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className={`${tableClass} min-w-[640px]`}>
                <thead>
                  <tr className={tableHeadRowClass}>
                    <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colName")}</th>
                    <th className={`${tableHeadCellClass} text-right`}>
                      {t("dashboard.staff.attendance.presentDays")}
                    </th>
                    <th className={`${tableHeadCellClass} text-right`}>
                      {t("dashboard.staff.attendance.absentDays")}
                    </th>
                    <th className={`${tableHeadCellClass} text-right`}>
                      {t("dashboard.staff.attendance.halfDays")}
                    </th>
                    <th className={`${tableHeadCellClass} text-right`}>
                      {t("dashboard.staff.attendance.leaveDays")}
                    </th>
                    <th className={`${tableHeadCellClass} text-right`}>
                      {t("dashboard.staff.attendance.totalMarkedDays")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                      >
                        {t("common.pleaseWait")}
                      </td>
                    </tr>
                  ) : null}
                  {!loading && sortedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                      >
                        {t("dashboard.staff.attendance.reportEmpty")}
                      </td>
                    </tr>
                  ) : null}
                  {!loading &&
                    sortedItems.map((row) => (
                      <tr key={row.staffId} className="border-b border-slate-100 last:border-b-0">
                        <td className={tableBodyCellClass}>
                          <div className="flex items-center gap-3 font-medium">
                            <StaffAvatar name={row.staffName} />
                            <span className="truncate">{row.staffName}</span>
                          </div>
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          <CountBadge value={row.presentDays} tone="green" />
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          <CountBadge value={row.absentDays} tone="rose" />
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          <CountBadge value={row.halfDays} tone="amber" />
                        </td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          <CountBadge value={row.leaveDays} tone="sky" />
                        </td>
                        <td className={`${tableBodyCellClass} text-right tabular-nums text-brand-primary-muted`}>
                          {row.totalDays}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <Link
            href="/dashboard/staff-payroll/leave-requests"
            className={`${panelClass} flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80`}
          >
            <div>
              <p className="text-sm font-bold text-brand-primary">
                {t("dashboard.staff.attendance.leaveRequestsTitle")}
              </p>
              <p className="mt-1 text-xs text-brand-primary-muted">
                {t("dashboard.staff.attendance.leaveRequestsHint")}
              </p>
            </div>
            <span className="text-sm font-semibold text-brand-orange-2">
              {t("dashboard.staff.attendance.viewLeaveRequests")} →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

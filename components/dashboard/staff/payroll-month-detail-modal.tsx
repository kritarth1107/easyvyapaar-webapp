"use client";

import { useCallback, useEffect, useState } from "react";
import { PosModalShell } from "@/components/dashboard/pos/pos-modal-shell";
import { formatDateIndian } from "@/lib/dashboard/date-format";
import {
  formatInr,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import { fetchPayrollMonthDetail } from "@/lib/staff/staff-api-client";
import type { PayrollMonthDetail } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function PayrollMonthDetailModal({
  open,
  month,
  organisationId,
  onClose,
}: {
  open: boolean;
  month: string | null;
  organisationId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<PayrollMonthDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organisationId || !month) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayrollMonthDetail(organisationId, month);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.detailError"));
    } finally {
      setLoading(false);
    }
  }, [organisationId, month, t]);

  useEffect(() => {
    if (open && month) void load();
  }, [open, month, load]);

  return (
    <PosModalShell
      open={open}
      title={month ? `${t("dashboard.staff.payroll.detailTitle")} — ${formatMonthLabel(month)}` : t("dashboard.staff.payroll.detailTitle")}
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {loading ? (
        <p className="py-12 text-center text-brand-primary-muted">{t("common.pleaseWait")}</p>
      ) : error ? (
        <p className="py-12 text-center text-red-600">{error}</p>
      ) : detail ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200/90 bg-brand-surface/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-brand-primary-muted">{t("dashboard.staff.payroll.staffCount")}</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">{detail.summary.staffCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200/90 bg-brand-surface/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-brand-primary-muted">{t("dashboard.staff.payroll.totalBasic")}</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">{formatInr(detail.summary.totalBasic)}</p>
            </div>
            <div className="rounded-lg border border-slate-200/90 bg-brand-surface/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-brand-primary-muted">{t("dashboard.staff.payroll.totalNet")}</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">{formatInr(detail.summary.totalNet)}</p>
            </div>
            <div className="rounded-lg border border-slate-200/90 bg-brand-surface/30 p-3">
              <p className="text-[11px] font-semibold uppercase text-brand-primary-muted">{t("dashboard.staff.payroll.paidCount")}</p>
              <p className="mt-1 text-lg font-bold text-brand-primary">{detail.summary.paidCount} / {detail.summary.staffCount}</p>
            </div>
          </div>

          <div className={`${tablePanelClass} overflow-x-auto`}>
            <table className={`${tableClass} min-w-[1100px]`}>
              <thead>
                <tr className={tableHeadRowClass}>
                  <th className={tableHeadCellClass}>{t("dashboard.staff.colName")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.fullSalary")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.payableDays")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.eligibleDays")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.presentDays")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.leaveDays")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.absentDays")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.baseSalary")}</th>
                  <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.netPay")}</th>
                  <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.status")}</th>
                </tr>
              </thead>
              <tbody>
                {detail.employees.map((emp) => (
                  <tr key={emp.payrollId} className={tableBodyRowClass}>
                    <td className={tableBodyCellClass}>
                      <p className="font-medium">{emp.staffName}</p>
                      {emp.proration ? (
                        <p className="text-xs text-brand-primary-muted">
                          {t("dashboard.staff.create.joinDate")}: {formatDateIndian(emp.proration.joiningDate)}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {formatInr(emp.proration?.fullMonthlySalary ?? emp.baseSalary)}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {emp.proration ? `${emp.proration.payableDays} / ${emp.proration.monthlyWorkingDays}` : "—"}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{emp.proration?.eligibleDays ?? "—"}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {emp.proration
                        ? `${emp.proration.presentDays + emp.proration.assumedPresentDays}${emp.proration.halfDays ? ` + ${emp.proration.halfDays}½` : ""}`
                        : "—"}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {emp.proration
                        ? `${emp.proration.leaveDays} (${emp.proration.paidLeaveUsed} ${t("dashboard.staff.payroll.paidLeave")})`
                        : "—"}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{emp.proration?.absentDays ?? "—"}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(emp.baseSalary)}</td>
                    <td className={`${tableBodyCellClass} text-right font-semibold tabular-nums`}>{formatInr(emp.netPay)}</td>
                    <td className={tableBodyCellClass}>{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detail.employees.map((emp) =>
            emp.proration ? (
              <div key={`detail-${emp.payrollId}`} className="rounded-lg border border-slate-200/90 p-4">
                <h4 className="text-sm font-bold text-brand-primary">{emp.staffName}</h4>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.perDayRate")}:</span> {formatInr(emp.proration.perDaySalary)}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.proratedSalary")}:</span> {formatInr(emp.proration.proratedSalary)}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.create.workingDays")}:</span> {emp.proration.monthlyWorkingDays}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.create.paidLeave")}:</span> {emp.proration.paidLeaveAllowed}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.halfDays")}:</span> {emp.proration.halfDays}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.holidayDays")}:</span> {emp.proration.holidayDays}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.unpaidLeave")}:</span> {emp.proration.unpaidLeaveDays}</p>
                  <p><span className="text-brand-primary-muted">{t("dashboard.staff.payroll.assumedPresent")}:</span> {emp.proration.assumedPresentDays}</p>
                </div>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </PosModalShell>
  );
}

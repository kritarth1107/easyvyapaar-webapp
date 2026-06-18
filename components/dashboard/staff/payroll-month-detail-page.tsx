"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { PayrollMarkPaidModal } from "@/components/dashboard/staff/payroll-mark-paid-modal";
import { formatDateIndian } from "@/lib/dashboard/date-format";
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
import { fetchPayrollMonthDetail, markPayrollPaid } from "@/lib/staff/staff-api-client";
import type { PayrollSummary } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

function formatMessage(template: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, value),
    template,
  );
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function resolvePayPeriod(emp: PayrollSummary) {
  const from = emp.payPeriodFrom ?? emp.proration?.payPeriodFrom;
  const to = emp.payPeriodTo ?? emp.proration?.payPeriodTo;
  return { from, to };
}

function formatPayPeriodLabel(from?: string, to?: string) {
  if (!from && !to) return "—";
  if (from && to) return `${formatDateIndian(from)} – ${formatDateIndian(to)}`;
  if (from) return formatDateIndian(from);
  return formatDateIndian(to!);
}

function statusBadgeClass(status: PayrollSummary["status"]) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  if (status === "processed" || status === "generated") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-brand-primary-muted";
}

function canMarkPaid(status: PayrollSummary["status"]) {
  return status === "processed" || status === "generated" || status === "draft";
}

export function PayrollMonthDetailPage({ month }: { month: string }) {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [employees, setEmployees] = useState<PayrollSummary[]>([]);
  const [summary, setSummary] = useState<{
    staffCount: number;
    totalBasic: number;
    totalNet: number;
    paidCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markTarget, setMarkTarget] = useState<PayrollSummary | null>(null);
  const [markSubmitting, setMarkSubmitting] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !month) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayrollMonthDetail(orgId, month);
      setEmployees(data.employees);
      setSummary({
        staffCount: data.summary.staffCount,
        totalBasic: data.summary.totalBasic,
        totalNet: data.summary.totalNet,
        paidCount: data.summary.paidCount,
      });
    } catch (err) {
      setEmployees([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.detailError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, month, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthLabel = useMemo(() => formatMonthLabel(month), [month]);

  const handleMarkPaid = async (paymentDate: string, paymentRemark: string) => {
    if (!orgId || !markTarget) return;
    setMarkSubmitting(true);
    setMarkError(null);
    try {
      const updated = await markPayrollPaid(orgId, markTarget.payrollId, {
        paymentDate,
        ...(paymentRemark ? { paymentRemark } : {}),
      });
      setEmployees((rows) =>
        rows.map((row) => (row.payrollId === updated.payrollId ? { ...row, ...updated } : row)),
      );
      setSummary((prev) =>
        prev && markTarget.status !== "paid"
          ? { ...prev, paidCount: prev.paidCount + 1 }
          : prev,
      );
      setMarkTarget(null);
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : t("dashboard.staff.payroll.markPaidError"));
    } finally {
      setMarkSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/staff-payroll/payroll"
          className="text-sm font-semibold text-brand-orange-2 hover:underline"
        >
          ← {t("dashboard.staff.payroll.backToPayroll")}
        </Link>
        <h2 className="mt-2 text-xl font-bold text-brand-primary">
          {t("dashboard.staff.payroll.detailTitle")} — {monthLabel}
        </h2>
        <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.payroll.detailPageHint")}</p>
      </div>

      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("dashboard.staff.payroll.staffCount")} value={String(summary.staffCount)} accent="navy" />
          <StatCard label={t("dashboard.staff.payroll.totalBasic")} value={formatInr(summary.totalBasic)} />
          <StatCard label={t("dashboard.staff.payroll.totalNet")} value={formatInr(summary.totalNet)} />
          <StatCard
            label={t("dashboard.staff.payroll.paidCount")}
            value={`${summary.paidCount} / ${summary.staffCount}`}
          />
        </div>
      ) : null}

      <div className={`${tablePanelClass} overflow-x-auto`}>
        <table className={`${tableClass} min-w-[1200px]`}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>{t("dashboard.staff.colName")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.payPeriod")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.fullSalary")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.payableDays")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.presentDays")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.leaveDays")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.absentDays")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.baseSalary")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.payroll.netPay")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.status")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.paymentRemark")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className={`${tableBodyCellClass} text-center`}>
                  {t("common.pleaseWait")}
                </td>
              </tr>
            ) : null}
            {!loading && error ? (
              <tr>
                <td colSpan={12} className={`${tableBodyCellClass} text-center text-red-600`}>
                  {error}
                </td>
              </tr>
            ) : null}
            {!loading && !error && employees.length === 0 ? (
              <tr>
                <td colSpan={12} className={`${tableBodyCellClass} text-center text-brand-primary-muted`}>
                  {t("dashboard.staff.payroll.empty")}
                </td>
              </tr>
            ) : null}
            {!loading &&
              !error &&
              employees.map((emp) => {
                const period = resolvePayPeriod(emp);
                return (
                  <tr key={emp.payrollId} className={tableBodyRowClass}>
                    <td className={tableBodyCellClass}>
                      <p className="font-medium">{emp.staffName}</p>
                      {emp.proration?.joiningDate ? (
                        <p className="text-xs text-brand-primary-muted">
                          {t("dashboard.staff.create.joinDate")}: {formatDateIndian(emp.proration.joiningDate)}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableBodyCellClass} text-sm`}>
                      {formatPayPeriodLabel(period.from, period.to)}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {formatInr(emp.proration?.fullMonthlySalary ?? emp.baseSalary)}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {emp.proration
                        ? `${emp.proration.payableDays} / ${emp.proration.monthlyWorkingDays}`
                        : "—"}
                    </td>
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
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                      {emp.proration?.absentDays ?? "—"}
                    </td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(emp.baseSalary)}</td>
                    <td className={`${tableBodyCellClass} text-right font-semibold tabular-nums`}>
                      {formatInr(emp.netPay)}
                    </td>
                    <td className={tableBodyCellClass}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(emp.status)}`}
                      >
                        {emp.status}
                      </span>
                      {emp.status === "paid" && emp.paymentDate ? (
                        <p className="mt-1 text-xs text-brand-primary-muted">
                          {formatMessage(t("dashboard.staff.payroll.paidOn"), {
                            date: formatDateIndian(emp.paymentDate),
                          })}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tableBodyCellClass} max-w-[180px] text-sm text-brand-primary-muted`}>
                      {emp.paymentRemark || "—"}
                    </td>
                    <td className={tableBodyCellClass}>
                      {canMarkPaid(emp.status) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMarkError(null);
                            setMarkTarget(emp);
                          }}
                          className="text-sm font-semibold text-brand-orange-2 hover:underline"
                        >
                          {t("dashboard.staff.payroll.markPaid")}
                        </button>
                      ) : emp.status === "paid" ? (
                        <span className="text-xs text-brand-primary-muted">{t("dashboard.staff.payroll.alreadyPaid")}</span>
                      ) : (
                        <span className="text-xs text-brand-primary-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <PayrollMarkPaidModal
        open={Boolean(markTarget)}
        staffName={markTarget?.staffName ?? ""}
        netPayLabel={markTarget ? formatInr(markTarget.netPay) : ""}
        submitting={markSubmitting}
        error={markError}
        onClose={() => {
          if (!markSubmitting) setMarkTarget(null);
        }}
        onConfirm={(paymentDate, paymentRemark) => void handleMarkPaid(paymentDate, paymentRemark)}
      />
    </div>
  );
}

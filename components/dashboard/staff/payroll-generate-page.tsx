"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { CompactDateField } from "@/components/ui/compact-date-field";
import {
  formatInr,
  inputClass,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import { PayrollAttendanceModal } from "@/components/dashboard/staff/payroll-attendance-modal";
import { generatePayroll, previewPayroll } from "@/lib/staff/staff-api-client";
import type { PayrollPreviewEntry } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

type EditableRow = PayrollPreviewEntry & {
  rowKey: string;
  customFromDate?: string;
};

function computeNet(basic: number, allowances: number, deductions: number) {
  return Math.max(0, Math.round((basic + allowances - deductions) * 100) / 100);
}

function formatDateLabel(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PayrollGeneratePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";

  const initialToDate = searchParams.get("toDate") ?? new Date().toISOString().slice(0, 10);
  const [toDate, setToDate] = useState(initialToDate);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [attendanceModalStaffId, setAttendanceModalStaffId] = useState<string | null>(null);

  const buildStaffFromDates = useCallback((source: EditableRow[]) => {
    const map: Record<string, string> = {};
    for (const row of source) {
      if (row.customFromDate?.trim()) map[row.staffId] = row.customFromDate.trim();
    }
    return Object.keys(map).length > 0 ? map : undefined;
  }, []);

  const loadPreview = useCallback(async () => {
    if (!orgId || !toDate) return;
    setLoading(true);
    setError(null);
    try {
      const preview = await previewPayroll(orgId, { toDate });
      setRows(
        preview.items.map((item) => ({
          ...item,
          rowKey: item.staffId,
          customFromDate: item.proration?.payPeriodFrom,
        })),
      );
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.previewError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, toDate, t]);

  useEffect(() => {
    void loadPreview();
  }, [orgId, toDate]);

  const totalNet = useMemo(() => rows.reduce((sum, row) => sum + row.netPay, 0), [rows]);

  const hasUnresolvedMismatch = useMemo(
    () =>
      rows.some(
        (row) =>
          row.editable && (row.attendanceMismatch || row.proration?.attendanceMismatch),
      ),
    [rows],
  );

  const attendanceModalRow = useMemo(
    () => rows.find((row) => row.staffId === attendanceModalStaffId) ?? null,
    [rows, attendanceModalStaffId],
  );

  const patchRow = (staffId: string, patch: Partial<EditableRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.staffId !== staffId || !row.editable) return row;
        const next = { ...row, ...patch };
        const basicSalary = patch.basicSalary ?? row.basicSalary;
        const allowances = patch.allowances ?? row.allowances;
        const deductions = patch.deductions ?? row.deductions;
        return {
          ...next,
          basicSalary,
          allowances,
          deductions,
          netPay: computeNet(basicSalary, allowances, deductions),
        };
      }),
    );
  };

  const reloadWithCustomFrom = async (staffId: string, customFromDate: string) => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const preview = await previewPayroll(orgId, {
        toDate,
        staffFromDates: { [staffId]: customFromDate },
      });
      const updated = preview.items.find((item) => item.staffId === staffId);
      if (updated) {
        setRows((prev) =>
          prev.map((row) =>
            row.staffId === staffId
              ? {
                  ...updated,
                  rowKey: staffId,
                  customFromDate,
                }
              : row,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.previewError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (hasUnresolvedMismatch) return;
    setSubmitting(true);
    setError(null);
    try {
      const staffFromDates = buildStaffFromDates(rows);
      await generatePayroll(orgId, {
        toDate,
        ...(staffFromDates ? { staffFromDates } : {}),
        entries: rows
          .filter((row) => row.editable)
          .map((row) => ({
            staffId: row.staffId,
            basicSalary: row.basicSalary,
            allowances: row.allowances,
            deductions: row.deductions,
            notes: row.notes,
          })),
      });
      router.push("/dashboard/staff-payroll/payroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.generateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const refreshAfterAttendance = useCallback(async () => {
    if (!orgId || !toDate) return;
    setLoading(true);
    setError(null);
    try {
      const staffFromDates = buildStaffFromDates(rows);
      const preview = await previewPayroll(orgId, {
        toDate,
        ...(staffFromDates ? { staffFromDates } : {}),
      });
      setRows(
        preview.items.map((item) => ({
          ...item,
          rowKey: item.staffId,
          customFromDate:
            rows.find((r) => r.staffId === item.staffId)?.customFromDate ??
            item.proration?.payPeriodFrom,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.previewError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, toDate, rows, buildStaffFromDates, t]);

  return (
    <div className="p-4 lg:p-6">
      {attendanceModalRow?.proration ? (
        <PayrollAttendanceModal
          open={Boolean(attendanceModalStaffId)}
          organisationId={orgId}
          staffId={attendanceModalRow.staffId}
          staffName={attendanceModalRow.staffName}
          fromDate={attendanceModalRow.proration.payPeriodFrom}
          toDate={attendanceModalRow.proration.payPeriodTo}
          onClose={() => setAttendanceModalStaffId(null)}
          onSaved={() => void refreshAfterAttendance()}
        />
      ) : null}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/staff-payroll/payroll"
            className="mb-2 inline-block text-sm font-semibold text-brand-orange-2 hover:underline"
          >
            ← {t("dashboard.staff.payroll.backToPayroll")}
          </Link>
          <h2 className="text-xl font-bold">{t("dashboard.staff.payroll.generatePageTitle")}</h2>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.payroll.generatePageHint")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="inline-flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
              {t("dashboard.staff.payroll.payThroughDate")}
            </span>
            <CompactDateField value={toDate} onChange={setToDate} />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadPreview()}
            className="h-10 rounded-sm border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary"
          >
            {t("dashboard.staff.payroll.refreshPreview")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="py-12 text-center text-brand-primary-muted">{t("common.pleaseWait")}</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-brand-primary-muted">{t("dashboard.staff.payroll.noStaffForPeriod")}</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const proration = row.proration;
            const mismatch = row.attendanceMismatch || proration?.attendanceMismatch;
            const isOpen = expanded[row.staffId] ?? true;

            return (
              <div
                key={row.rowKey}
                className="rounded-lg border border-slate-200/90 bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [row.staffId]: !isOpen }))
                  }
                >
                  <div>
                    <p className="font-semibold text-brand-primary">{row.staffName}</p>
                    {proration ? (
                      <p className="text-sm text-brand-primary-muted">
                        {t("dashboard.staff.payroll.payPeriod")}: {formatDateLabel(proration.payPeriodFrom)} –{" "}
                        {formatDateLabel(proration.payPeriodTo)} · {proration.daysInPeriod}{" "}
                        {t("dashboard.staff.payroll.calendarDays")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-brand-primary">
                      {formatInr(row.netPay)}
                    </p>
                    {!row.editable ? (
                      <p className="text-xs text-brand-primary-muted">{t("dashboard.staff.payroll.lockedPaid")}</p>
                    ) : null}
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-slate-200/90 px-4 py-4">
                    {mismatch && row.editable ? (
                      <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">
                          {t("dashboard.staff.payroll.attendanceMismatchTitle")}
                        </p>
                        <p className="mt-1 text-sm text-amber-800">
                          {t("dashboard.staff.payroll.attendanceMismatchHint")
                            .replace("{marked}", String(proration?.attendanceMarkedDays ?? 0))
                            .replace("{total}", String(proration?.daysInPeriod ?? 0))
                            .replace("{unmarked}", String(proration?.unmarkedDays ?? 0))}
                        </p>
                        <button
                          type="button"
                          className="mt-3 rounded-md bg-amber-900 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-950"
                          onClick={() => setAttendanceModalStaffId(row.staffId)}
                        >
                          {t("dashboard.staff.payroll.attendanceUpdateButton")}
                        </button>
                      </div>
                    ) : null}

                    {proration ? (
                      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                        <StatPill label={t("dashboard.staff.payroll.presentDays")} value={String(proration.presentDays)} />
                        <StatPill label={t("dashboard.staff.payroll.absentDays")} value={String(proration.absentDays)} />
                        <StatPill label={t("dashboard.staff.payroll.leaveDays")} value={String(proration.leaveDays)} />
                        <StatPill
                          label={t("dashboard.staff.payroll.paidLeave")}
                          value={`${proration.paidLeaveUsed} / ${proration.paidLeaveAllowedForPeriod.toFixed(1)}`}
                        />
                        <StatPill label={t("dashboard.staff.payroll.halfDays")} value={String(proration.halfDays)} />
                        <StatPill
                          label={t("dashboard.staff.payroll.payableDays")}
                          value={`${proration.payableDays} / ${proration.eligibleDays}`}
                        />
                      </div>
                    ) : null}

                    {row.editable && proration ? (
                      <div className="mb-4 flex flex-wrap items-end gap-3">
                        <label className="inline-flex flex-col gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                            {t("dashboard.staff.payroll.customFromDate")}
                          </span>
                          <CompactDateField
                            value={row.customFromDate ?? proration.payPeriodFrom}
                            onChange={(value) => patchRow(row.staffId, { customFromDate: value })}
                          />
                        </label>
                        <button
                          type="button"
                          className="h-10 rounded-sm border border-slate-200/90 px-3 text-sm font-semibold text-brand-primary"
                          onClick={() =>
                            void reloadWithCustomFrom(
                              row.staffId,
                              row.customFromDate ?? proration.payPeriodFrom,
                            )
                          }
                        >
                          {t("dashboard.staff.payroll.applyFromDate")}
                        </button>
                      </div>
                    ) : null}

                    {proration && proration.salarySegments.length > 0 ? (
                      <div className={`${tablePanelClass} mb-4 overflow-x-auto`}>
                        <table className={`${tableClass} min-w-[720px]`}>
                          <thead>
                            <tr className={tableHeadRowClass}>
                              <th className={tableHeadCellClass}>{t("dashboard.staff.payroll.segmentPeriod")}</th>
                              <th className={`${tableHeadCellClass} text-right`}>
                                {t("dashboard.staff.payroll.fullSalary")}
                              </th>
                              <th className={`${tableHeadCellClass} text-right`}>
                                {t("dashboard.staff.payroll.perDayRate")}
                              </th>
                              <th className={`${tableHeadCellClass} text-right`}>
                                {t("dashboard.staff.payroll.calendarDays")}
                              </th>
                              <th className={`${tableHeadCellClass} text-right`}>
                                {t("dashboard.staff.payroll.payableDays")}
                              </th>
                              <th className={`${tableHeadCellClass} text-right`}>
                                {t("dashboard.staff.payroll.segmentAmount")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {proration.salarySegments.map((segment) => (
                              <tr key={`${row.staffId}-${segment.fromDate}-${segment.monthlySalary}`} className={tableBodyRowClass}>
                                <td className={tableBodyCellClass}>
                                  {formatDateLabel(segment.fromDate)} – {formatDateLabel(segment.toDate)}
                                </td>
                                <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                                  {formatInr(segment.monthlySalary)}
                                </td>
                                <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                                  {formatInr(segment.perDaySalary)}
                                </td>
                                <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                                  {segment.calendarDays}
                                </td>
                                <td className={`${tableBodyCellClass} text-right tabular-nums`}>
                                  {segment.payableDays}
                                </td>
                                <td className={`${tableBodyCellClass} text-right font-semibold tabular-nums`}>
                                  {formatInr(segment.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AmountField
                        label={t("dashboard.staff.payroll.baseSalary")}
                        value={row.basicSalary}
                        disabled={!row.editable}
                        onChange={(value) => patchRow(row.staffId, { basicSalary: value })}
                      />
                      <AmountField
                        label={`${t("dashboard.staff.payroll.allowances")} (${t("dashboard.staff.payroll.autoAllowances")}: ${formatInr(row.autoAllowances)})`}
                        value={row.allowances}
                        disabled={!row.editable}
                        onChange={(value) => patchRow(row.staffId, { allowances: value })}
                      />
                      <AmountField
                        label={`${t("dashboard.staff.payroll.deductions")} (${t("dashboard.staff.payroll.autoDeductions")}: ${formatInr(row.autoDeductions)})`}
                        value={row.deductions}
                        disabled={!row.editable}
                        onChange={(value) => patchRow(row.staffId, { deductions: value })}
                      />
                      <div>
                        <p className="mb-1 text-xs font-medium text-brand-primary-muted">
                          {t("dashboard.staff.payroll.netPay")}
                        </p>
                        <p className="text-lg font-bold tabular-nums text-brand-primary">{formatInr(row.netPay)}</p>
                      </div>
                    </div>

                    {row.adjustmentBreakdown.length > 0 ? (
                      <ul className="mt-3 space-y-1 text-sm text-brand-primary-muted">
                        {row.adjustmentBreakdown.map((line) => (
                          <li key={`${row.staffId}-${line.adjustmentId ?? line.label}`}>
                            {line.label}: {formatInr(line.amount)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-white px-4 py-3 shadow-md">
        <p className="text-sm font-semibold text-brand-primary">
          {t("dashboard.staff.payroll.totalNet")}: {formatInr(totalNet)}
        </p>
        <div className="flex gap-2">
          <Link
            href="/dashboard/staff-payroll/payroll"
            className="rounded-sm border border-slate-200/90 px-4 py-2 text-sm font-semibold text-brand-primary"
          >
            {t("common.cancel")}
          </Link>
          <button
            type="button"
            disabled={submitting || loading || rows.length === 0 || hasUnresolvedMismatch}
            onClick={() => void handleSubmit()}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? t("dashboard.staff.payroll.generating") : t("dashboard.staff.payroll.confirmGenerate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-brand-surface/50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-brand-primary">{value}</p>
    </div>
  );
}

function AmountField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-primary-muted">{label}</span>
      <input
        type="number"
        min={0}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`${inputClass} text-right`}
      />
    </label>
  );
}

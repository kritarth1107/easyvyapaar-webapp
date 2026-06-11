"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { CompactDateField } from "@/components/ui/compact-date-field";
import {
  formatDate,
  panelClass,
  tableBodyCellClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from "@/lib/dashboard/page-utils";
import { MarkAttendanceModal } from "@/components/dashboard/staff/mark-attendance-modal";
import { getAttendanceStatusUi } from "@/lib/staff/attendance-status-ui";
import { fetchAttendance, fetchStaffList } from "@/lib/staff/staff-api-client";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types/staff-api";
import { useTranslation, type TranslationKey } from "@/lib/localization";

type StaffOption = {
  value: string;
  label: string;
  phone?: string;
};

function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function MarkAttendanceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M10 4v6m0 0v2m0-2h2m-2 0H8M4 6.5A2.5 2.5 0 016.5 4h7A2.5 2.5 0 0116 6.5v7A2.5 2.5 0 0113.5 16h-7A2.5 2.5 0 014 13.5v-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StaffAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/12 to-brand-orange-1/18 font-bold text-brand-primary ${sizeClass}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: AttendanceStatus;
  label: string;
}) {
  const ui = getAttendanceStatusUi(status);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ui.pill}`}>
      {label}
    </span>
  );
}

function statusLabel(status: AttendanceStatus, t: (key: TranslationKey) => string) {
  switch (status) {
    case "present":
      return t("dashboard.staff.attendance.present");
    case "absent":
      return t("dashboard.staff.attendance.absent");
    case "half_day":
      return t("dashboard.staff.attendance.halfDay");
    case "leave":
      return t("dashboard.staff.attendance.leave");
    default:
      return status;
  }
}

function recordsByStaffId(records: AttendanceRecord[]): Map<string, AttendanceRecord> {
  const map = new Map<string, AttendanceRecord>();
  for (const record of records) {
    map.set(record.staffId, record);
  }
  return map;
}

type DailyAttendancePanelProps = {
  title: string;
  dateIso: string;
  dateLabel: string;
  staff: StaffOption[];
  recordsByStaff: Map<string, AttendanceRecord>;
  loading: boolean;
  loadingLabel: string;
  emptyStaffLabel: string;
  notRecordedLabel: string;
  markLabel: string;
  onMarkAttendance: (staffId: string, date: string) => void;
  statusLabelFn: (status: AttendanceStatus) => string;
};

function DailyAttendancePanel({
  title,
  dateIso,
  dateLabel,
  staff,
  recordsByStaff,
  loading,
  loadingLabel,
  emptyStaffLabel,
  notRecordedLabel,
  markLabel,
  onMarkAttendance,
  statusLabelFn,
}: DailyAttendancePanelProps) {
  const recordedCount = staff.filter((member) => recordsByStaff.has(member.value)).length;

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-brand-primary">{title}</h3>
          <p className="text-xs text-brand-primary-muted">{dateLabel}</p>
        </div>
        {!loading && staff.length > 0 ? (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-primary-muted ring-1 ring-inset ring-slate-200">
            {recordedCount}/{staff.length}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="px-4 py-8 text-center text-sm text-brand-primary-muted">{loadingLabel}</p>
      ) : staff.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-brand-primary-muted">{emptyStaffLabel}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {staff.map((member) => {
            const record = recordsByStaff.get(member.value);
            const displayName = member.label;

            if (!record) {
              return (
                <li key={member.value} className="flex items-center gap-3 px-4 py-3">
                  <StaffAvatar name={displayName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-primary">{displayName}</p>
                    <p className="text-xs text-amber-700/90">{notRecordedLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMarkAttendance(member.value, dateIso)}
                    className="shrink-0 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-105"
                  >
                    {markLabel}
                  </button>
                </li>
              );
            }

            const ui = getAttendanceStatusUi(record.status);
            return (
              <li
                key={member.value}
                className={`flex items-center gap-3 px-4 py-3 ${ui.row} ${ui.accent}`}
              >
                <StaffAvatar name={displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-primary">{displayName}</p>
                </div>
                <StatusPill status={record.status} label={statusLabelFn(record.status)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function AttendancePage() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = addDaysIso(today, -1);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [yesterdayRecords, setYesterdayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markModalDate, setMarkModalDate] = useState(today);
  const [markModalStaffId, setMarkModalStaffId] = useState<string | undefined>();

  const openMarkModal = useCallback((date: string, staffId?: string) => {
    setMarkModalDate(date);
    setMarkModalStaffId(staffId);
    setMarkModalOpen(true);
  }, []);

  const closeMarkModal = useCallback(() => {
    setMarkModalOpen(false);
    setMarkModalStaffId(undefined);
  }, []);

  const handleMarkStaffAttendance = useCallback(
    (staffId: string, date: string) => {
      openMarkModal(date, staffId);
    },
    [openMarkModal],
  );

  const staffNameById = useMemo(
    () => new Map(staffOptions.map((option) => [option.value, option.label])),
    [staffOptions],
  );

  const staffPhoneById = useMemo(
    () => new Map(staffOptions.map((option) => [option.value, option.phone])),
    [staffOptions],
  );

  const todayByStaff = useMemo(() => recordsByStaffId(todayRecords), [todayRecords]);
  const yesterdayByStaff = useMemo(() => recordsByStaffId(yesterdayRecords), [yesterdayRecords]);

  const statusLabelFn = useCallback(
    (status: AttendanceStatus) => statusLabel(status, t),
    [t],
  );

  useEffect(() => {
    if (!orgId) return;
    fetchStaffList(orgId, { status: "active", limit: 100, page: 1 })
      .then((data) =>
        setStaffOptions(
          data.items.map((s) => ({
            value: s.staffId,
            label: s.name,
            phone: s.phone,
          })),
        ),
      )
      .catch(() => setStaffOptions([]));
  }, [orgId]);

  const loadSnapshots = useCallback(async () => {
    if (!orgId || isWorkspaceLoading) return;
    setSnapshotsLoading(true);
    try {
      const data = await fetchAttendance(orgId, {
        fromDate: yesterday,
        toDate: today,
      });
      setTodayRecords(data.items.filter((row) => row.attendanceDate === today));
      setYesterdayRecords(data.items.filter((row) => row.attendanceDate === yesterday));
    } catch {
      setTodayRecords([]);
      setYesterdayRecords([]);
    } finally {
      setSnapshotsLoading(false);
    }
  }, [orgId, today, yesterday, isWorkspaceLoading]);

  const load = useCallback(async () => {
    if (!orgId || isWorkspaceLoading) return;
    setLoading(true);
    try {
      const data = await fetchAttendance(orgId, {
        fromDate,
        toDate,
      });
      setRecords(data.items);
      setError(null);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, fromDate, toDate, isWorkspaceLoading, t]);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), loadSnapshots()]);
  }, [load, loadSnapshots]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        const dateCompare = b.attendanceDate.localeCompare(a.attendanceDate);
        if (dateCompare !== 0) return dateCompare;
        return a.staffName.localeCompare(b.staffName);
      }),
    [records],
  );

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value > toDate) setToDate(value);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (value < fromDate) setFromDate(value);
  };

  return (
    <div className="p-4 lg:p-6">
      <MarkAttendanceModal
        open={markModalOpen}
        organisationId={orgId}
        defaultDate={markModalDate}
        defaultStaffId={markModalStaffId}
        staffOptions={staffOptions}
        onClose={closeMarkModal}
        onSaved={() => void refreshAll()}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.attendance.subtitle")}</p>
          <h1 className="text-xl font-bold text-brand-primary">{t("dashboard.staff.attendance.title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => openMarkModal(toDate)}
          disabled={!orgId || isWorkspaceLoading}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-primary px-3.5 text-sm font-semibold text-white transition-colors hover:brightness-105 disabled:opacity-60"
        >
          <MarkAttendanceIcon />
          {t("dashboard.staff.attendance.mark")}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyAttendancePanel
          title={t("dashboard.staff.attendance.todaySection")}
          dateIso={today}
          dateLabel={formatDate(today)}
          staff={staffOptions}
          recordsByStaff={todayByStaff}
          loading={snapshotsLoading}
          loadingLabel={t("common.pleaseWait")}
          emptyStaffLabel={t("dashboard.staff.attendance.noStaff")}
          notRecordedLabel={t("dashboard.staff.attendance.notRecorded")}
          markLabel={t("dashboard.staff.attendance.updateAttendance")}
          onMarkAttendance={handleMarkStaffAttendance}
          statusLabelFn={statusLabelFn}
        />
        <DailyAttendancePanel
          title={t("dashboard.staff.attendance.yesterdaySection")}
          dateIso={yesterday}
          dateLabel={formatDate(yesterday)}
          staff={staffOptions}
          recordsByStaff={yesterdayByStaff}
          loading={snapshotsLoading}
          loadingLabel={t("common.pleaseWait")}
          emptyStaffLabel={t("dashboard.staff.attendance.noStaff")}
          notRecordedLabel={t("dashboard.staff.attendance.notRecorded")}
          markLabel={t("dashboard.staff.attendance.updateAttendance")}
          onMarkAttendance={handleMarkStaffAttendance}
          statusLabelFn={statusLabelFn}
        />
      </div>

      <section className="mb-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-brand-primary">
              {t("dashboard.staff.attendance.historySection")}
            </h2>
            <p className="mt-0.5 text-xs text-brand-primary-muted">
              {formatDate(fromDate)} – {formatDate(toDate)}
            </p>
          </div>
          <Link
            href="/dashboard/staff-payroll/attendance/report"
            className="inline-flex h-9 items-center rounded-lg border border-slate-200/90 bg-white px-3 text-sm font-semibold text-brand-orange-2 shadow-sm transition-colors hover:bg-orange-50/50"
          >
            {t("dashboard.staff.attendance.viewReport")}
          </Link>
        </div>

        <div className={`${panelClass} flex flex-wrap items-end gap-3 p-4`}>
          <CompactDateField
            value={fromDate}
            onChange={handleFromDateChange}
            label={t("dashboard.reports.fromDate")}
          />
          <span className="hidden pb-2 text-sm text-brand-primary-muted sm:inline" aria-hidden>
            →
          </span>
          <CompactDateField
            value={toDate}
            onChange={handleToDateChange}
            label={t("dashboard.reports.toDate")}
          />
        </div>
      </section>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colName")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colPhone")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.colDate")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.attendance.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                  >
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              ) : null}
              {!loading && sortedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`${tableBodyCellClass} py-12 text-center text-brand-primary-muted`}
                  >
                    {t("dashboard.staff.attendance.emptyPeriod")}
                  </td>
                </tr>
              ) : null}
              {!loading &&
                sortedRecords.map((row) => {
                  const ui = getAttendanceStatusUi(row.status);
                  const displayName =
                    row.staffName || staffNameById.get(row.staffId) || row.staffId;
                  const phone = staffPhoneById.get(row.staffId)?.trim();
                  return (
                    <tr
                      key={row.attendanceId}
                      className={`border-b border-slate-100 last:border-b-0 ${ui.row} ${ui.accent}`}
                    >
                      <td className={tableBodyCellClass}>
                        <div className="flex items-center gap-3 font-medium">
                          <StaffAvatar name={displayName} />
                          <span className="truncate">{displayName}</span>
                        </div>
                      </td>
                      <td className={`${tableBodyCellClass} text-brand-primary-muted tabular-nums`}>
                        {phone && phone !== "0000000000" ? phone : "—"}
                      </td>
                      <td className={`${tableBodyCellClass} text-brand-primary-muted`}>
                        {formatDate(row.attendanceDate)}
                      </td>
                      <td className={tableBodyCellClass}>
                        <StatusPill status={row.status} label={statusLabel(row.status, t)} />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

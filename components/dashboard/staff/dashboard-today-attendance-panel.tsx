"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MarkAttendanceModal } from "@/components/dashboard/staff/mark-attendance-modal";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatDate } from "@/lib/dashboard/page-utils";
import { filterStaffEligibleForAttendanceDate } from "@/lib/staff/attendance-eligibility";
import { getAttendanceStatusUi } from "@/lib/staff/attendance-status-ui";
import { fetchAttendance, fetchStaffList } from "@/lib/staff/staff-api-client";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types/staff-api";
import { useTranslation, type TranslationKey } from "@/lib/localization";

type StaffRow = { staffId: string; name: string; joinDate?: string };

function StaffAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary/12 to-brand-orange-1/18 text-[11px] font-bold text-brand-primary"
      aria-hidden
    >
      {initial}
    </div>
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

export function DashboardTodayAttendancePanel() {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markModalStaffId, setMarkModalStaffId] = useState<string | undefined>();

  const recordsByStaff = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const row of records) {
      map.set(row.staffId, row);
    }
    return map;
  }, [records]);

  const eligibleStaff = useMemo(
    () => filterStaffEligibleForAttendanceDate(staff, today),
    [staff, today],
  );

  const staffOptions = useMemo(
    () =>
      eligibleStaff.map((row) => ({
        value: row.staffId,
        label: row.name,
        joinDate: row.joinDate,
      })),
    [eligibleStaff],
  );

  const recordedCount = eligibleStaff.filter((row) => recordsByStaff.has(row.staffId)).length;

  const load = useCallback(async () => {
    if (!orgId || isWorkspaceLoading) {
      setStaff([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [staffData, attendanceData] = await Promise.all([
        fetchStaffList(orgId, { status: "active", limit: 100, page: 1 }),
        fetchAttendance(orgId, { fromDate: today, toDate: today }),
      ]);
      setStaff(
        staffData.items.map((row) => ({
          staffId: row.staffId,
          name: row.name,
          joinDate: row.joinDate,
        })),
      );
      setRecords(attendanceData.items.filter((row) => row.attendanceDate === today));
    } catch {
      setStaff([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, today, isWorkspaceLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  const openMarkModal = (staffId: string) => {
    setMarkModalStaffId(staffId);
    setMarkModalOpen(true);
  };

  const closeMarkModal = () => {
    setMarkModalOpen(false);
    setMarkModalStaffId(undefined);
  };

  return (
    <>
      <MarkAttendanceModal
        open={markModalOpen}
        organisationId={orgId}
        defaultDate={today}
        defaultStaffId={markModalStaffId}
        staffOptions={staffOptions}
        onClose={closeMarkModal}
        onSaved={() => void load()}
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-brand-primary">
              {t("dashboard.overview.todayAttendance")}
            </h3>
            <p className="text-xs text-brand-primary-muted">{formatDate(today)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && eligibleStaff.length > 0 ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-brand-primary-muted">
                {recordedCount}/{eligibleStaff.length}
              </span>
            ) : null}
            <Link
              href="/dashboard/staff-payroll/attendance"
              className="text-xs font-semibold text-brand-orange-2 hover:underline"
            >
              {t("dashboard.overview.viewAttendance")}
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : eligibleStaff.length === 0 ? (
          <p className="rounded-xl bg-brand-surface px-3 py-3 text-sm text-brand-primary-muted">
            {t("dashboard.staff.attendance.noStaff")}
          </p>
        ) : (
          <ul className="max-h-44 space-y-1 overflow-y-auto pr-1 scrollbar-brand">
            {eligibleStaff.map((member) => {
              const record = recordsByStaff.get(member.staffId);
              if (!record) {
                return (
                  <li
                    key={member.staffId}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-50/80"
                  >
                    <StaffAvatar name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-primary">{member.name}</p>
                      <p className="text-[11px] text-amber-700/90">
                        {t("dashboard.staff.attendance.notRecorded")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openMarkModal(member.staffId)}
                      className="shrink-0 rounded-md bg-brand-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:brightness-105"
                    >
                      {t("dashboard.staff.attendance.updateAttendance")}
                    </button>
                  </li>
                );
              }

              const ui = getAttendanceStatusUi(record.status);
              return (
                <li
                  key={member.staffId}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${ui.row} ${ui.accent}`}
                >
                  <StaffAvatar name={member.name} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-primary">
                    {member.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ui.pill}`}
                  >
                    {statusLabel(record.status, t)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDate, formPanelClass, inputClass, tablePanelClass } from "@/lib/dashboard/page-utils";
import { fetchAttendance, fetchStaffList, markAttendance } from "@/lib/staff/staff-api-client";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

export function AttendancePage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [staffId, setStaffId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchStaffList(orgId, { status: "active", limit: 100, page: 1 })
      .then((data) => setStaffOptions([{ value: "", label: t("dashboard.staff.attendance.selectStaff") }, ...data.items.map((s) => ({ value: s.staffId, label: s.name }))]))
      .catch(() => setStaffOptions([]));
  }, [orgId, t]);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchAttendance(orgId, { fromDate: attendanceDate, toDate: attendanceDate, limit: 100, page: 1 });
      setRecords(data.items);
      setError(null);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, attendanceDate, t]);

  useEffect(() => { void load(); }, [load]);

  const handleMark = async () => {
    if (!orgId || !staffId) return;
    setSaving(true);
    try {
      await markAttendance(orgId, { staffId, attendanceDate, status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.attendance.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex justify-between">
        <div><p className="text-sm text-brand-primary-muted">{t("dashboard.staff.attendance.subtitle")}</p><h2 className="text-xl font-bold">{t("dashboard.staff.attendance.title")}</h2></div>
        <Link href="/dashboard/staff-payroll/attendance/report" className="text-sm font-semibold text-brand-orange-2 hover:underline">{t("dashboard.staff.attendance.viewReport")}</Link>
      </div>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className={`mb-6 max-w-lg space-y-3 ${formPanelClass}`}>
        <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className={inputClass} />
        <ModernSelect value={staffId} onChange={setStaffId} options={staffOptions} />
        <ModernSelect value={status} onChange={(v) => setStatus(v as AttendanceStatus)} options={[{ value: "present", label: t("dashboard.staff.attendance.present") }, { value: "absent", label: t("dashboard.staff.attendance.absent") }, { value: "half_day", label: t("dashboard.staff.attendance.halfDay") }, { value: "leave", label: t("dashboard.staff.attendance.leave") }]} />
        <button type="button" disabled={saving} onClick={() => void handleMark()} className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.staff.attendance.saving") : t("dashboard.staff.attendance.mark")}</button>
      </div>
      <div className={tablePanelClass}>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.staff.colName")}</th><th className="px-4 py-3">{t("dashboard.staff.attendance.colDate")}</th><th className="px-4 py-3">{t("dashboard.staff.attendance.colStatus")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && records.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.staff.attendance.empty")}</td></tr>}
            {!loading && records.map((row) => (
              <tr key={row.attendanceId} className="border-b"><td className="px-4 py-3">{row.staffName}</td><td className="px-4 py-3">{formatDate(row.attendanceDate)}</td><td className="px-4 py-3">{row.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

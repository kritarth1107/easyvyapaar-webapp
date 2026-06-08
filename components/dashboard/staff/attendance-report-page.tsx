"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { inputClass, tablePanelClass } from "@/lib/dashboard/page-utils";
import { fetchAttendanceReport } from "@/lib/staff/staff-api-client";
import type { AttendanceReportEntry } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

export function AttendanceReportPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState<AttendanceReportEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
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
  }, [activeOrganisationId, month, t]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/staff-payroll/attendance" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.staff.attendance.back")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t("dashboard.staff.attendance.reportTitle")}</h2>
      <div className="mt-4 mb-6"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-auto`} /></div>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className={tablePanelClass}>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.staff.colName")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.attendance.presentDays")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.attendance.absentDays")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.attendance.halfDays")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.attendance.leaveDays")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && !error && items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.staff.attendance.reportEmpty")}</td></tr>}
            {!loading && items.map((row) => (
              <tr key={row.staffId} className="border-b"><td className="px-4 py-3">{row.staffName}</td><td className="px-4 py-3 text-right">{row.presentDays}</td><td className="px-4 py-3 text-right">{row.absentDays}</td><td className="px-4 py-3 text-right">{row.halfDays}</td><td className="px-4 py-3 text-right">{row.leaveDays}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

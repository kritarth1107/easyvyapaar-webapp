"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  formatInr,
  inputClass,
  StatCard,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
  tablePanelClass,
} from "@/lib/dashboard/page-utils";
import { fetchStaffList } from "@/lib/staff/staff-api-client";
import type { StaffSummary } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

export function StaffListPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const [query, setQuery] = useState("");
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return setStaff([]);
    setLoading(true);
    try {
      const data = await fetchStaffList(orgId, { search: query.trim() || undefined, limit: 100, page: 1 });
      setStaff(data.items);
      setError(null);
    } catch (err) {
      setStaff([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const activeCount = staff.filter((s) => s.status === "active").length;
  const payrollTotal = staff.filter((s) => s.status === "active").reduce((sum, s) => sum + s.monthlySalary, 0);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.subtitle")}</p>
          <h2 className="text-xl font-bold text-brand-primary">{t("dashboard.staff.title")}</h2>
        </div>
        <Link
          href="/dashboard/staff-payroll/staffs/create-new"
          className="inline-flex h-10 items-center rounded-sm bg-brand-primary px-4 text-sm font-semibold text-white transition-colors hover:brightness-105"
        >
          + {t("dashboard.staff.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("dashboard.staff.totalCount")} value={String(staff.length)} />
        <StatCard label={t("dashboard.staff.activeCount")} value={String(activeCount)} accent="green" />
        <StatCard label={t("dashboard.staff.monthlyPayroll")} value={formatInr(payrollTotal)} accent="navy" />
      </div>

      <div className={tablePanelClass}>
        <div className="border-b border-slate-100 p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.staff.searchPlaceholder")}
            className={inputClass}
          />
        </div>
        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colName")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colPhone")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colRole")}</th>
                <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.staff.colSalary")}</th>
                <th className={`${tableHeadCellClass} text-left`}>{t("dashboard.staff.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className={`${tableBodyCellClass} py-10 text-center text-brand-primary-muted`}>
                    {t("common.pleaseWait")}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className={`${tableBodyCellClass} py-10 text-center text-red-600`}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && staff.length === 0 && (
                <tr>
                  <td colSpan={5} className={`${tableBodyCellClass} py-10 text-center text-brand-primary-muted`}>
                    {t("dashboard.staff.empty")}
                  </td>
                </tr>
              )}
              {!loading &&
                staff.map((member) => (
                  <tr
                    key={member.staffId}
                    className={`${tableBodyRowClass} cursor-pointer transition-colors hover:bg-brand-surface/40`}
                    onClick={() => router.push(`/dashboard/staff-payroll/staffs/${member.staffId}`)}
                  >
                    <td className={`${tableBodyCellClass} font-semibold`}>{member.name}</td>
                    <td className={tableBodyCellClass}>{member.phone ?? "—"}</td>
                    <td className={tableBodyCellClass}>{member.role ?? "—"}</td>
                    <td className={`${tableBodyCellClass} text-right tabular-nums`}>{formatInr(member.monthlySalary)}</td>
                    <td className={tableBodyCellClass}>
                      {member.status === "active"
                        ? t("dashboard.staff.statusActive")
                        : t("dashboard.staff.statusInactive")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

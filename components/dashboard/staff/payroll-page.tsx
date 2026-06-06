"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatInr, StatCard, inputClass } from "@/lib/dashboard/page-utils";
import { fetchPayrollList, generatePayroll } from "@/lib/staff/staff-api-client";
import type { PayrollSummary } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

export function PayrollPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payroll, setPayroll] = useState<PayrollSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchPayrollList(orgId, { month, limit: 100, page: 1 });
      setPayroll(data.items);
      setError(null);
    } catch (err) {
      setPayroll([]);
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, month, t]);

  useEffect(() => { void load(); }, [load]);

  const handleGenerate = async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setGenerating(true);
    try {
      const data = await generatePayroll(orgId, { month });
      setPayroll(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.payroll.generateError"));
    } finally {
      setGenerating(false);
    }
  };

  const totalNet = payroll.reduce((s, p) => s + p.netPay, 0);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-brand-primary-muted">{t("dashboard.staff.payroll.subtitle")}</p><h2 className="text-xl font-bold">{t("dashboard.staff.payroll.title")}</h2></div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-auto`} />
          <button type="button" disabled={generating} onClick={() => void handleGenerate()} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white">{generating ? t("dashboard.staff.payroll.generating") : t("dashboard.staff.payroll.generate")}</button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label={t("dashboard.staff.payroll.totalNet")} value={formatInr(totalNet)} accent="navy" />
        <StatCard label={t("dashboard.staff.payroll.staffCount")} value={String(payroll.length)} />
      </div>
      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.staff.colName")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.payroll.baseSalary")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.payroll.deductions")}</th><th className="px-4 py-3 text-right">{t("dashboard.staff.payroll.netPay")}</th><th className="px-4 py-3">{t("dashboard.staff.payroll.status")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && error && <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{error}</td></tr>}
            {!loading && payroll.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.staff.payroll.empty")}</td></tr>}
            {!loading && payroll.map((row) => (
              <tr key={row.payrollId} className="border-b"><td className="px-4 py-3">{row.staffName}</td><td className="px-4 py-3 text-right">{formatInr(row.baseSalary)}</td><td className="px-4 py-3 text-right">{formatInr(row.deductions)}</td><td className="px-4 py-3 text-right font-semibold">{formatInr(row.netPay)}</td><td className="px-4 py-3">{row.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/dashboard/staff-payroll/attendance" className="mt-4 inline-block text-sm font-semibold text-brand-orange-2 hover:underline">{t("dashboard.staff.payroll.goToAttendance")}</Link>
    </div>
  );
}

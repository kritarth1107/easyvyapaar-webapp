"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatInr, inputClass, StatCard } from "@/lib/dashboard/page-utils";
import { fetchStaffDetail, updateStaff } from "@/lib/staff/staff-api-client";
import type { StaffDetail, StaffStatus } from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

export function StaffDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ staffId: string }>();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [status, setStatus] = useState<StaffStatus>("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId || !params.staffId) return;
    setLoading(true);
    try {
      const data = await fetchStaffDetail(orgId, params.staffId);
      setStaff(data);
      setName(data.name);
      setPhone(data.phone ?? "");
      setRole(data.role ?? "");
      setMonthlySalary(String(data.monthlySalary));
      setStatus(data.status);
    } catch (err) {
      setStaff(null);
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, params.staffId, t]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!orgId || !params.staffId) return;
    setSaving(true);
    try {
      const updated = await updateStaff(orgId, params.staffId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        monthlySalary: Number(monthlySalary),
        status,
      });
      setStaff(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">{t("common.pleaseWait")}</div>;
  if (!staff) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/staff-payroll/staffs" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.staff.backToList")}</Link>
      <h2 className="mt-2 text-xl font-bold">{staff.name}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dashboard.staff.colSalary")} value={formatInr(staff.monthlySalary)} accent="navy" />
        <StatCard label={t("dashboard.staff.colStatus")} value={staff.status === "active" ? t("dashboard.staff.statusActive") : t("dashboard.staff.statusInactive")} accent="green" />
      </div>
      <div className="mt-6 max-w-lg space-y-4 rounded-md border bg-white p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
        <input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} className={inputClass} />
        <ModernSelect value={status} onChange={(v) => setStatus(v as StaffStatus)} options={[{ value: "active", label: t("dashboard.staff.statusActive") }, { value: "inactive", label: t("dashboard.staff.statusInactive") }]} />
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" disabled={saving} onClick={() => void handleSave()} className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.staff.view.saving") : t("dashboard.staff.view.save")}</button>
      </div>
    </div>
  );
}

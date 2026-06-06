"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { inputClass } from "@/lib/dashboard/page-utils";
import { createStaff } from "@/lib/staff/staff-api-client";
import { useTranslation } from "@/lib/localization";

export function CreateStaffPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!orgId || !name.trim() || !monthlySalary) { setError(t("dashboard.staff.create.validation")); return; }
    setSaving(true);
    try {
      const staff = await createStaff(orgId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        role: role.trim() || undefined,
        monthlySalary: Number(monthlySalary),
        joinDate,
      });
      router.push(`/dashboard/staff-payroll/staffs/${staff.staffId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/staff-payroll/staffs" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.staff.backToList")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t("dashboard.staff.createTitle")}</h2>
      <div className="mt-4 max-w-lg space-y-4 rounded-md border bg-white p-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("dashboard.staff.create.name")} className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("dashboard.staff.create.phone")} className={inputClass} />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder={t("dashboard.staff.create.role")} className={inputClass} />
        <input type="number" min={0} value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder={t("dashboard.staff.create.salary")} className={inputClass} />
        <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className={inputClass} />
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" disabled={saving} onClick={() => void handleSave()} className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.staff.create.saving") : t("dashboard.staff.create.save")}</button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { orgInitials } from "@/components/dashboard/business-switch";
import { useUserMe } from "@/components/providers/user-me-provider";
import { CompactDateField } from "@/components/ui/compact-date-field";
import { ModernSelect } from "@/components/ui/modern-select";
import { getBankSelectOptions } from "@/lib/parties/bank-catalog";
import {
  createInitialStaffForm,
  mapCreateStaffFormToRequest,
  validateCreateStaffForm,
  type CreateStaffFormState,
} from "@/lib/staff/create-staff-form";
import { createStaff } from "@/lib/staff/staff-api-client";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const textareaClass =
  "w-full rounded-md border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-brand-primary-muted">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-slate-200/90" />
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">
        {title}
      </span>
      <div className="h-px flex-1 bg-slate-200/90" />
    </div>
  );
}

export function CreateStaffPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [form, setForm] = useState<CreateStaffFormState>(createInitialStaffForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bankOptions = useMemo(() => getBankSelectOptions(), []);
  const idTypeOptions = useMemo(
    () => [
      { value: "", label: t("dashboard.staff.create.idTypePlaceholder") },
      { value: "aadhaar", label: t("dashboard.staff.create.idTypeAadhaar") },
      { value: "pan", label: t("dashboard.staff.create.idTypePan") },
    ],
    [t],
  );

  const initials = orgInitials(form.name.trim() || "?");

  const patch = (updates: Partial<CreateStaffFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setErrors({});
    setError(null);
  };

  const patchBank = (updates: Partial<CreateStaffFormState["bankAccount"]>) => {
    setForm((prev) => ({ ...prev, bankAccount: { ...prev.bankAccount, ...updates } }));
    setError(null);
  };

  const handleSave = async () => {
    const nextErrors = validateCreateStaffForm(form, {
      required: t("dashboard.staff.create.validation"),
      idTypeRequired: t("dashboard.staff.create.idTypeRequired"),
      idNumberRequired: t("dashboard.staff.create.idNumberRequired"),
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!orgId) return;

    setSaving(true);
    setError(null);
    try {
      const staff = await createStaff(orgId, mapCreateStaffFormToRequest(form));
      router.push(`/dashboard/staff-payroll/staffs/${staff.staffId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-brand-surface">
      <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 px-4 py-4 backdrop-blur-md lg:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-brand-primary lg:text-2xl">
              {t("dashboard.staff.createTitle")}
            </h1>
            <p className="mt-0.5 text-sm text-brand-primary-muted">{t("dashboard.staff.create.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/staff-payroll/staffs"
              className="inline-flex h-9 items-center rounded-md border border-brand-primary/25 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-brand-primary/[0.04]"
            >
              {t("common.cancel")}
            </Link>
            <button
              type="button"
              disabled={saving || !orgId}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? t("dashboard.staff.create.saving") : t("dashboard.staff.create.save")}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">
        {error ? (
          <div className="mb-4 rounded-md border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1 — Basic details + address */}
          <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-light text-lg font-bold text-white"
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-primary">
                  {form.name.trim() || t("dashboard.staff.create.namePlaceholder")}
                </p>
                <p className="text-xs text-brand-primary-muted">{t("dashboard.staff.create.sections.basicHint")}</p>
              </div>
            </div>

            <div>
              <FieldLabel required>{t("dashboard.staff.create.name")}</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t("dashboard.staff.create.namePlaceholder")}
                className={errors.name ? `${inputClass} border-red-300` : inputClass}
              />
              {errors.name ? <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("dashboard.staff.create.phone")}</FieldLabel>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  placeholder="9876543210"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.email")}</FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder="staff@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("dashboard.staff.create.role")}</FieldLabel>
                <input
                  value={form.role}
                  onChange={(e) => patch({ role: e.target.value })}
                  placeholder={t("dashboard.staff.create.rolePlaceholder")}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.department")}</FieldLabel>
                <input
                  value={form.department}
                  onChange={(e) => patch({ department: e.target.value })}
                  placeholder={t("dashboard.staff.create.departmentPlaceholder")}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>{t("dashboard.staff.create.salary")}</FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={form.monthlySalary}
                  onChange={(e) => patch({ monthlySalary: e.target.value })}
                  placeholder="12000"
                  className={errors.monthlySalary ? `${inputClass} border-red-300` : inputClass}
                />
                {errors.monthlySalary ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.monthlySalary}</p>
                ) : null}
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.joinDate")}</FieldLabel>
                <CompactDateField value={form.joinDate} onChange={(v) => patch({ joinDate: v })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("dashboard.staff.create.workingDays")}</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.monthlyWorkingDays}
                  onChange={(e) => patch({ monthlyWorkingDays: e.target.value })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-brand-primary-muted">{t("dashboard.staff.create.workingDaysHint")}</p>
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.paidLeave")}</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={31}
                  value={form.paidLeaveAllowed}
                  onChange={(e) => patch({ paidLeaveAllowed: e.target.value })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-brand-primary-muted">{t("dashboard.staff.create.paidLeaveHint")}</p>
              </div>
            </div>

            <SectionDivider title={t("dashboard.staff.create.sections.address")} />

            <div>
              <FieldLabel>{t("dashboard.staff.create.address")}</FieldLabel>
              <textarea
                value={form.address}
                onChange={(e) => patch({ address: e.target.value })}
                rows={3}
                placeholder={t("dashboard.staff.create.addressPlaceholder")}
                className={textareaClass}
              />
            </div>
          </div>

          {/* Column 2 — Identity, bank & notes */}
          <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <p className="text-xs text-brand-primary-muted">{t("dashboard.staff.create.sections.identityHint")}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("dashboard.staff.create.idType")}</FieldLabel>
                <ModernSelect
                  value={form.idType}
                  onChange={(v) => patch({ idType: v as CreateStaffFormState["idType"] })}
                  options={idTypeOptions}
                />
                {errors.idType ? <p className="mt-1 text-xs font-medium text-red-600">{errors.idType}</p> : null}
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.idNumber")}</FieldLabel>
                <input
                  value={form.idNumber}
                  onChange={(e) => patch({ idNumber: e.target.value })}
                  placeholder={t("dashboard.staff.create.idNumberPlaceholder")}
                  className={errors.idNumber ? `${inputClass} border-red-300` : inputClass}
                />
                {errors.idNumber ? (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.idNumber}</p>
                ) : null}
              </div>
            </div>

            <div>
              <FieldLabel>{t("dashboard.staff.create.pan")}</FieldLabel>
              <input
                value={form.pan}
                onChange={(e) => patch({ pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-brand-primary-muted">{t("dashboard.staff.create.panHint")}</p>
            </div>

            <SectionDivider title={t("dashboard.staff.create.sections.bank")} />
            <p className="text-xs text-brand-primary-muted">{t("dashboard.staff.create.sections.bankHint")}</p>

            <div>
              <FieldLabel>{t("dashboard.staff.create.accountHolder")}</FieldLabel>
              <input
                value={form.bankAccount.accountHolderName}
                onChange={(e) => patchBank({ accountHolderName: e.target.value })}
                placeholder={t("dashboard.staff.create.accountHolderPlaceholder")}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("dashboard.staff.create.bankName")}</FieldLabel>
                <ModernSelect
                  value={form.bankAccount.bankName}
                  onChange={(v) => patchBank({ bankName: v })}
                  options={[{ value: "", label: t("dashboard.staff.create.bankPlaceholder") }, ...bankOptions]}
                />
              </div>
              <div>
                <FieldLabel>{t("dashboard.staff.create.ifsc")}</FieldLabel>
                <input
                  value={form.bankAccount.ifscCode}
                  onChange={(e) => patchBank({ ifscCode: e.target.value.toUpperCase() })}
                  placeholder="HDFC0001234"
                  maxLength={11}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("dashboard.staff.create.accountNumber")}</FieldLabel>
              <input
                value={form.bankAccount.accountNumber}
                onChange={(e) => patchBank({ accountNumber: e.target.value })}
                placeholder="XXXX XXXX XXXX"
                className={inputClass}
              />
            </div>

            <SectionDivider title={t("dashboard.staff.create.notes")} />

            <div>
              <textarea
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                rows={3}
                placeholder={t("dashboard.staff.create.notesPlaceholder")}
                className={textareaClass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

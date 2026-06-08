"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PosModalShell } from "@/components/dashboard/pos/pos-modal-shell";
import { useUserMe } from "@/components/providers/user-me-provider";
import { CompactDateField } from "@/components/ui/compact-date-field";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDateIndian } from "@/lib/dashboard/date-format";
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
import { getBankSelectOptions } from "@/lib/parties/bank-catalog";
import {
  changeStaffSalary,
  createStaffAdjustment,
  fetchSalaryHistory,
  fetchStaffAdjustments,
  fetchStaffDetail,
  updateStaff,
} from "@/lib/staff/staff-api-client";
import type {
  AdjustmentTreatment,
  AdjustmentType,
  SalaryHistoryEntry,
  StaffAdjustment,
  StaffDetail,
  StaffIdType,
  StaffStatus,
} from "@/lib/types/staff-api";
import { useTranslation } from "@/lib/localization";

const textareaClass =
  "w-full rounded-sm border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

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
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">{title}</span>
      <div className="h-px flex-1 bg-slate-200/90" />
    </div>
  );
}

export function StaffDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ staffId: string }>();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [monthlyWorkingDays, setMonthlyWorkingDays] = useState("30");
  const [paidLeaveAllowed, setPaidLeaveAllowed] = useState("3");
  const [address, setAddress] = useState("");
  const [pan, setPan] = useState("");
  const [idType, setIdType] = useState<StaffIdType | "">("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [status, setStatus] = useState<StaffStatus>("active");

  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[]>([]);
  const [adjustments, setAdjustments] = useState<StaffAdjustment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [newSalary, setNewSalary] = useState("");
  const [salaryEffectiveDate, setSalaryEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [salaryReason, setSalaryReason] = useState("");
  const [salarySaving, setSalarySaving] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState<AdjustmentType>("other");
  const [paymentTreatment, setPaymentTreatment] = useState<AdjustmentTreatment>("add_extra");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const bankOptions = useMemo(() => getBankSelectOptions(), []);
  const idTypeOptions = useMemo(
    () => [
      { value: "", label: t("dashboard.staff.create.idTypePlaceholder") },
      { value: "aadhaar", label: t("dashboard.staff.create.idTypeAadhaar") },
      { value: "pan", label: t("dashboard.staff.create.idTypePan") },
    ],
    [t],
  );

  const loadExtras = useCallback(async () => {
    if (!orgId || !params.staffId) return;
    const [history, adj] = await Promise.all([
      fetchSalaryHistory(orgId, params.staffId),
      fetchStaffAdjustments(orgId, params.staffId),
    ]);
    setSalaryHistory(history);
    setAdjustments(adj);
  }, [orgId, params.staffId]);

  const load = useCallback(async () => {
    if (!orgId || !params.staffId) return;
    setLoading(true);
    try {
      const data = await fetchStaffDetail(orgId, params.staffId);
      setStaff(data);
      setName(data.name);
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setRole(data.role ?? "");
      setDepartment(data.department ?? "");
      setJoinDate(data.joinDate ?? "");
      setMonthlyWorkingDays(String(data.monthlyWorkingDays ?? 30));
      setPaidLeaveAllowed(String(data.paidLeaveAllowed ?? 3));
      setAddress(data.address ?? "");
      setPan(data.pan ?? "");
      setIdType(data.idType ?? "");
      setIdNumber(data.idNumber ?? "");
      setNotes(data.notes ?? "");
      setAccountHolder(data.bankAccount?.accountHolderName ?? "");
      setBankName(data.bankAccount?.bankName ?? "");
      setAccountNumber(data.bankAccount?.accountNumber ?? "");
      setIfsc(data.bankAccount?.ifscCode ?? "");
      setStatus(data.status);
      setError(null);
      await loadExtras();
    } catch (err) {
      setStaff(null);
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.loadError"));
    } finally {
      setLoading(false);
    }
  }, [orgId, params.staffId, loadExtras, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveDetails = async () => {
    if (!orgId || !params.staffId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateStaff(orgId, params.staffId, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        department: department.trim() || undefined,
        joinDate: joinDate || undefined,
        monthlyWorkingDays: Number(monthlyWorkingDays) || 30,
        paidLeaveAllowed: Number(paidLeaveAllowed) || 3,
        address: address.trim() || undefined,
        pan: pan.trim() || undefined,
        idType: idType || undefined,
        idNumber: idNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        bankAccount: {
          accountHolderName: accountHolder.trim() || undefined,
          bankName: bankName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          ifscCode: ifsc.trim() || undefined,
        },
        status,
      });
      setStaff(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSalaryChange = async () => {
    if (!orgId || !params.staffId || !staff) return;
    const amount = Number(newSalary);
    if (!Number.isFinite(amount) || amount < 0) return;
    setSalarySaving(true);
    try {
      await changeStaffSalary(orgId, params.staffId, {
        newSalary: amount,
        effectiveDate: salaryEffectiveDate,
        reason: salaryReason.trim() || undefined,
      });
      setSalaryModalOpen(false);
      setNewSalary("");
      setSalaryReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.salaryChangeError"));
    } finally {
      setSalarySaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!orgId || !params.staffId) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPaymentSaving(true);
    try {
      await createStaffAdjustment(orgId, params.staffId, {
        amount,
        type: paymentType,
        treatment: paymentTreatment,
        paymentDate,
        notes: paymentNotes.trim() || undefined,
      });
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      await loadExtras();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.staff.view.paymentError"));
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loading) return <div className="p-6">{t("common.pleaseWait")}</div>;
  if (!staff) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/staff-payroll/staffs" className="text-sm font-semibold text-brand-orange-2 hover:underline">
        ← {t("dashboard.staff.backToList")}
      </Link>
      <h2 className="mt-2 text-xl font-bold">{staff.name}</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.staff.colSalary")} value={formatInr(staff.monthlySalary)} accent="navy" />
        <StatCard
          label={t("dashboard.staff.colStatus")}
          value={staff.status === "active" ? t("dashboard.staff.statusActive") : t("dashboard.staff.statusInactive")}
          accent="green"
        />
        {staff.joinDate ? (
          <StatCard label={t("dashboard.staff.create.joinDate")} value={formatDateIndian(staff.joinDate)} />
        ) : null}
        <StatCard label={t("dashboard.staff.view.pendingAdjustments")} value={String(adjustments.filter((a) => a.status === "pending").length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <SectionDivider title={t("dashboard.staff.create.sections.basic")} />
          <div>
            <FieldLabel required>{t("dashboard.staff.create.name")}</FieldLabel>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.staff.create.phone")}</FieldLabel>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>{t("dashboard.staff.create.email")}</FieldLabel>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.staff.create.role")}</FieldLabel>
              <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>{t("dashboard.staff.create.department")}</FieldLabel>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.create.joinDate")}</FieldLabel>
            <CompactDateField value={joinDate} onChange={setJoinDate} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.staff.create.workingDays")}</FieldLabel>
              <input
                type="number"
                min={1}
                max={31}
                value={monthlyWorkingDays}
                onChange={(e) => setMonthlyWorkingDays(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>{t("dashboard.staff.create.paidLeave")}</FieldLabel>
              <input
                type="number"
                min={0}
                max={31}
                value={paidLeaveAllowed}
                onChange={(e) => setPaidLeaveAllowed(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.colStatus")}</FieldLabel>
            <ModernSelect
              value={status}
              onChange={(v) => setStatus(v as StaffStatus)}
              options={[
                { value: "active", label: t("dashboard.staff.statusActive") },
                { value: "inactive", label: t("dashboard.staff.statusInactive") },
              ]}
            />
          </div>

          <SectionDivider title={t("dashboard.staff.create.sections.address")} />
          <div>
            <FieldLabel>{t("dashboard.staff.create.address")}</FieldLabel>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={textareaClass} />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <SectionDivider title={t("dashboard.staff.create.sections.identity")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.staff.create.idType")}</FieldLabel>
              <ModernSelect value={idType} onChange={(v) => setIdType(v as StaffIdType | "")} options={idTypeOptions} />
            </div>
            <div>
              <FieldLabel>{t("dashboard.staff.create.idNumber")}</FieldLabel>
              <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.create.pan")}</FieldLabel>
            <input value={pan} onChange={(e) => setPan(e.target.value)} className={inputClass} />
          </div>

          <SectionDivider title={t("dashboard.staff.create.sections.bank")} />
          <div>
            <FieldLabel>{t("dashboard.staff.create.accountHolder")}</FieldLabel>
            <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.create.bankName")}</FieldLabel>
            <ModernSelect value={bankName} onChange={setBankName} options={bankOptions} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("dashboard.staff.create.accountNumber")}</FieldLabel>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel>{t("dashboard.staff.create.ifsc")}</FieldLabel>
              <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} className={inputClass} />
            </div>
          </div>

          <SectionDivider title={t("dashboard.staff.create.notes")} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={textareaClass} />
        </div>
      </div>

      {error ? <p className="mt-4 text-red-600">{error}</p> : null}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSaveDetails()}
        className="mt-4 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? t("dashboard.staff.view.saving") : t("dashboard.staff.view.save")}
      </button>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-brand-primary">{t("dashboard.staff.view.salarySection")}</h3>
            <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.view.salaryHint")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewSalary("");
              setSalaryModalOpen(true);
            }}
            className="rounded-sm border border-slate-200/90 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.staff.view.changeSalary")}
          </button>
        </div>

        <div className={tablePanelClass}>
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.effectiveDate")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.previousSalary")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.newSalary")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.reason")}</th>
              </tr>
            </thead>
            <tbody>
              {salaryHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${tableBodyCellClass} text-center text-brand-primary-muted`}>
                    {t("dashboard.staff.view.noSalaryHistory")}
                  </td>
                </tr>
              ) : (
                salaryHistory.map((row) => (
                  <tr key={row.historyId} className={tableBodyRowClass}>
                    <td className={tableBodyCellClass}>{formatDateIndian(row.effectiveDate)}</td>
                    <td className={tableBodyCellClass}>{formatInr(row.previousSalary)}</td>
                    <td className={tableBodyCellClass}>{formatInr(row.newSalary)}</td>
                    <td className={tableBodyCellClass}>{row.reason ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-brand-primary">{t("dashboard.staff.view.paymentsSection")}</h3>
            <p className="text-sm text-brand-primary-muted">{t("dashboard.staff.view.paymentsHint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="rounded-sm border border-slate-200/90 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.staff.view.addPayment")}
          </button>
        </div>

        <div className={`${tablePanelClass} overflow-x-auto`}>
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.paymentDate")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.amount")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.type")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.treatment")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.applyMonth")}</th>
                <th className={tableHeadCellClass}>{t("dashboard.staff.view.status")}</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${tableBodyCellClass} text-center text-brand-primary-muted`}>
                    {t("dashboard.staff.view.noPayments")}
                  </td>
                </tr>
              ) : (
                adjustments.map((row) => (
                  <tr key={row.adjustmentId} className={tableBodyRowClass}>
                    <td className={tableBodyCellClass}>{formatDateIndian(row.paymentDate)}</td>
                    <td className={tableBodyCellClass}>{formatInr(row.amount)}</td>
                    <td className={tableBodyCellClass}>{row.type}</td>
                    <td className={tableBodyCellClass}>
                      {row.treatment === "add_extra"
                        ? t("dashboard.staff.view.treatmentExtra")
                        : t("dashboard.staff.view.treatmentDeduct")}
                    </td>
                    <td className={tableBodyCellClass}>{row.applyMonth}</td>
                    <td className={tableBodyCellClass}>{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PosModalShell
        open={salaryModalOpen}
        title={t("dashboard.staff.view.changeSalary")}
        onClose={() => setSalaryModalOpen(false)}
        footer={
          <button
            type="button"
            disabled={salarySaving}
            onClick={() => void handleSalaryChange()}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {salarySaving ? t("dashboard.staff.view.saving") : t("dashboard.staff.view.recordSalaryChange")}
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-primary-muted">
            {t("dashboard.staff.colSalary")}: {formatInr(staff.monthlySalary)}
          </p>
          <div>
            <FieldLabel required>{t("dashboard.staff.view.newSalary")}</FieldLabel>
            <input type="number" min={0} value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel required>{t("dashboard.staff.view.effectiveDate")}</FieldLabel>
            <CompactDateField value={salaryEffectiveDate} onChange={setSalaryEffectiveDate} />
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.view.reason")}</FieldLabel>
            <textarea value={salaryReason} onChange={(e) => setSalaryReason(e.target.value)} rows={2} className={textareaClass} />
          </div>
        </div>
      </PosModalShell>

      <PosModalShell
        open={paymentModalOpen}
        title={t("dashboard.staff.view.addPayment")}
        onClose={() => setPaymentModalOpen(false)}
        footer={
          <button
            type="button"
            disabled={paymentSaving}
            onClick={() => void handleAddPayment()}
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {paymentSaving ? t("dashboard.staff.view.saving") : t("dashboard.staff.view.recordPayment")}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t("dashboard.staff.view.amount")}</FieldLabel>
            <input type="number" min={0} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.view.type")}</FieldLabel>
            <ModernSelect
              value={paymentType}
              onChange={(v) => setPaymentType(v as AdjustmentType)}
              options={[
                { value: "bonus", label: t("dashboard.staff.view.typeBonus") },
                { value: "advance", label: t("dashboard.staff.view.typeAdvance") },
                { value: "reimbursement", label: t("dashboard.staff.view.typeReimbursement") },
                { value: "other", label: t("dashboard.staff.view.typeOther") },
              ]}
            />
          </div>
          <div>
            <FieldLabel required>{t("dashboard.staff.view.paymentDate")}</FieldLabel>
            <CompactDateField value={paymentDate} onChange={setPaymentDate} />
          </div>
          <div className="space-y-2">
            <FieldLabel required>{t("dashboard.staff.view.treatment")}</FieldLabel>
            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200/90 p-3">
              <input
                type="radio"
                name="treatment"
                checked={paymentTreatment === "add_extra"}
                onChange={() => setPaymentTreatment("add_extra")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-brand-primary">{t("dashboard.staff.view.treatmentExtra")}</span>
                <span className="text-xs text-brand-primary-muted">{t("dashboard.staff.view.treatmentExtraHint")}</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200/90 p-3">
              <input
                type="radio"
                name="treatment"
                checked={paymentTreatment === "deduct_next_month"}
                onChange={() => setPaymentTreatment("deduct_next_month")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-brand-primary">{t("dashboard.staff.view.treatmentDeduct")}</span>
                <span className="text-xs text-brand-primary-muted">{t("dashboard.staff.view.treatmentDeductHint")}</span>
              </span>
            </label>
          </div>
          <div>
            <FieldLabel>{t("dashboard.staff.view.reason")}</FieldLabel>
            <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} className={textareaClass} />
          </div>
        </div>
      </PosModalShell>
    </div>
  );
}

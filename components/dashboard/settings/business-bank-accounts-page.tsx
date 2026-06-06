"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { getBankSelectOptions, getMainBranchIfsc } from "@/lib/parties/bank-catalog";
import { maskBankAccountNumber } from "@/lib/parties/party-detail-utils";
import {
  addOrganisationBankAccount,
  deleteOrganisationBankAccount,
  fetchOrganisationBankAccounts,
  updateOrganisationBankAccount,
} from "@/lib/organisations/organisation-bank-api-client";
import type { OrganisationBankAccount } from "@/lib/types/organisation-bank-api";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-9 w-full rounded-md border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

const fieldLabelClass = "mb-1 block text-xs font-medium text-brand-primary";

type BankFormState = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
};

type FormModalMode = "add" | "edit";

function emptyBankForm(isPrimary: boolean): BankFormState {
  return {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    isPrimary,
  };
}

function bankAccountToForm(account: OrganisationBankAccount): BankFormState {
  return {
    accountHolderName: account.accountHolderName,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    ifscCode: account.ifscCode,
    branchName: account.branchName,
    isPrimary: account.isPrimary,
  };
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M1.5 10s3-5.5 8.5-5.5S18.5 10 18.5 10s-3 5.5-8.5 5.5S1.5 10 1.5 10Z"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BusinessBankAccountsPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [accounts, setAccounts] = useState<OrganisationBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<FormModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewAccount, setViewAccount] = useState<OrganisationBankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganisationBankAccount | null>(null);

  const loadAccounts = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchOrganisationBankAccounts(orgId);
      setAccounts(data);
    } catch (err) {
      setAccounts([]);
      setLoadError(err instanceof Error ? err.message : t("dashboard.businessBankAccounts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, t]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const startAdd = () => {
    setFormModalMode("add");
    setEditingId(null);
    setFormModalOpen(true);
  };

  const startEdit = (account: OrganisationBankAccount) => {
    setFormModalMode("edit");
    setEditingId(account.bankAccountId);
    setFormModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !deleteTarget) return;
    setSaving(true);
    try {
      const updated = await deleteOrganisationBankAccount(orgId, deleteTarget.bankAccountId);
      setAccounts(updated);
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("dashboard.editParty.bankDeleteError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/settings/business-profile"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary-muted hover:text-brand-primary"
          >
            <BackIcon />
            {t("dashboard.businessProfile.title")}
          </Link>
          <h1 className="text-2xl font-bold text-brand-primary">
            {t("dashboard.businessBankAccounts.title")}
          </h1>
          <p className="mt-1 text-sm text-brand-primary-muted">
            {t("dashboard.businessBankAccounts.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={startAdd}
          disabled={!activeOrganisationId || saving || formModalOpen}
          className="inline-flex h-10 shrink-0 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + {t("dashboard.createParty.addBankAccount")}
        </button>
      </div>

      <section className="rounded-md border border-slate-200/90 bg-white p-4 lg:p-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
        ) : loadError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadAccounts()}
              className="mt-3 text-sm font-semibold text-brand-primary hover:underline"
            >
              {t("dashboard.serialTrackingPage.retry")}
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-10 text-center">
            <p className="text-sm text-brand-primary-muted">{t("dashboard.createParty.bankEmpty")}</p>
            <button
              type="button"
              onClick={startAdd}
              className="mt-3 text-sm font-semibold text-brand-orange-2 hover:underline"
            >
              + {t("dashboard.createParty.addBankAccount")}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-brand-primary">
                  <th className="px-3 py-2.5">{t("dashboard.createParty.bankName")}</th>
                  <th className="px-3 py-2.5">{t("dashboard.createParty.accountNumber")}</th>
                  <th className="px-3 py-2.5">{t("dashboard.createParty.ifsc")}</th>
                  <th className="px-3 py-2.5 text-right">{t("dashboard.editParty.colActions")}</th>
                </tr>
              </thead>
              <tbody className="text-brand-primary">
                {accounts.map((row) => (
                  <tr
                    key={row.bankAccountId}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-brand-primary/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-primary">{row.bankName || "—"}</span>
                        {row.isPrimary ? (
                          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                            {t("dashboard.createParty.primary")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-brand-primary-mid">
                        {row.accountHolderName || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-brand-primary-mid">
                      {maskBankAccountNumber(row.accountNumber)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs uppercase text-brand-primary-mid">
                      {row.ifscCode || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewAccount(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary hover:bg-slate-50"
                          aria-label={t("dashboard.editParty.viewBankAccount")}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded-sm px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary/[0.06]"
                        >
                          {t("dashboard.partyDetail.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="rounded-sm px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          {t("dashboard.partyDetail.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BankAccountFormModal
        open={formModalOpen}
        mode={formModalMode}
        editingId={editingId}
        accounts={accounts}
        organisationId={activeOrganisationId}
        saving={saving}
        onClose={() => !saving && setFormModalOpen(false)}
        onSave={async (payload) => {
          const orgId = activeOrganisationId?.trim();
          if (!orgId) return;
          setSaving(true);
          try {
            const updated =
              formModalMode === "add"
                ? await addOrganisationBankAccount(orgId, payload)
                : await updateOrganisationBankAccount(orgId, editingId!, payload);
            setAccounts(updated);
            setFormModalOpen(false);
          } catch (err) {
            window.alert(
              err instanceof Error ? err.message : t("dashboard.editParty.bankSaveError"),
            );
          } finally {
            setSaving(false);
          }
        }}
      />

      <BankAccountViewModal
        open={viewAccount !== null}
        account={viewAccount}
        onClose={() => setViewAccount(null)}
      />

      <BankAccountDeleteConfirmModal
        open={deleteTarget !== null}
        account={deleteTarget}
        saving={saving}
        onClose={() => !saving && setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
}

function BankAccountFormModal({
  open,
  mode,
  editingId,
  accounts,
  organisationId,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: FormModalMode;
  editingId: string | null;
  accounts: OrganisationBankAccount[];
  organisationId: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: BankFormState) => Promise<void>;
}) {
  const { t } = useTranslation();
  const bankOptions = useMemo(() => getBankSelectOptions(), []);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<BankFormState>(emptyBankForm(false));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editingId) {
      const account = accounts.find((row) => row.bankAccountId === editingId);
      setForm(account ? bankAccountToForm(account) : emptyBankForm(false));
    } else {
      setForm(emptyBankForm(accounts.length === 0));
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, mode, editingId, accounts, onClose, saving]);

  if (!open || !mounted || !organisationId) return null;

  const title =
    mode === "add"
      ? t("dashboard.editParty.addBankAccountTitle")
      : t("dashboard.editParty.editBankAccountTitle");

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative flex max-h-[min(90vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-bold text-brand-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 overflow-y-auto px-4 py-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={fieldLabelClass}>{t("dashboard.createParty.accountHolder")}</label>
            <input
              value={form.accountHolderName}
              onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabelClass}>{t("dashboard.createParty.bankName")}</label>
            <ModernSelect
              value={form.bankName}
              onChange={(value) => {
                const ifsc = getMainBranchIfsc(value);
                setForm({ ...form, bankName: value, ...(ifsc ? { ifscCode: ifsc } : {}) });
              }}
              options={bankOptions}
              searchable
              variant="compact"
              compactAttached={false}
              searchPlaceholder={t("dashboard.createParty.searchBanks")}
              placeholder={t("dashboard.createParty.selectBank")}
              emptyMessage={t("dashboard.createParty.noBanksFound")}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>{t("dashboard.createParty.accountNumber")}</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>{t("dashboard.createParty.ifsc")}</label>
            <input
              value={form.ifscCode}
              onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
          <div className={accounts.length > 0 || mode === "edit" ? undefined : "sm:col-span-2"}>
            <label className={fieldLabelClass}>{t("dashboard.createParty.branch")}</label>
            <input
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              className={inputClass}
            />
          </div>
          {(accounts.length > 0 || mode === "edit") && (
            <label className="flex cursor-pointer items-end gap-2 pb-1.5 text-xs font-medium text-brand-primary">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
              />
              {t("dashboard.createParty.setPrimary")}
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-md border border-slate-200/90 px-3.5 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void onSave(form)}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {saving ? t("dashboard.editParty.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BankAccountViewModal({
  open,
  account,
  onClose,
}: {
  open: boolean;
  account: OrganisationBankAccount | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted || !account) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-brand-primary">
            {t("dashboard.editParty.viewBankAccountTitle")}
          </h2>
        </div>
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <DetailField label={t("dashboard.createParty.accountHolder")} value={account.accountHolderName} />
          <DetailField label={t("dashboard.createParty.bankName")} value={account.bankName} />
          <DetailField label={t("dashboard.createParty.accountNumber")} value={account.accountNumber} />
          <DetailField label={t("dashboard.createParty.ifsc")} value={account.ifscCode} />
          <div className="sm:col-span-2">
            <DetailField label={t("dashboard.createParty.branch")} value={account.branchName} />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200/90 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BankAccountDeleteConfirmModal({
  open,
  account,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  account: OrganisationBankAccount | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted || !account) return null;

  const accountLabel = [account.bankName, maskBankAccountNumber(account.accountNumber)]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-brand-primary">
            {t("dashboard.editParty.deleteBankAccountTitle")}
          </h2>
          <p className="mt-2 text-sm text-brand-primary-muted">
            {t("dashboard.editParty.confirmDeleteBank")}
          </p>
          {accountLabel ? (
            <p className="mt-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm font-medium text-brand-primary">
              {accountLabel}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-10 items-center rounded-md border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? t("dashboard.editParty.saving") : t("dashboard.editParty.deleteBankAccountConfirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-primary">{value || "—"}</p>
    </div>
  );
}

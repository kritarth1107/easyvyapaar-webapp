"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ModernSelect } from "@/components/ui/modern-select";
import { getBankSelectOptions, getMainBranchIfsc } from "@/lib/parties/bank-catalog";
import { maskBankAccountNumber } from "@/lib/parties/party-detail-utils";
import {
  addPartyBankAccount,
  deletePartyBankAccount,
  updatePartyBankAccount,
} from "@/lib/parties/parties-api-client";
import type { PartyBankAccount, PartyDetail } from "@/lib/types/parties-api";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-md border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

type BankFormState = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
};

type FormModalMode = "add" | "edit";

type PartyProfileBankCardProps = {
  party: PartyDetail;
  organisationId: string;
  onPartyUpdated: (party: PartyDetail) => void;
  sectionTitle: string;
};

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

function bankAccountToForm(account: PartyBankAccount): BankFormState {
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

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-primary">{value || "—"}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-brand-primary">{children}</label>;
}

export function PartyProfileBankCard({
  party,
  organisationId,
  onPartyUpdated,
  sectionTitle,
}: PartyProfileBankCardProps) {
  const { t } = useTranslation();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<FormModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewAccount, setViewAccount] = useState<PartyBankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartyBankAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    setFormModalMode("add");
    setEditingId(null);
    setFormModalOpen(true);
  };

  const startEdit = (account: PartyBankAccount) => {
    setFormModalMode("edit");
    setEditingId(account.bankAccountId);
    setFormModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const updated = await deletePartyBankAccount(
        organisationId,
        party.partyId,
        deleteTarget.bankAccountId,
      );
      onPartyUpdated(updated);
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("dashboard.editParty.bankDeleteError"));
    } finally {
      setSaving(false);
    }
  };

  const addButton = (
    <button
      type="button"
      onClick={startAdd}
      disabled={saving || formModalOpen}
      className="text-xs font-semibold text-brand-orange-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      + {t("dashboard.createParty.addBankAccount")}
    </button>
  );

  return (
    <>
      <section className="rounded-md border border-slate-200/90 bg-white p-4 lg:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-brand-primary">{sectionTitle}</h2>
          {party.bankAccounts.length > 0 ? addButton : null}
        </div>

        {party.bankAccounts.length === 0 ? (
          <div className="flex flex-col items-center rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-8 text-center">
            <p className="text-sm text-brand-primary-muted">{t("dashboard.createParty.bankEmpty")}</p>
            <div className="mt-3">{addButton}</div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-brand-primary">
                  <th className="px-3 py-2.5">{t("dashboard.createParty.bankName")}</th>
                  <th className="px-3 py-2.5">{t("dashboard.createParty.accountNumber")}</th>
                  <th className="px-3 py-2.5">{t("dashboard.createParty.ifsc")}</th>
                  <th className="px-3 py-2.5 text-right">{t("dashboard.editParty.colActions")}</th>
                </tr>
              </thead>
              <tbody className="text-brand-primary">
                {party.bankAccounts.map((row) => (
                  <tr
                    key={row.bankAccountId}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-brand-primary/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.bankName || "—"}</span>
                        {row.isPrimary && (
                          <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            {t("dashboard.createParty.primary")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums text-brand-primary-mid">
                      {maskBankAccountNumber(row.accountNumber)}
                    </td>
                    <td className="px-3 py-3 font-mono uppercase text-brand-primary-mid">
                      {row.ifscCode || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewAccount(row)}
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary hover:bg-slate-50 disabled:opacity-50"
                          aria-label={t("dashboard.editParty.viewBankAccount")}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          disabled={saving || formModalOpen}
                          className="text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
                        >
                          {t("dashboard.editParty.editBank")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          disabled={saving || formModalOpen}
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {t("dashboard.editParty.deleteBank")}
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
        party={party}
        organisationId={organisationId}
        onClose={() => setFormModalOpen(false)}
        onSaved={(updated) => {
          onPartyUpdated(updated);
          setFormModalOpen(false);
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
    </>
  );
}

function BankAccountFormModal({
  open,
  mode,
  editingId,
  party,
  organisationId,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: FormModalMode;
  editingId: string | null;
  party: PartyDetail;
  organisationId: string;
  onClose: () => void;
  onSaved: (party: PartyDetail) => void;
}) {
  const { t } = useTranslation();
  const bankOptions = useMemo(() => getBankSelectOptions(), []);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<BankFormState>(emptyBankForm(false));
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editingId) {
      const account = party.bankAccounts.find((row) => row.bankAccountId === editingId);
      setForm(account ? bankAccountToForm(account) : emptyBankForm(false));
    } else {
      setForm(emptyBankForm(party.bankAccounts.length === 0));
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
  }, [open, mode, editingId, party.bankAccounts, onClose, saving]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        accountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        branchName: form.branchName.trim(),
        isPrimary: form.isPrimary,
      };

      const updated =
        mode === "add"
          ? await addPartyBankAccount(organisationId, party.partyId, payload)
          : await updatePartyBankAccount(organisationId, party.partyId, editingId!, payload);

      onSaved(updated);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("dashboard.editParty.bankSaveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!open || !mounted) return null;

  const title =
    mode === "add"
      ? t("dashboard.editParty.addBankAccountTitle")
      : t("dashboard.editParty.editBankAccountTitle");

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-form-modal-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="bank-form-modal-title" className="text-lg font-bold text-brand-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary disabled:opacity-60"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <FieldLabel>{t("dashboard.createParty.accountHolder")}</FieldLabel>
            <input
              value={form.accountHolderName}
              onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>{t("dashboard.createParty.bankName")}</FieldLabel>
            <ModernSelect
              value={form.bankName}
              onChange={(value) => {
                const ifsc = getMainBranchIfsc(value);
                setForm({
                  ...form,
                  bankName: value,
                  ...(ifsc ? { ifscCode: ifsc } : {}),
                });
              }}
              options={bankOptions}
              searchable
              searchPlaceholder={t("dashboard.createParty.searchBanks")}
              placeholder={t("dashboard.createParty.selectBank")}
              emptyMessage={t("dashboard.createParty.noBanksFound")}
            />
          </div>
          <div>
            <FieldLabel>{t("dashboard.createParty.accountNumber")}</FieldLabel>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <FieldLabel>{t("dashboard.createParty.ifsc")}</FieldLabel>
            <input
              value={form.ifscCode}
              onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
          <div>
            <FieldLabel>{t("dashboard.createParty.branch")}</FieldLabel>
            <input
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              className={inputClass}
            />
          </div>
          {(party.bankAccounts.length > 0 || mode === "edit") && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-primary">
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

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {saving ? t("dashboard.editParty.saving") : t("common.save")}
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
  account: PartyBankAccount | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose, saving]);

  if (!open || !mounted || !account) return null;

  const accountLabel = [account.bankName, maskBankAccountNumber(account.accountNumber)]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bank-delete-modal-title"
      aria-describedby="bank-delete-modal-desc"
      onClick={() => !saving && onClose()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 id="bank-delete-modal-title" className="text-lg font-bold text-brand-primary">
            {t("dashboard.editParty.deleteBankAccountTitle")}
          </h2>
          <p id="bank-delete-modal-desc" className="mt-2 text-sm text-brand-primary-muted">
            {t("dashboard.editParty.confirmDeleteBank")}
          </p>
          {accountLabel && (
            <p className="mt-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm font-medium text-brand-primary">
              {accountLabel}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md border border-slate-200/90 px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50 disabled:opacity-60"
          >
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

function BankAccountViewModal({
  open,
  account,
  onClose,
}: {
  open: boolean;
  account: PartyBankAccount | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted || !account) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-view-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="bank-view-modal-title" className="text-lg font-bold text-brand-primary">
              {t("dashboard.editParty.viewBankAccountTitle")}
            </h2>
            {account.isPrimary && (
              <span className="mt-1 inline-block rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                {t("dashboard.createParty.primary")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-brand-primary-muted transition-colors hover:bg-slate-100 hover:text-brand-primary"
            aria-label={t("common.close")}
          >
            <CloseIcon />
          </button>
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

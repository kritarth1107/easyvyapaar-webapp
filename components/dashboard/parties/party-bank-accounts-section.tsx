"use client";

import { useState } from "react";
import { ModernSelect } from "@/components/ui/modern-select";
import { getMainBranchIfsc } from "@/lib/parties/bank-catalog";
import {
  createBankAccountRow,
  type PartyBankAccountRow,
} from "@/lib/parties/create-party-form";
import { useTranslation } from "@/lib/localization";

const inputClass =
  "h-10 w-full rounded-sm border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/60 focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-brand-primary">{children}</label>;
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-primary-muted/50" aria-hidden>
      <path
        d="M3 10h18M5 10V18M9 10V18M15 10V18M19 10V18M12 3l9 5H3l9-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PartyBankAccountsSectionProps = {
  accounts: PartyBankAccountRow[];
  onAccountsChange: (accounts: PartyBankAccountRow[]) => void;
  bankOptions: { value: string; label: string }[];
  /** When true, saved accounts collapse with edit/delete; new accounts stay expanded until done. */
  collapsible?: boolean;
};

export function PartyBankAccountsSection({
  accounts,
  onAccountsChange,
  bankOptions,
  collapsible = false,
}: PartyBankAccountsSectionProps) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const addBankAccount = () => {
    const newRow = createBankAccountRow(accounts.length === 0);
    onAccountsChange([...accounts, newRow]);
    if (collapsible) {
      setExpandedIds((prev) => new Set(prev).add(newRow.id));
    }
  };

  const updateBankAccount = (id: string, updates: Partial<PartyBankAccountRow>) => {
    onAccountsChange(accounts.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const selectBankForAccount = (id: string, bankName: string) => {
    const ifsc = getMainBranchIfsc(bankName);
    updateBankAccount(id, {
      bankName,
      ...(ifsc ? { ifscCode: ifsc } : {}),
    });
  };

  const removeBankAccount = (id: string) => {
    if (collapsible && !window.confirm(t("dashboard.editParty.confirmDeleteBank"))) {
      return;
    }
    const remaining = accounts.filter((row) => row.id !== id);
    if (remaining.length > 0 && !remaining.some((row) => row.isPrimary)) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onAccountsChange(remaining);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const setPrimaryBank = (id: string) => {
    onAccountsChange(
      accounts.map((row) => ({
        ...row,
        isPrimary: row.id === id,
      })),
    );
  };

  const startEdit = (id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  };

  const finishEdit = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isExpanded = (id: string) => !collapsible || expandedIds.has(id);

  const summarizeAccount = (row: PartyBankAccountRow) => {
    const parts = [row.bankName, row.accountNumber].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : row.accountHolderName || "—";
  };

  const addButton = (
    <button
      type="button"
      onClick={addBankAccount}
      className="text-sm font-semibold text-brand-orange-2 hover:underline"
    >
      + {t("dashboard.createParty.addBankAccount")}
    </button>
  );

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-10 text-center">
        <BankIcon />
        <p className="mt-3 text-sm text-brand-primary-muted">{t("dashboard.createParty.bankEmpty")}</p>
        <div className="mt-4">{addButton}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{addButton}</div>
      {accounts.map((row, index) => {
        const expanded = isExpanded(row.id);

        if (collapsible && !expanded) {
          return (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200/90 bg-brand-surface/20 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-brand-primary">
                    {t("dashboard.createParty.bankAccount")} {index + 1}
                  </span>
                  {row.isPrimary && (
                    <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15 ring-inset">
                      {t("dashboard.createParty.primary")}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-brand-primary-muted">{summarizeAccount(row)}</p>
                {row.accountHolderName && (
                  <p className="mt-0.5 truncate text-xs text-brand-primary-muted">{row.accountHolderName}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(row.id)}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  {t("dashboard.editParty.editBank")}
                </button>
                <button
                  type="button"
                  onClick={() => removeBankAccount(row.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  {t("dashboard.editParty.deleteBank")}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={row.id}
            className="rounded-md border border-slate-200/90 bg-brand-surface/20 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-brand-primary">
                  {t("dashboard.createParty.bankAccount")} {index + 1}
                </span>
                {row.isPrimary && (
                  <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15 ring-inset">
                    {t("dashboard.createParty.primary")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!row.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryBank(row.id)}
                    className="text-xs font-semibold text-brand-primary hover:underline"
                  >
                    {t("dashboard.createParty.setPrimary")}
                  </button>
                )}
                {collapsible && (
                  <button
                    type="button"
                    onClick={() => finishEdit(row.id)}
                    className="text-xs font-semibold text-brand-orange-2 hover:underline"
                  >
                    {t("dashboard.editParty.doneEditingBank")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeBankAccount(row.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  {collapsible ? t("dashboard.editParty.deleteBank") : t("dashboard.createParty.removeBank")}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel>{t("dashboard.createParty.accountHolder")}</FieldLabel>
                <input
                  value={row.accountHolderName}
                  onChange={(e) => updateBankAccount(row.id, { accountHolderName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>{t("dashboard.createParty.bankName")}</FieldLabel>
                <ModernSelect
                  value={row.bankName}
                  onChange={(value) => selectBankForAccount(row.id, value)}
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
                  value={row.accountNumber}
                  onChange={(e) => updateBankAccount(row.id, { accountNumber: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <FieldLabel>{t("dashboard.createParty.ifsc")}</FieldLabel>
                <input
                  value={row.ifscCode}
                  onChange={(e) =>
                    updateBankAccount(row.id, { ifscCode: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} font-mono uppercase`}
                />
                {row.bankName &&
                  row.ifscCode &&
                  getMainBranchIfsc(row.bankName) === row.ifscCode && (
                    <p className="mt-1 text-[11px] text-brand-primary-muted">
                      {t("dashboard.createParty.ifscAutoFilled")}
                    </p>
                  )}
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>{t("dashboard.createParty.branch")}</FieldLabel>
                <input
                  value={row.branchName}
                  onChange={(e) => updateBankAccount(row.id, { branchName: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

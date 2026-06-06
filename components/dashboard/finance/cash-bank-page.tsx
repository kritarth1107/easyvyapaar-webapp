"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  formatDate,
  formatInr,
  StatCard,
  tableBodyCellClass,
  tableBodyRowClass,
  tableClass,
  tableHeadCellClass,
  tableHeadRowClass,
} from "@/lib/dashboard/page-utils";
import { fetchCashBankSummary, fetchCashBankTransactions } from "@/lib/finance/cash-bank-api-client";
import type { CashBankSummary, CashBankTransaction } from "@/lib/types/cash-bank-api";
import { useTranslation } from "@/lib/localization";

export function CashBankPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const [summary, setSummary] = useState<CashBankSummary | null>(null);
  const [transactions, setTransactions] = useState<CashBankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const [sum, txns] = await Promise.all([
        fetchCashBankSummary(orgId),
        fetchCashBankTransactions(orgId, { limit: 100, page: 1 }),
      ]);
      setSummary(sum);
      setTransactions(txns.items);
    } catch (err) {
      setSummary(null);
      setTransactions([]);
      setError(err instanceof Error ? err.message : t("dashboard.cashBank.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, t]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <p className="text-sm text-brand-primary-muted">{t("dashboard.cashBank.subtitle")}</p>
        <h2 className="text-xl font-bold text-brand-primary lg:text-2xl">{t("dashboard.nav.cashBank")}</h2>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.cashBank.totalBalance")} value={formatInr(summary?.totalBalance ?? 0)} accent="navy" />
        <StatCard label={t("dashboard.cashBank.cashBalance")} value={formatInr(summary?.totalCash ?? 0)} accent="green" />
        <StatCard label={t("dashboard.cashBank.bankBalance")} value={formatInr(summary?.totalBank ?? 0)} accent="blue" />
        <StatCard label={t("dashboard.cashBank.accounts")} value={String(summary?.accounts.length ?? 0)} />
      </div>
      {summary && summary.accounts.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.accounts.map((account) => (
            <div key={account.accountId} className="rounded-md border border-slate-200/90 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase text-brand-primary-muted">{account.accountType === "cash" ? t("dashboard.cashBank.cash") : t("dashboard.cashBank.bank")}</p>
              <p className="mt-1 font-semibold text-brand-primary">{account.name}</p>
              <p className="mt-2 text-lg font-bold tabular-nums">{formatInr(account.balance)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-md border bg-white">
        <div className="border-b px-4 py-3"><p className="text-sm font-semibold text-brand-primary">{t("dashboard.cashBank.recentTransactions")}</p></div>
        <table className={tableClass}>
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={tableHeadCellClass}>{t("dashboard.cashBank.colDate")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.cashBank.colAccount")}</th>
              <th className={tableHeadCellClass}>{t("dashboard.cashBank.colDescription")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.cashBank.colDebit")}</th>
              <th className={`${tableHeadCellClass} text-right`}>{t("dashboard.cashBank.colCredit")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className={`${tableBodyCellClass} text-center`}>{t("common.pleaseWait")}</td></tr>}
            {!loading && error && <tr><td colSpan={5} className={`${tableBodyCellClass} text-center text-red-600`}>{error}</td></tr>}
            {!loading && transactions.length === 0 && <tr><td colSpan={5} className={`${tableBodyCellClass} text-center text-brand-primary-muted`}>{t("dashboard.cashBank.noTransactions")}</td></tr>}
            {!loading && transactions.map((txn) => (
              <tr key={txn.transactionId} className={tableBodyRowClass}>
                <td className={tableBodyCellClass}>{formatDate(txn.transactionDate)}</td>
                <td className={tableBodyCellClass}>{txn.accountName}</td>
                <td className={tableBodyCellClass}>{txn.description}</td>
                <td className={`${tableBodyCellClass} text-right tabular-nums`}>{txn.debit ? formatInr(txn.debit) : "—"}</td>
                <td className={`${tableBodyCellClass} text-right tabular-nums`}>{txn.credit ? formatInr(txn.credit) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { formatDate, formatInr, StatCard, inputClass } from "@/lib/dashboard/page-utils";
import { fetchDaybook } from "@/lib/finance/daybook-api-client";
import type { DaybookEntry, DaybookEntryType } from "@/lib/types/daybook-api";
import { useTranslation, type TranslationKey } from "@/lib/localization";

const TYPE_LABEL_KEY: Record<DaybookEntryType, TranslationKey> = {
  sales_invoice: "dashboard.daybook.typeSale",
  purchase_payment: "dashboard.daybook.typePurchase",
  invoice_payment: "dashboard.daybook.typePaymentIn",
  finance_payment: "dashboard.daybook.typePaymentOut",
  expense: "dashboard.daybook.typeExpense",
  sales_return_refund: "dashboard.daybook.typeSalesReturn",
  credit_note_refund: "dashboard.daybook.typeCreditNote",
  other: "dashboard.daybook.allTypes",
};

export function DaybookPage() {
  const { t } = useTranslation();
  const { activeOrganisationId } = useUserMe();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [entryType, setEntryType] = useState("all");
  const [entries, setEntries] = useState<DaybookEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await fetchDaybook(orgId, { fromDate, toDate, entryType: entryType as DaybookEntryType | "all", limit: 100, page: 1 });
      setEntries(data.items);
      setOpeningBalance(data.openingBalance ?? 0);
      setClosingBalance(data.closingBalance ?? 0);
      setError(null);
    } catch (err) {
      setEntries([]);
      setError(err instanceof Error ? err.message : t("dashboard.daybook.empty"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, fromDate, toDate, entryType, t]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6"><p className="text-sm text-brand-primary-muted">{t("dashboard.daybook.subtitle")}</p><h2 className="text-xl font-bold">{t("dashboard.nav.daybook")}</h2></div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("dashboard.daybook.openingBalance")} value={formatInr(openingBalance)} accent="navy" />
        <StatCard label={t("dashboard.daybook.closingBalance")} value={formatInr(closingBalance)} accent="green" />
        <StatCard label={t("dashboard.daybook.entries")} value={String(entries.length)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${inputClass} w-auto`} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${inputClass} w-auto`} />
        <div className="w-44"><ModernSelect value={entryType} onChange={setEntryType} options={[{ value: "all", label: t("dashboard.daybook.allTypes") }, { value: "sales_invoice", label: t("dashboard.daybook.typeSale") }, { value: "purchase_payment", label: t("dashboard.daybook.typePurchase") }, { value: "invoice_payment", label: t("dashboard.daybook.typePaymentIn") }, { value: "finance_payment", label: t("dashboard.daybook.typePaymentOut") }, { value: "expense", label: t("dashboard.daybook.typeExpense") }]} /></div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-brand-surface/50 text-[11px] uppercase"><th className="px-4 py-3">{t("dashboard.daybook.colDate")}</th><th className="px-4 py-3">{t("dashboard.daybook.colType")}</th><th className="px-4 py-3">{t("dashboard.daybook.colReference")}</th><th className="px-4 py-3">{t("dashboard.daybook.colParty")}</th><th className="px-4 py-3 text-right">{t("dashboard.daybook.colDebit")}</th><th className="px-4 py-3 text-right">{t("dashboard.daybook.colCredit")}</th><th className="px-4 py-3 text-right">{t("dashboard.daybook.colBalance")}</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center">{t("common.pleaseWait")}</td></tr>}
            {!loading && error && <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600">{error}</td></tr>}
            {!loading && entries.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-primary-muted">{t("dashboard.daybook.empty")}</td></tr>}
            {!loading && entries.map((entry) => (
              <tr key={entry.entryId} className="border-b">
                <td className="px-4 py-3">{formatDate(entry.entryDate)}</td>
                <td className="px-4 py-3">{t(TYPE_LABEL_KEY[entry.entryType])}</td>
                <td className="px-4 py-3">
                  <div>{entry.referenceNumber}</div>
                  {entry.description ? (
                    <div className="text-xs text-brand-primary-muted">{entry.description}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{entry.partyName ?? "—"}</td>
                <td className="px-4 py-3 text-right">{entry.debit ? formatInr(entry.debit) : "—"}</td>
                <td className="px-4 py-3 text-right">{entry.credit ? formatInr(entry.credit) : "—"}</td>
                <td className="px-4 py-3 text-right">{formatInr(entry.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

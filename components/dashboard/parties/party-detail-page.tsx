"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PartyLedgerEntry, PartyLedgerStatement } from "@/lib/types/parties-api";
import {
  ChartLegend,
  DonutChart,
  HorizontalBarChart,
  TrendLineChart,
} from "@/components/dashboard/inventory/stock-summary-charts";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatPartyBalance } from "@/lib/dashboard/mock-parties";
import {
  buildActivityTrend,
  buildBalanceSlices,
  formatPartyDate,
  formatPartyInr,
  getCreditUtilization,
  getPartyIdentityLine,
  getPayableAmount,
  getReceivableAmount,
} from "@/lib/parties/party-detail-utils";
import { PartyProfileBankCard } from "@/components/dashboard/parties/party-profile-bank-card";
import {
  formatSignedPartyBalance,
  getLedgerEntryHref,
  getLedgerEntryTypeLabel,
  ledgerFromDate,
} from "@/lib/parties/party-ledger-utils";
import { fetchPartyDetail, fetchPartyLedger } from "@/lib/parties/parties-api-client";
import type { PartyDetail } from "@/lib/types/parties-api";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

type PartyDetailPageProps = {
  partyId: string;
};

type PartyTab = "overview" | "transactions" | "profile" | "ledger" | "items";

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "amber" | "navy" | "blue";
}) {
  const styles = {
    green: "border-emerald-200/80 bg-emerald-50/40",
    amber: "border-amber-200/80 bg-amber-50/40",
    navy: "border-brand-primary/15 bg-brand-primary/[0.03]",
    blue: "border-blue-200/80 bg-blue-50/30",
  };
  const labelStyles = {
    green: "text-emerald-800/80",
    amber: "text-amber-800/80",
    navy: "text-brand-primary-muted",
    blue: "text-blue-800/80",
  };
  return (
    <div className={`rounded-md border px-4 py-3 ${styles[accent ?? "navy"]}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${labelStyles[accent ?? "navy"]}`}>
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-brand-primary">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  action,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-slate-200/90 bg-white p-4 lg:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-bold text-brand-primary">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
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

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-primary-muted shadow-sm ring-1 ring-slate-200/90">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
          <path d="M8 6h12M8 12h12M8 18h8M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-brand-primary">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-brand-primary-muted">{hint}</p>
    </div>
  );
}

export function PartyDetailPage({ partyId }: PartyDetailPageProps) {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const [party, setParty] = useState<PartyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PartyTab>("overview");
  const [dateRange, setDateRange] = useState("365");
  const [ledger, setLedger] = useState<PartyLedgerStatement | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId) {
      setParty(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPartyDetail(orgId, partyId);
      setParty(data);
    } catch (err) {
      setParty(null);
      setError(err instanceof Error ? err.message : t("dashboard.partyDetail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, partyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadLedger = useCallback(async () => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || !partyId) return;
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const data = await fetchPartyLedger(orgId, partyId, { from: ledgerFromDate(dateRange) });
      setLedger(data);
    } catch (err) {
      setLedger(null);
      setLedgerError(err instanceof Error ? err.message : t("dashboard.partyDetail.ledgerLoadError"));
    } finally {
      setLedgerLoading(false);
    }
  }, [activeOrganisationId, partyId, dateRange, t]);

  useEffect(() => {
    if (tab === "ledger" || tab === "transactions") {
      void loadLedger();
    }
  }, [tab, loadLedger]);

  const activityTrend = useMemo(() => (party ? buildActivityTrend(party) : []), [party]);
  const balanceSlices = useMemo(() => (party ? buildBalanceSlices(party) : []), [party]);

  const typeLabel = useMemo(() => {
    if (!party) return "";
    const map = {
      customer: t("dashboard.partiesPage.typeCustomer"),
      supplier: t("dashboard.partiesPage.typeSupplier"),
      both: t("dashboard.partiesPage.typeBoth"),
    };
    return map[party.partyType];
  }, [party, t]);

  const tabs: { id: PartyTab; label: string }[] = [
    { id: "overview", label: t("dashboard.partyDetail.tabs.overview") },
    { id: "transactions", label: t("dashboard.partyDetail.tabs.transactions") },
    { id: "profile", label: t("dashboard.partyDetail.tabs.profile") },
    { id: "ledger", label: t("dashboard.partyDetail.tabs.ledger") },
    { id: "items", label: t("dashboard.partyDetail.tabs.items") },
  ];

  if (isWorkspaceLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-brand-primary-muted">
        {t("dashboard.partyDetail.loading")}
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="p-6">
        <p className="rounded-md border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          {error ?? t("dashboard.partyDetail.notFound")}
        </p>
        <Link
          href="/dashboard/parties/all-parties"
          className="mt-4 inline-flex text-sm font-semibold text-brand-orange-2 hover:underline"
        >
          {t("dashboard.partyDetail.backToParties")}
        </Link>
      </div>
    );
  }

  const identity = getPartyIdentityLine(party);
  const receivable = getReceivableAmount(party);
  const payable = getPayableAmount(party);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/parties/all-parties"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200/90 bg-white text-brand-primary hover:bg-slate-50"
            aria-label={t("dashboard.partyDetail.backToParties")}
          >
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-brand-primary lg:text-2xl">
              {party.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-brand-primary-muted">{identity}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-brand-primary/[0.06] px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                {typeLabel}
              </span>
              <span
                className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                  party.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
                    : "bg-slate-100 text-slate-600 ring-slate-400/20"
                }`}
              >
                {party.status === "ACTIVE"
                  ? t("dashboard.partiesPage.statusActive")
                  : t("dashboard.partiesPage.statusInactive")}
              </span>
              <span className="text-[11px] text-brand-primary-muted">
                {party.transactionCount} {t("dashboard.partyDetail.transactionsCount")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/sales/invoices/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            {t("dashboard.partyDetail.createInvoice")}
          </Link>
          <Link
            href={`/dashboard/parties/${encodeURIComponent(party.partyId)}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200/90 bg-white px-4 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.partyDetail.edit")}
          </Link>
          <button
            type="button"
            onClick={() => window.alert(t("dashboard.partyDetail.deleteComingSoon"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200/80 bg-red-50/50 text-red-600 hover:bg-red-50"
            aria-label={t("dashboard.partyDetail.delete")}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M5 6h10M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0v9.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6 15.5V6h8Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-5 border-b border-slate-200/90">
        <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-brand" aria-label={t("dashboard.partyDetail.tabsLabel")}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-brand-primary-muted hover:text-brand-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label={t("dashboard.partyDetail.kpiReceivable")} value={formatPartyInr(receivable)} accent="green" />
            <KpiCard label={t("dashboard.partyDetail.kpiPayable")} value={formatPartyInr(payable)} accent="amber" />
            <KpiCard
              label={t("dashboard.partyDetail.kpiCreditLimit")}
              value={party.creditLimit > 0 ? formatPartyInr(party.creditLimit) : "—"}
              accent="blue"
            />
            <KpiCard
              label={t("dashboard.partyDetail.kpiBalance")}
              value={formatPartyBalance(party.currentBalance)}
              accent="navy"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("dashboard.partyDetail.balanceBreakdown")}>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <DonutChart slices={balanceSlices} size={156} />
                <ChartLegend slices={balanceSlices} valueFormatter={(n) => formatPartyInr(n)} />
              </div>
            </SectionCard>

            <SectionCard title={t("dashboard.partyDetail.creditUtilization")}>
              <HorizontalBarChart
                rows={[
                  {
                    id: "used",
                    label: t("dashboard.partyDetail.creditUsed"),
                    value: getCreditUtilization(party),
                    color: "#031F49",
                    sublabel: `${formatPartyInr(receivable)} / ${party.creditLimit > 0 ? formatPartyInr(party.creditLimit) : "—"}`,
                  },
                ]}
                maxValue={100}
                valueLabel={(n) => `${Math.round(n)}%`}
              />
              <p className="mt-3 text-xs text-brand-primary-muted">{t("dashboard.partyDetail.creditHint")}</p>
            </SectionCard>
          </div>

          <SectionCard title={t("dashboard.partyDetail.activityTrend")}>
            <TrendLineChart points={activityTrend} valueKey="value" />
            <p className="mt-2 text-xs text-brand-primary-muted">{t("dashboard.partyDetail.activityHint")}</p>
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-3">
            <DetailField label={t("dashboard.partyDetail.lastTransaction")} value={formatPartyDate(party.lastTransaction?.date)} />
            <DetailField label={t("dashboard.partyDetail.lastInvoice")} value={party.lastTransaction?.invoiceNumber} />
            <DetailField label={t("dashboard.createParty.openingBalance")} value={formatPartyInr(party.openingBalanceAmount)} />
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <PartyTransactionsTab
          ledger={ledger}
          loading={ledgerLoading}
          error={ledgerError}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}

      {tab === "profile" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title={t("dashboard.partyDetail.generalDetails")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label={t("dashboard.createParty.partyName")} value={party.name} />
              <DetailField label={t("dashboard.createParty.partyType")} value={typeLabel} />
              <DetailField label={t("dashboard.createParty.mobile")} value={party.phone} />
              <DetailField label={t("dashboard.createParty.partyCategory")} value={party.partyCategory} />
              <DetailField label={t("dashboard.createParty.email")} value={party.email} />
              <DetailField
                label={t("dashboard.createParty.openingBalance")}
                value={`${formatPartyInr(party.openingBalanceAmount)} (${party.openingBalanceType === "to_collect" ? t("dashboard.createParty.toCollect") : t("dashboard.createParty.toPay")})`}
              />
              <DetailField label={t("dashboard.createParty.contactPerson")} value={party.contactPersonName} />
              <DetailField label={t("dashboard.createParty.dob")} value={formatPartyDate(party.contactPersonDob)} />
            </div>
          </SectionCard>

          <SectionCard title={t("dashboard.partyDetail.businessDetails")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label={t("dashboard.createParty.gstin")} value={party.gstin} />
              <DetailField label={t("dashboard.createParty.pan")} value={party.pan} />
              <div className="sm:col-span-2">
                <DetailField label={t("dashboard.createParty.billingAddress")} value={party.billingAddress} />
              </div>
              <div className="sm:col-span-2">
                <DetailField label={t("dashboard.createParty.shippingAddress")} value={party.shippingAddress} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("dashboard.partyDetail.creditDetails")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label={t("dashboard.createParty.creditPeriod")}
                value={party.creditPeriodDays ? `${party.creditPeriodDays} ${t("dashboard.createParty.days")}` : "—"}
              />
              <DetailField
                label={t("dashboard.createParty.creditLimit")}
                value={party.creditLimit > 0 ? formatPartyInr(party.creditLimit) : "—"}
              />
              <DetailField label={t("dashboard.partyDetail.currentBalance")} value={formatPartyBalance(party.currentBalance)} />
              <DetailField label={t("dashboard.partyDetail.partyId")} value={party.partyId} />
            </div>
          </SectionCard>

          {activeOrganisationId ? (
            <PartyProfileBankCard
              party={party}
              organisationId={activeOrganisationId}
              onPartyUpdated={setParty}
              sectionTitle={t("dashboard.createParty.sections.bank")}
            />
          ) : (
            <SectionCard title={t("dashboard.createParty.sections.bank")}>
              <p className="text-sm text-brand-primary-muted">{t("dashboard.createParty.bankEmpty")}</p>
            </SectionCard>
          )}

          <SectionCard title={t("dashboard.createParty.sections.custom")} className="lg:col-span-2">
            {party.customFields.length === 0 ? (
              <p className="text-sm text-brand-primary-muted">{t("dashboard.partyDetail.noCustomFields")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {party.customFields.map((field) => (
                  <div key={`${field.fieldType}-${field.fieldLabel}`} className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
                      {field.fieldLabel}
                    </p>
                    <p className="mt-1 text-sm font-medium text-brand-primary">{field.value}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title={t("dashboard.partyDetail.meta")} className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label={t("dashboard.partyDetail.createdAt")} value={formatPartyDate(party.createdAt)} />
              <DetailField label={t("dashboard.partyDetail.updatedAt")} value={formatPartyDate(party.updatedAt)} />
              <DetailField label={t("dashboard.partyDetail.transactionCount")} value={String(party.transactionCount)} />
              <DetailField label={t("dashboard.partyDetail.organisationId")} value={party.organisationId} />
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "ledger" && (
        <PartyLedgerTab
          ledger={ledger}
          loading={ledgerLoading}
          error={ledgerError}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          receivable={receivable}
        />
      )}

      {tab === "items" && party && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <ModernSelect
              value={dateRange}
              onChange={setDateRange}
              options={[{ value: "365", label: t("dashboard.partyDetail.last365Days") }]}
              className="w-[180px]"
            />
          </div>
          <EmptyState
            title={t("dashboard.partyDetail.noItemReport")}
            hint={t("dashboard.partyDetail.noItemReportHint")}
          />
        </div>
      )}
    </div>
  );
}

function LedgerDateFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={[
        { value: "30", label: t("dashboard.partyDetail.last30Days") },
        { value: "90", label: t("dashboard.partyDetail.last90Days") },
        { value: "365", label: t("dashboard.partyDetail.last365Days") },
      ]}
      className="w-[180px]"
    />
  );
}

function PartyTransactionRow({ entry }: { entry: PartyLedgerEntry }) {
  const { t } = useTranslation();
  const href = getLedgerEntryHref(entry);

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="px-4 py-3 text-brand-primary-mid">{formatPartyDate(entry.entryDate)}</td>
      <td className="px-4 py-3">{t(getLedgerEntryTypeLabel(entry.entryType))}</td>
      <td className="px-4 py-3 font-mono text-xs">
        {href ? (
          <Link href={href} className="text-brand-orange-2 hover:underline">
            {entry.referenceNumber}
          </Link>
        ) : (
          entry.referenceNumber
        )}
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-primary">
        {formatPartyInr(entry.amount)}
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">
        {entry.affectsBalance
          ? t("dashboard.partyDetail.statusRecorded")
          : t("dashboard.partyDetail.memoEntry")}
      </td>
    </tr>
  );
}

function LedgerVoucherCell({ entry }: { entry: PartyLedgerEntry }) {
  const { t } = useTranslation();
  const href = getLedgerEntryHref(entry);
  const label = t(getLedgerEntryTypeLabel(entry.entryType));

  return (
    <div>
      <p className="font-medium text-brand-primary">{label}</p>
      {href ? (
        <Link href={href} className="font-mono text-xs text-brand-orange-2 hover:underline">
          {entry.referenceNumber}
        </Link>
      ) : (
        <p className="font-mono text-xs text-brand-primary-mid">{entry.referenceNumber}</p>
      )}
      {entry.description ? (
        <p className="mt-0.5 text-xs text-brand-primary-muted">{entry.description}</p>
      ) : null}
    </div>
  );
}

function PartyTransactionsTab({
  ledger,
  loading,
  error,
  dateRange,
  onDateRangeChange,
}: {
  ledger: PartyLedgerStatement | null;
  loading: boolean;
  error: string | null;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <LedgerDateFilter value={dateRange} onChange={onDateRangeChange} />
      </div>

      {loading ? (
        <p className="text-sm text-brand-primary-muted">{t("dashboard.partyDetail.ledgerLoading")}</p>
      ) : error ? (
        <p className="rounded-md border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : !ledger || ledger.entries.length === 0 ? (
        <EmptyState
          title={t("dashboard.partyDetail.noTransactions")}
          hint={t("dashboard.partyDetail.noTransactionsHint")}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colDate")}</th>
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colType")}</th>
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colNumber")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.partyDetail.colAmount")}</th>
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.map((entry) => (
                  <PartyTransactionRow key={entry.ledgerEntryId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PartyLedgerTab({
  ledger,
  loading,
  error,
  dateRange,
  onDateRangeChange,
  receivable,
}: {
  ledger: PartyLedgerStatement | null;
  loading: boolean;
  error: string | null;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  receivable: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("dashboard.partyDetail.kpiReceivable")} value={formatPartyInr(receivable)} accent="green" />
        <KpiCard
          label={t("dashboard.partyDetail.totalSales")}
          value={formatPartyInr(ledger?.totalSales ?? 0)}
          accent="navy"
        />
        <KpiCard
          label={t("dashboard.partyDetail.totalReceived")}
          value={formatPartyInr(ledger?.totalReceived ?? 0)}
          accent="blue"
        />
        <KpiCard
          label={t("dashboard.partyDetail.kpiBalance")}
          value={formatPartyBalance(ledger?.closingBalance ?? 0)}
          accent="amber"
        />
      </div>

      <SectionCard
        title={t("dashboard.partyDetail.tabs.ledger")}
        action={<LedgerDateFilter value={dateRange} onChange={onDateRangeChange} />}
      >
        {loading ? (
          <p className="text-sm text-brand-primary-muted">{t("dashboard.partyDetail.ledgerLoading")}</p>
        ) : error ? (
          <p className="rounded-md border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : !ledger ? (
          <EmptyState
            title={t("dashboard.partyDetail.noTransactions")}
            hint={t("dashboard.partyDetail.noTransactionsHint")}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-brand">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-brand-primary">
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colDate")}</th>
                  <th className="px-4 py-3">{t("dashboard.partyDetail.colVoucher")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.partyDetail.colDebit")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.partyDetail.colCredit")}</th>
                  <th className="px-4 py-3 text-right">{t("dashboard.partyDetail.colBalance")}</th>
                </tr>
              </thead>
              <tbody className="text-brand-primary">
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <td className="px-4 py-3.5 text-brand-primary-mid">—</td>
                  <td className="px-4 py-3.5 font-semibold">{t("dashboard.partyDetail.openingBalance")}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {ledger.openingBalance > 0 ? formatPartyInr(ledger.openingBalance) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {ledger.openingBalance < 0 ? formatPartyInr(Math.abs(ledger.openingBalance)) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                    {formatSignedPartyBalance(ledger.openingBalance)}
                  </td>
                </tr>
                {ledger.entries.map((entry) => (
                  <tr
                    key={entry.ledgerEntryId}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-brand-primary/[0.02]"
                  >
                    <td className="px-4 py-3.5 text-brand-primary-mid">{formatPartyDate(entry.entryDate)}</td>
                    <td className="px-4 py-3.5">
                      <LedgerVoucherCell entry={entry} />
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {entry.debit > 0 ? formatPartyInr(entry.debit) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {entry.credit > 0 ? formatPartyInr(entry.credit) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                      {entry.affectsBalance ? formatSignedPartyBalance(entry.balance) : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/60 font-semibold">
                  <td className="px-4 py-3.5 text-brand-primary-mid">{formatPartyDate(new Date().toISOString())}</td>
                  <td className="px-4 py-3.5">{t("dashboard.partyDetail.closingBalance")}</td>
                  <td className="px-4 py-3.5 text-right">—</td>
                  <td className="px-4 py-3.5 text-right">—</td>
                  <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                    {formatSignedPartyBalance(ledger.closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

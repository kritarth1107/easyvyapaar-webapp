"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PartiesSubnav } from "@/components/dashboard/parties/parties-subnav";
import { useUserMe } from "@/components/providers/user-me-provider";
import { formatPartyBalance } from "@/lib/parties/format-party-balance";
import type { PartiesPageView, PartyType } from "@/lib/types/parties-api";
import type { Party } from "@/lib/types/party-ui";
import { mapPartySummaryToParty } from "@/lib/parties/map-party-summary";
import { fetchParties } from "@/lib/parties/parties-api-client";
import { useParties } from "@/lib/parties/use-parties";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation, type TranslationKey } from "@/lib/localization";

type PartiesPageProps = {
  view: PartiesPageView;
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function KpiCard({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "navy" | "green" | "amber" | "red" | "blue";
}) {
  const styles = {
    default: "border-slate-200/90 bg-white",
    navy: "border-brand-primary/15 bg-brand-primary/[0.03]",
    green: "border-emerald-200/80 bg-emerald-50/30",
    amber: "border-amber-200/80 bg-amber-50/30",
    red: "border-red-200/80 bg-red-50/25",
    blue: "border-blue-200/80 bg-blue-50/30",
  };
  return (
    <div className={`rounded-md border px-3.5 py-3 ${styles[variant]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-primary-muted">{sub}</p>}
    </div>
  );
}

function TypeBadge({ type, label }: { type: PartyType; label: string }) {
  const styles: Record<PartyType, string> = {
    customer: "bg-blue-50 text-blue-800 ring-blue-600/15",
    supplier: "bg-violet-50 text-violet-800 ring-violet-600/15",
    both: "bg-amber-50 text-amber-900 ring-amber-600/15",
  };
  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${styles[type]}`}
    >
      {label}
    </span>
  );
}

function BalanceCell({ balance, collectLabel, payLabel }: { balance: number; collectLabel: string; payLabel: string }) {
  if (balance === 0) {
    return <span className="text-brand-primary-muted">—</span>;
  }
  const isCollect = balance > 0;
  return (
    <div className="text-right">
      <p className={`font-bold tabular-nums ${isCollect ? "text-emerald-700" : "text-red-700"}`}>
        {formatPartyBalance(balance)}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {isCollect ? collectLabel : payLabel}
      </p>
    </div>
  );
}

function OutstandingHero({
  toCollect,
  toPay,
  collectLabel,
  payLabel,
  netLabel,
}: {
  toCollect: number;
  toPay: number;
  collectLabel: string;
  payLabel: string;
  netLabel: string;
}) {
  const net = toCollect - toPay;
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-3">
      <div className="rounded-md border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800/80">
          {collectLabel}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-800">
          {formatPartyBalance(toCollect)}
        </p>
      </div>
      <div className="rounded-md border border-red-200/80 bg-gradient-to-br from-red-50/80 to-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-red-800/80">{payLabel}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-red-800">
          {formatPartyBalance(toPay)}
        </p>
      </div>
      <div className="rounded-md border border-brand-primary/15 bg-gradient-to-br from-brand-primary/[0.04] to-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
          {netLabel}
        </p>
        <p
          className={`mt-2 text-3xl font-bold tabular-nums ${
            net >= 0 ? "text-brand-primary" : "text-red-700"
          }`}
        >
          {net >= 0 ? "" : "−"}
          {formatPartyBalance(Math.abs(net))}
        </p>
      </div>
    </div>
  );
}

export function PartiesPage({ view }: PartiesPageProps) {
  const { t } = useTranslation();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [topReceivable, setTopReceivable] = useState<Party[]>([]);
  const [topPayable, setTopPayable] = useState<Party[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [view, debouncedQuery, typeFilter, statusFilter, balanceFilter]);

  const { parties, summary, pagination, loading, error } = useParties(activeOrganisationId, {
    view,
    partyType: view === "all" ? (typeFilter as PartyType | "all") : undefined,
    status: statusFilter as "all" | "active" | "inactive",
    balance: balanceFilter as "all" | "receivable" | "payable" | "settled",
    search: debouncedQuery,
    page,
    limit: 20,
  });

  const filtered = useMemo(() => parties.map(mapPartySummaryToParty), [parties]);
  const isLoading = isWorkspaceLoading || loading;

  const typeLabels: Record<PartyType, string> = {
    customer: t("dashboard.partiesPage.typeCustomer"),
    supplier: t("dashboard.partiesPage.typeSupplier"),
    both: t("dashboard.partiesPage.typeBoth"),
  };

  useEffect(() => {
    const orgId = activeOrganisationId?.trim();
    if (!orgId || view !== "outstanding") {
      setTopReceivable([]);
      setTopPayable([]);
      return;
    }

    void Promise.all([
      fetchParties(orgId, { balance: "receivable", limit: 5, page: 1 }),
      fetchParties(orgId, { balance: "payable", limit: 5, page: 1 }),
    ]).then(([receivable, payable]) => {
      setTopReceivable(receivable.items.map(mapPartySummaryToParty));
      setTopPayable(payable.items.map(mapPartySummaryToParty));
    });
  }, [activeOrganisationId, view]);

  const titleKey: Record<PartiesPageView, TranslationKey> = {
    all: "dashboard.partiesPage.titleAll",
    customers: "dashboard.partiesPage.titleCustomers",
    suppliers: "dashboard.partiesPage.titleSuppliers",
    outstanding: "dashboard.partiesPage.titleOutstanding",
  };

  const subtitleKey: Record<PartiesPageView, TranslationKey> = {
    all: "dashboard.partiesPage.subtitleAll",
    customers: "dashboard.partiesPage.subtitleCustomers",
    suppliers: "dashboard.partiesPage.subtitleSuppliers",
    outstanding: "dashboard.partiesPage.subtitleOutstanding",
  };

  const summaryCounts = summary ?? {
    totalParties: 0,
    customers: 0,
    suppliers: 0,
    both: 0,
    toCollect: 0,
    toPay: 0,
    netOutstanding: 0,
    withBalance: 0,
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">{t(subtitleKey[view])}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t(titleKey[view])}
          </h1>
        </div>
        <Link
          href="/dashboard/parties/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          + {t("dashboard.partiesPage.createParty")}
        </Link>
      </div>

      {!activeOrganisationId && !isWorkspaceLoading && (
        <p className="mb-4 rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          {t("dashboard.createParty.noOrganisation")}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md border border-red-200/80 bg-red-50/60 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <PartiesSubnav
        counts={{
          all: summaryCounts.totalParties,
          customers: summaryCounts.customers,
          suppliers: summaryCounts.suppliers,
          outstanding: summaryCounts.withBalance,
        }}
      />

      {view === "outstanding" && (
        <OutstandingHero
          toCollect={summaryCounts.toCollect}
          toPay={summaryCounts.toPay}
          collectLabel={t("dashboard.partiesPage.toCollect")}
          payLabel={t("dashboard.partiesPage.toPay")}
          netLabel={t("dashboard.partiesPage.netOutstanding")}
        />
      )}

      {view === "all" && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            label={t("dashboard.partiesPage.kpiTotal")}
            value={isLoading ? "—" : String(summaryCounts.totalParties)}
            variant="navy"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiCustomers")}
            value={isLoading ? "—" : String(summaryCounts.customers)}
            variant="blue"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiSuppliers")}
            value={isLoading ? "—" : String(summaryCounts.suppliers)}
            variant="default"
          />
          <KpiCard
            label={t("dashboard.partiesPage.toCollect")}
            value={isLoading ? "—" : formatPartyBalance(summaryCounts.toCollect)}
            variant="green"
          />
          <KpiCard
            label={t("dashboard.partiesPage.toPay")}
            value={isLoading ? "—" : formatPartyBalance(summaryCounts.toPay)}
            variant="red"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiOutstanding")}
            value={isLoading ? "—" : String(summaryCounts.withBalance)}
            variant="amber"
          />
        </div>
      )}

      {view === "customers" && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label={t("dashboard.partiesPage.kpiCustomers")}
            value={isLoading ? "—" : String(summaryCounts.customers)}
            variant="blue"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiActive")}
            value={isLoading ? "—" : String(filtered.filter((p) => p.isActive).length)}
            variant="green"
          />
          <KpiCard
            label={t("dashboard.partiesPage.toCollect")}
            value={isLoading ? "—" : formatPartyBalance(summaryCounts.toCollect)}
            variant="navy"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiWithDue")}
            value={
              isLoading
                ? "—"
                : String(filtered.filter((p) => p.balance > 0).length)
            }
            variant="amber"
          />
        </div>
      )}

      {view === "suppliers" && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label={t("dashboard.partiesPage.kpiSuppliers")}
            value={isLoading ? "—" : String(summaryCounts.suppliers)}
            variant="default"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiActive")}
            value={isLoading ? "—" : String(filtered.filter((p) => p.isActive).length)}
            variant="green"
          />
          <KpiCard
            label={t("dashboard.partiesPage.toPay")}
            value={isLoading ? "—" : formatPartyBalance(summaryCounts.toPay)}
            variant="red"
          />
          <KpiCard
            label={t("dashboard.partiesPage.kpiWithDue")}
            value={
              isLoading
                ? "—"
                : String(filtered.filter((p) => p.balance < 0).length)
            }
            variant="amber"
          />
        </div>
      )}

      {view === "outstanding" && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-md border border-emerald-200/60 bg-white p-4">
            <h2 className="text-sm font-bold text-emerald-900">
              {t("dashboard.partiesPage.topReceivable")}
            </h2>
            <ul className="mt-3 space-y-2">
              {topReceivable.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-brand-primary">{p.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-emerald-700">
                    {formatPartyBalance(p.balance)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-md border border-red-200/60 bg-white p-4">
            <h2 className="text-sm font-bold text-red-900">{t("dashboard.partiesPage.topPayable")}</h2>
            <ul className="mt-3 space-y-2">
              {topPayable.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-brand-primary">{p.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-red-700">
                    {formatPartyBalance(p.balance)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dashboard.partiesPage.searchPlaceholder")}
          className="h-10 min-w-0 flex-1 rounded-md border border-slate-200/90 bg-white px-3 text-sm outline-none focus:border-brand-orange-1/40 focus:ring-2 focus:ring-brand-orange-1/15"
        />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[540px]">
          {view === "all" && (
            <ModernSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: t("dashboard.partiesPage.filterAllTypes") },
                { value: "customer", label: typeLabels.customer },
                { value: "supplier", label: typeLabels.supplier },
                { value: "both", label: typeLabels.both },
              ]}
              aria-label={t("dashboard.partiesPage.filterType")}
            />
          )}
          <ModernSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: t("dashboard.partiesPage.filterAllStatus") },
              { value: "active", label: t("dashboard.partiesPage.filterActive") },
              { value: "inactive", label: t("dashboard.partiesPage.filterInactive") },
            ]}
            aria-label={t("dashboard.partiesPage.filterStatus")}
          />
          <ModernSelect
            value={balanceFilter}
            onChange={setBalanceFilter}
            options={[
              { value: "all", label: t("dashboard.partiesPage.filterAllBalance") },
              { value: "receivable", label: t("dashboard.partiesPage.filterReceivable") },
              { value: "payable", label: t("dashboard.partiesPage.filterPayable") },
              { value: "settled", label: t("dashboard.partiesPage.filterSettled") },
            ]}
            aria-label={t("dashboard.partiesPage.filterBalance")}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-brand-surface/50 px-4 py-3">
          <h2 className="text-sm font-bold text-brand-primary">
            {t("dashboard.partiesPage.listTitle")}{" "}
            <span className="font-normal text-brand-primary-muted">({pagination.total})</span>
          </h2>
        </div>
        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.partiesPage.colParty")}</th>
                <th className="px-4 py-3">{t("dashboard.partiesPage.colType")}</th>
                <th className="px-4 py-3">{t("dashboard.partiesPage.colContact")}</th>
                <th className="px-4 py-3">{t("dashboard.partiesPage.colLocation")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.partiesPage.colBalance")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.partiesPage.colTransactions")}</th>
                <th className="px-4 py-3">{t("dashboard.partiesPage.colLastTxn")}</th>
                <th className="px-4 py-3">{t("dashboard.partiesPage.colStatus")}</th>
                <th className="w-24 px-2 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-slate-500">
                    {t("dashboard.inventory.loading")}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-brand-primary">{t("dashboard.partiesPage.noResults")}</p>
                    <p className="mt-1 text-sm text-brand-primary-muted">
                      {t("dashboard.partiesPage.noResultsHint")}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((party) => (
                  <PartyRow
                    key={party.id}
                    party={party}
                    typeLabel={typeLabels[party.type]}
                    collectLabel={t("dashboard.partiesPage.toCollect")}
                    payLabel={t("dashboard.partiesPage.toPay")}
                    activeLabel={t("dashboard.partiesPage.statusActive")}
                    inactiveLabel={t("dashboard.partiesPage.statusInactive")}
                    viewLabel={t("dashboard.partiesPage.viewParty")}
                    recordLabel={t("dashboard.partiesPage.recordPayment")}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-brand-primary-muted">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-md border border-slate-200/90 px-3 text-xs font-semibold text-brand-primary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 rounded-md border border-slate-200/90 px-3 text-xs font-semibold text-brand-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function PartyNameSubtitle({ party }: { party: Party }) {
  if (party.gstin) {
    return (
      <p className="mt-0.5 font-mono text-[11px] text-brand-primary-muted">{party.gstin}</p>
    );
  }
  if (party.pan) {
    return (
      <p className="mt-0.5 font-mono text-[11px] text-brand-primary-muted">{party.pan}</p>
    );
  }
  if (party.partyCategory) {
    return <p className="mt-0.5 text-[11px] text-brand-primary-muted">{party.partyCategory}</p>;
  }
  return null;
}

function PartyRow({
  party,
  typeLabel,
  collectLabel,
  payLabel,
  activeLabel,
  inactiveLabel,
  viewLabel,
  recordLabel,
}: {
  party: Party;
  typeLabel: string;
  collectLabel: string;
  payLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  viewLabel: string;
  recordLabel: string;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 transition-colors hover:bg-brand-primary/[0.02]">
      <td className="px-4 py-3">
        <p className="font-semibold text-brand-primary">{party.name}</p>
        <PartyNameSubtitle party={party} />
      </td>
      <td className="px-4 py-3">
        <TypeBadge type={party.type} label={typeLabel} />
      </td>
      <td className="px-4 py-3">
        <p className="text-brand-primary-mid">{party.phone ?? "—"}</p>
        {party.email && (
          <p className="mt-0.5 truncate text-[11px] text-brand-primary-muted">{party.email}</p>
        )}
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">
        {party.billingAddress ? (
          <span className="line-clamp-2 text-xs">{party.billingAddress}</span>
        ) : (
          <>
            {party.city}
            {party.state ? `, ${party.state}` : ""}
          </>
        )}
      </td>
      <td className="px-4 py-3">
        <BalanceCell balance={party.balance} collectLabel={collectLabel} payLabel={payLabel} />
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-brand-primary">
        {party.transactionCount}
      </td>
      <td className="px-4 py-3 text-brand-primary-muted">{formatDate(party.lastTransactionDate)}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            party.isActive
              ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
              : "bg-slate-100 text-slate-600 ring-slate-400/20"
          }`}
        >
          {party.isActive ? activeLabel : inactiveLabel}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/dashboard/parties/${party.id}`}
            className="text-xs font-semibold text-brand-orange-2 hover:underline"
          >
            {viewLabel}
          </Link>
          {party.balance !== 0 && (
            <Link
              href={`/dashboard/finance/payments/new?partyId=${encodeURIComponent(party.id)}&type=${party.balance > 0 ? "payment_in" : "payment_out"}`}
              className="text-xs font-semibold text-brand-primary-muted hover:text-brand-primary hover:underline"
            >
              {recordLabel}
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

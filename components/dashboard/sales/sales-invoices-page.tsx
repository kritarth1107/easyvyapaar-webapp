"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getSalesInvoiceSummary,
  MOCK_SALES_INVOICES,
  type SalesInvoice,
  type SalesInvoiceStatus,
} from "@/lib/dashboard/mock-sales-invoices";
import { ModernSelect } from "@/components/ui/modern-select";
import { useTranslation } from "@/lib/localization";

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "navy" | "green" | "amber" | "blue";
}) {
  const ring =
    accent === "green"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : accent === "amber"
        ? "border-amber-200/80 bg-amber-50/30"
        : accent === "blue"
          ? "border-blue-200/80 bg-blue-50/30"
          : accent === "navy"
            ? "border-brand-primary/15 bg-brand-primary/[0.03]"
            : "border-slate-200/90 bg-white";

  return (
    <div className={`rounded-md border px-3.5 py-3 ${ring}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-primary">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-primary-muted">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: SalesInvoiceStatus }) {
  const { t } = useTranslation();
  const styles: Record<SalesInvoiceStatus, string> = {
    paid: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    partial: "bg-amber-50 text-amber-900 ring-amber-600/15",
    unpaid: "bg-red-50 text-red-800 ring-red-600/15",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-400/20",
  };
  const labels: Record<SalesInvoiceStatus, string> = {
    paid: t("dashboard.salesInvoices.statusPaid"),
    partial: t("dashboard.salesInvoices.statusPartial"),
    unpaid: t("dashboard.salesInvoices.statusUnpaid"),
    cancelled: t("dashboard.salesInvoices.statusCancelled"),
  };

  return (
    <span
      className={`inline-flex rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function SalesInvoicesPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const summary = useMemo(() => getSalesInvoiceSummary(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_SALES_INVOICES.filter((inv) => {
      if (status !== "all" && inv.status !== status) return false;
      if (!q) return true;
      return (
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.partyName.toLowerCase().includes(q) ||
        inv.partyPhone?.includes(q)
      );
    });
  }, [query, status]);

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-primary-muted">
            {t("dashboard.salesInvoices.subtitle")}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {t("dashboard.nav.invoices")}
          </h2>
        </div>
        <Link
          href="/dashboard/sales/invoices/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 text-sm font-semibold text-white shadow-[0_2px_10px_-4px_rgba(3,31,73,0.45)] transition-all hover:brightness-110"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("dashboard.salesInvoices.createNew")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          label={t("dashboard.salesInvoices.todaySales")}
          value={formatInr(summary.todaySales)}
          sub={`${summary.paidToday} ${t("dashboard.salesInvoices.paidToday")}`}
          accent="blue"
        />
        <StatCard
          label={t("dashboard.salesInvoices.monthSales")}
          value={formatInr(summary.monthSales)}
          accent="navy"
        />
        <StatCard
          label={t("dashboard.salesInvoices.totalInvoices")}
          value={String(summary.totalCount)}
        />
        <StatCard
          label={t("dashboard.salesInvoices.unpaidAmount")}
          value={formatInr(summary.unpaidAmount)}
          sub={`${summary.unpaidCount + summary.partialCount} ${t("dashboard.salesInvoices.pendingBills")}`}
          accent="amber"
        />
        <StatCard
          label={t("dashboard.salesInvoices.unpaidCount")}
          value={String(summary.unpaidCount)}
          accent="amber"
        />
        <StatCard
          label={t("dashboard.salesInvoices.partialCount")}
          value={String(summary.partialCount)}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200/90 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("dashboard.salesInvoices.searchPlaceholder")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.salesInvoices.searchPlaceholder")}
              className="h-10 w-full rounded-md border border-slate-200/90 bg-slate-50/80 px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:bg-white focus:ring-2 focus:ring-brand-primary/[0.08]"
            />
          </label>
          <div className="w-full min-w-[160px] shrink-0 sm:w-[180px]">
            <ModernSelect
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: t("dashboard.salesInvoices.allStatuses") },
                { value: "paid", label: t("dashboard.salesInvoices.statusPaid") },
                { value: "partial", label: t("dashboard.salesInvoices.statusPartial") },
                { value: "unpaid", label: t("dashboard.salesInvoices.statusUnpaid") },
                { value: "cancelled", label: t("dashboard.salesInvoices.statusCancelled") },
              ]}
              aria-label={t("dashboard.salesInvoices.filterStatus")}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-brand">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-brand-surface/50 text-[11px] font-bold uppercase tracking-wide text-brand-primary-muted">
                <th className="px-4 py-3">{t("dashboard.salesInvoices.colInvoice")}</th>
                <th className="px-4 py-3">{t("dashboard.salesInvoices.colDate")}</th>
                <th className="px-4 py-3">{t("dashboard.salesInvoices.colParty")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.salesInvoices.colItems")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.salesInvoices.colAmount")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.salesInvoices.colGst")}</th>
                <th className="px-4 py-3">{t("dashboard.salesInvoices.colPayment")}</th>
                <th className="px-4 py-3">{t("dashboard.salesInvoices.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-brand-primary-muted">
                    {t("dashboard.salesInvoices.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: SalesInvoice }) {
  const balance = invoice.total - invoice.amountPaid;

  return (
    <tr className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-blue-50/20">
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-semibold text-brand-primary">{invoice.invoiceNo}</p>
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{formatDate(invoice.date)}</td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-primary">{invoice.partyName}</p>
        {invoice.partyPhone && (
          <p className="text-[11px] text-brand-primary-muted">{invoice.partyPhone}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-brand-primary">{invoice.items}</td>
      <td className="px-4 py-3 text-right">
        <p className="font-semibold tabular-nums text-brand-primary">{formatInr(invoice.total)}</p>
        {balance > 0 && invoice.status !== "cancelled" && (
          <p className="text-[11px] tabular-nums text-amber-700">
            Due {formatInr(balance)}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-brand-primary-muted">
        {formatInr(invoice.gstAmount)}
      </td>
      <td className="px-4 py-3 text-brand-primary-mid">{invoice.paymentMode ?? "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge status={invoice.status} />
      </td>
    </tr>
  );
}

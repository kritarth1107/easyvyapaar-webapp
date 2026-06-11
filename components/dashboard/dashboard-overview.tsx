"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavIcon } from "@/components/dashboard/nav-icon";
import {
  ChartLegend,
  DonutChart,
  HorizontalBarChart,
  TrendLineChart,
} from "@/components/dashboard/inventory/stock-summary-charts";
import { useUserMe } from "@/components/providers/user-me-provider";
import type { DashboardNavIconId } from "@/lib/dashboard/navigation-types";
import type { DashboardSlice } from "@/lib/dashboard/shop-workspace";
import { formatInrBrief } from "@/lib/dashboard/stock-summary-analytics";
import type { NamedSlice } from "@/lib/dashboard/stock-summary-analytics";
import { DashboardTodayAttendancePanel } from "@/components/dashboard/staff/dashboard-today-attendance-panel";
import { useTranslation, type TranslationKey } from "@/lib/localization";

const CHART_COLORS = ["#031F49", "#F63E16", "#0A4068", "#10B981", "#F59E0B", "#6366F1", "#EC4899"];

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
  });
}

function toChartSlices(slices: DashboardSlice[]): NamedSlice[] {
  return slices.map((slice, index) => ({
    id: slice.id,
    label: slice.label,
    value: slice.amount,
    count: slice.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function activityHref(type: string, referenceId?: string): string | null {
  if (!referenceId) return null;
  switch (type) {
    case "sales_invoice":
      return `/dashboard/sales/invoices/${encodeURIComponent(referenceId)}`;
    case "finance_payment":
      return `/dashboard/finance/payments/${encodeURIComponent(referenceId)}`;
    case "purchase_bill":
      return `/dashboard/purchases/${encodeURIComponent(referenceId)}`;
    case "sales_return":
      return `/dashboard/sales/sales-returns/${encodeURIComponent(referenceId)}`;
    default:
      return null;
  }
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: "orange" | "navy" | "green" | "amber" | "blue" | "rose";
  href?: string;
}) {
  const accentRing =
    accent === "orange"
      ? "from-brand-orange-1/20 to-transparent"
      : accent === "green"
        ? "from-emerald-400/15 to-transparent"
        : accent === "amber"
          ? "from-amber-400/15 to-transparent"
          : accent === "blue"
            ? "from-blue-400/15 to-transparent"
            : accent === "rose"
              ? "from-rose-400/15 to-transparent"
              : "from-brand-primary-light/20 to-transparent";

  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300/90 ${href ? "hover:-translate-y-px" : ""}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentRing}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-brand-primary">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-1/50"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

const QUICK_LINKS: { labelKey: TranslationKey; href: string; icon: DashboardNavIconId }[] = [
  { labelKey: "dashboard.actionPos", href: "/dashboard/pos", icon: "pos" },
  { labelKey: "dashboard.newInvoice", href: "/dashboard/sales/invoices/new", icon: "document" },
  { labelKey: "dashboard.actionPayment", href: "/dashboard/finance/payments/new", icon: "payments" },
  { labelKey: "dashboard.actionPurchase", href: "/dashboard/purchases/new", icon: "purchases" },
  { labelKey: "dashboard.actionExpense", href: "/dashboard/finance/expenses?add=1", icon: "expenses" },
  { labelKey: "dashboard.actionParty", href: "/dashboard/parties/create", icon: "parties" },
  { labelKey: "dashboard.actionItem", href: "/dashboard/inventory/items", icon: "inventory" },
  { labelKey: "dashboard.viewReports", href: "/dashboard/reports", icon: "reports" },
  { labelKey: "dashboard.overview.viewStock", href: "/dashboard/inventory/stock-summary", icon: "warehouse" },
  { labelKey: "dashboard.nav.cashBank", href: "/dashboard/finance/cash-bank", icon: "wallet" },
];

export function DashboardOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, activeOrganisation, shopStats, isLoading, isWorkspaceLoading } = useUserMe();

  if (isLoading || isWorkspaceLoading || !shopStats) {
    return (
      <div className="animate-pulse space-y-6 p-4 lg:p-6">
        <div className="h-28 rounded-2xl bg-white/80" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/80" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/80" />
      </div>
    );
  }

  const maxWeekly = Math.max(...shopStats.weeklySales.map((d) => d.amount), 1);
  const deltaPositive = shopStats.salesTodayDelta >= 0;
  const paymentSlices = toChartSlices(shopStats.salesByPaymentMode);
  const stockSlices = toChartSlices(shopStats.stockByCategory);
  const moneyFlowRows = shopStats.moneyFlowThisMonth.map((row, index) => ({
    id: row.id,
    label: row.label,
    value: row.amount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
  const trendPoints = shopStats.monthlyTrend.map((row) => ({
    day: row.monthLabel,
    units: row.purchases,
    value: row.sales,
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-2xl bg-brand-primary px-6 py-6 text-white lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-orange-1/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-brand-primary-light/30 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{t("dashboard.greeting")}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
              {user?.name?.split(" ")[0] ?? "there"},{" "}
              <span className="text-brand-orange-3">{activeOrganisation?.name}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/65">{t("dashboard.greetingHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              {t("dashboard.openPos")}
            </Link>
            <Link
              href="/dashboard/sales/invoices/new"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              {t("dashboard.newInvoice")}
            </Link>
          </div>
        </div>
      </section>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t("dashboard.overview.moneyAndCash")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={t("dashboard.salesToday")}
            value={formatInr(shopStats.salesToday)}
            hint={`${deltaPositive ? "+" : ""}${shopStats.salesTodayDelta.toFixed(1)}% ${t("dashboard.vsYesterday")} · ${shopStats.invoicesToday} ${t("dashboard.invoices")}`}
            accent="orange"
            href="/dashboard/sales/invoices"
          />
          <KpiCard
            label={t("dashboard.overview.totalLiquidity")}
            value={formatInr(shopStats.totalCashBalance)}
            hint={`${t("dashboard.overview.cashInHand")}: ${formatInr(shopStats.cashInHand)} · ${t("dashboard.overview.bankBalance")}: ${formatInr(shopStats.totalBankBalance)}`}
            accent="blue"
            href="/dashboard/finance/cash-bank"
          />
          <KpiCard
            label={t("dashboard.toCollect")}
            value={formatInr(shopStats.toCollect)}
            hint={t("dashboard.toCollectHint")}
            accent="green"
            href="/dashboard/parties/outstanding"
          />
          <KpiCard
            label={t("dashboard.toPay")}
            value={formatInr(shopStats.toPay)}
            hint={`${t("dashboard.overview.netOutstanding")}: ${formatInr(shopStats.netOutstanding)}`}
            accent="amber"
            href="/dashboard/finance/payments"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
          {t("dashboard.overview.stockHealth")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={t("dashboard.overview.stockValue")}
            value={formatInr(shopStats.totalStockValue)}
            hint={`${t("dashboard.overview.retailValue")}: ${formatInr(shopStats.totalRetailValue)}`}
            accent="navy"
            href="/dashboard/inventory/stock-summary"
          />
          <KpiCard
            label={t("dashboard.lowStock")}
            value={String(shopStats.lowStockCount)}
            hint={t("dashboard.lowStockHint")}
            accent="rose"
            href="/dashboard/inventory/low-stock"
          />
          <KpiCard
            label={t("dashboard.overview.salesThisMonth")}
            value={formatInr(shopStats.salesThisMonth)}
            hint={`${t("dashboard.overview.purchasesMonth")}: ${formatInr(shopStats.purchasesThisMonth)}`}
            accent="orange"
            href="/dashboard/reports/view/sales-summary"
          />
          <KpiCard
            label={t("dashboard.overview.profitEstimate")}
            value={formatInr(shopStats.profitEstimateThisMonth)}
            hint={`${t("dashboard.overview.expensesMonth")}: ${formatInr(shopStats.expensesThisMonth)}`}
            accent="green"
            href="/dashboard/reports/view/profit-and-loss"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title={t("dashboard.overview.weeklySalesChart")}
          action={
            <Link href="/dashboard/reports" className="text-xs font-semibold text-brand-orange-2 hover:underline">
              {t("dashboard.viewReports")}
            </Link>
          }
        >
          <div className="flex h-44 items-end justify-between gap-2">
            {shopStats.weeklySales.map((bar) => (
              <div key={bar.date} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[2.25rem] rounded-t-lg bg-gradient-to-t from-brand-orange-2 to-brand-orange-1"
                    style={{ height: `${Math.max(10, (bar.amount / maxWeekly) * 100)}%` }}
                    title={formatInr(bar.amount)}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-600">
                  {t(`dashboard.weekdays.${bar.dayKey}` as TranslationKey)}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("dashboard.overview.salesTrend")} >
          {trendPoints.length > 0 ? (
            <TrendLineChart points={trendPoints} valueKey="value" />
          ) : (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</p>
          )}
        </Panel>

        <DashboardTodayAttendancePanel />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("dashboard.overview.paymentMix")}>
          {paymentSlices.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <DonutChart slices={paymentSlices} />
              <ChartLegend slices={paymentSlices} valueFormatter={formatInrBrief} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</p>
          )}
        </Panel>

        <Panel title={t("dashboard.overview.stockByCategory")}>
          {stockSlices.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <DonutChart slices={stockSlices} />
              <ChartLegend slices={stockSlices} valueFormatter={formatInrBrief} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("dashboard.overview.moneyFlow")}>
          {moneyFlowRows.length > 0 ? (
            <HorizontalBarChart rows={moneyFlowRows} valueLabel={formatInrBrief} />
          ) : (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</p>
          )}
        </Panel>

        <Panel title={t("dashboard.overview.topSelling")}>
          {shopStats.topSellingItems.length > 0 ? (
            <HorizontalBarChart
              rows={shopStats.topSellingItems.map((item, index) => ({
                id: item.itemId,
                label: item.name,
                value: item.revenue,
                sublabel: `${item.qty} ${t("dashboard.overview.unitsSold")}`,
                color: CHART_COLORS[index % CHART_COLORS.length],
              }))}
              valueLabel={formatInrBrief}
            />
          ) : (
            <p className="py-8 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title={t("dashboard.overview.quickLinks")}>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-brand-surface/40 px-3 py-3 text-sm font-semibold text-brand-primary transition-colors hover:border-brand-orange-1/40 hover:bg-brand-surface-warm"
              >
                <span className="text-brand-orange-2">
                  <NavIcon id={link.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 truncate">{t(link.labelKey)}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel title={t("dashboard.overview.lowStockList")}>
            {shopStats.lowStockItems.length === 0 ? (
              <p className="text-sm text-brand-primary-muted">{t("dashboard.inventory.statusInStock")} — looking good.</p>
            ) : (
              <ul className="space-y-2">
                {shopStats.lowStockItems.map((item) => (
                  <li key={item.itemId}>
                    <Link
                      href={`/dashboard/inventory/items/${encodeURIComponent(item.itemId)}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-brand-surface/50"
                    >
                      <span className="font-medium text-brand-primary">{item.name}</span>
                      <span className="tabular-nums text-amber-700">
                        {item.currentStock} / {item.lowStockQty} {item.unit}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel
            title={t("dashboard.recentActivity")}
            action={
              <span className="rounded-full bg-brand-surface px-2.5 py-0.5 text-xs font-medium text-brand-primary-muted">
                {shopStats.pendingPurchaseOrders} {t("dashboard.pendingOrders")}
              </span>
            }
          >
            <ul className="divide-y divide-slate-100">
              {shopStats.recentActivity.length === 0 && (
                <li className="py-6 text-center text-sm text-brand-primary-muted">{t("dashboard.overview.noChartData")}</li>
              )}
              {shopStats.recentActivity.map((item) => {
                const href = activityHref(item.type, item.referenceId);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!href}
                      onClick={() => href && router.push(href)}
                      className={`flex w-full items-center justify-between gap-4 py-3 text-left first:pt-0 last:pb-0 ${href ? "cursor-pointer hover:opacity-80" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-primary">{item.title}</p>
                        <p className="text-xs text-slate-600">
                          {[item.subtitle, formatDate(item.date)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {item.amount !== undefined && (
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-primary">
                          {formatInr(item.amount)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

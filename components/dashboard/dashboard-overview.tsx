"use client";

import Link from "next/link";
import { useUserMe } from "@/components/providers/user-me-provider";
import { useTranslation, type TranslationKey } from "@/lib/localization";

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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
  accent: "orange" | "navy" | "green" | "amber";
  href?: string;
}) {
  const accentRing =
    accent === "orange"
      ? "from-brand-orange-1/20 to-transparent"
      : accent === "green"
        ? "from-emerald-400/15 to-transparent"
        : accent === "amber"
          ? "from-amber-400/15 to-transparent"
          : "from-brand-primary-light/20 to-transparent";

  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300/90 ${href ? "hover:-translate-y-px" : ""}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentRing}`} />
      <p className="text-sm font-medium text-brand-primary-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-brand-primary">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-1/50 rounded-2xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function DashboardOverview() {
  const { t } = useTranslation();
  const { user, activeOrganisation, shopStats, isLoading, isWorkspaceLoading } = useUserMe();

  if (isLoading || isWorkspaceLoading || !shopStats) {
    return (
      <div className="animate-pulse space-y-6 p-4 lg:p-6">
        <div className="h-28 rounded-2xl bg-white/80" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/80" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/80" />
      </div>
    );
  }

  const maxWeekly = Math.max(...shopStats.weeklySales.map((d) => d.amount), 1);
  const deltaPositive = shopStats.salesTodayDelta >= 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Hero strip */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-primary px-6 py-6 text-white lg:px-8 lg:py-7">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-orange-1/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-brand-primary-light/30 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">{t("dashboard.greeting")}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
              {user?.name?.split(" ")[0] ?? "there"},{" "}
              <span className="text-brand-orange-3">{activeOrganisation?.name}</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">{t("dashboard.greetingHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              {t("dashboard.openPos")}
            </Link>
            <Link
              href="/dashboard/sales/invoices"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              {t("dashboard.newInvoice")}
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.salesToday")}
          value={formatInr(shopStats.salesToday)}
          hint={`${deltaPositive ? "+" : ""}${shopStats.salesTodayDelta.toFixed(1)}% ${t("dashboard.vsYesterday")} · ${shopStats.invoicesToday} ${t("dashboard.invoices")}`}
          accent="orange"
          href="/dashboard/sales"
        />
        <KpiCard
          label={t("dashboard.toCollect")}
          value={formatInr(shopStats.toCollect)}
          hint={t("dashboard.toCollectHint")}
          accent="green"
          href="/dashboard/outstanding"
        />
        <KpiCard
          label={t("dashboard.toPay")}
          value={formatInr(shopStats.toPay)}
          hint={t("dashboard.toPayHint")}
          accent="amber"
          href="/dashboard/payments"
        />
        <KpiCard
          label={t("dashboard.lowStock")}
          value={String(shopStats.lowStockCount)}
          hint={t("dashboard.lowStockHint")}
          accent="navy"
          href="/dashboard/inventory/low-stock"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Weekly sales */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-brand-primary">{t("dashboard.weeklySales")}</h3>
            <Link href="/dashboard/reports" className="text-xs font-semibold text-brand-orange-2 hover:underline">
              {t("dashboard.viewReports")}
            </Link>
          </div>
          <div className="mt-6 flex h-40 items-end justify-between gap-2">
            {shopStats.weeklySales.map((bar) => (
              <div key={bar.dayKey} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[2.25rem] rounded-t-lg bg-gradient-to-t from-brand-orange-2 to-brand-orange-1 transition-all"
                    style={{ height: `${Math.max(12, (bar.amount / maxWeekly) * 100)}%` }}
                    title={formatInr(bar.amount)}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {t(`dashboard.weekdays.${bar.dayKey}` as TranslationKey)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h3 className="text-base font-semibold text-brand-primary">{t("dashboard.pendingActions")}</h3>
          <ul className="mt-4 space-y-2">
            {shopStats.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`flex gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  alert.type === "warning"
                    ? "bg-amber-50 text-amber-950"
                    : "bg-brand-surface text-brand-primary"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    alert.type === "warning" ? "bg-amber-500" : "bg-brand-orange-1"
                  }`}
                />
                {formatMessage(
                  t(alert.messageKey),
                  alert.count != null ? { count: alert.count } : undefined
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick actions + activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-brand-primary">{t("dashboard.quickActions")}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: t("dashboard.actionPos"), href: "/dashboard/pos" },
              { label: t("dashboard.actionParty"), href: "/dashboard/parties" },
              { label: t("dashboard.actionItem"), href: "/dashboard/inventory/items" },
              { label: t("dashboard.actionPayment"), href: "/dashboard/payments" },
              { label: t("dashboard.actionPurchase"), href: "/dashboard/purchases" },
              { label: t("dashboard.actionExpense"), href: "/dashboard/expenses" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-xl border border-slate-200/90 bg-brand-surface/50 px-3 py-3 text-center text-sm font-semibold text-brand-primary transition-colors hover:border-brand-orange-1/40 hover:bg-brand-surface-warm"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-primary">{t("dashboard.recentActivity")}</h3>
            <span className="rounded-full bg-brand-surface px-2.5 py-0.5 text-xs font-medium text-brand-primary-muted">
              {shopStats.pendingOrders} {t("dashboard.pendingOrders")}
            </span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {shopStats.recentActivity.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-brand-primary">{t(item.labelKey)}</p>
                  <p className="text-xs text-slate-500">{t(item.timeKey)}</p>
                </div>
                {item.amount && (
                  <span className="shrink-0 text-sm font-semibold text-brand-primary">{item.amount}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

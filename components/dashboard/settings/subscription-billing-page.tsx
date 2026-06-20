"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUserMe } from "@/components/providers/user-me-provider";
import {
  fetchBillingAccount,
  fetchBillingTransactions,
  fetchRenewCheckout,
  formatBillingAmount,
  formatBillingDate,
  downloadBillingTransactionInvoice,
  usageLabel,
  usagePercent,
} from "@/lib/api/billing-account";
import { PLAN_CHECKOUT_PATH } from "@/lib/auth/session";
import { storePaymentCheckout } from "@/lib/auth/plan-signup";
import { CONTACT_EMAIL } from "@/lib/marketing/site-content";
import { useTranslation } from "@/lib/localization";
import type {
  BillingAccountSummary,
  BillingTransaction,
  BillingUsageMetric,
} from "@/lib/types/billing-account-api";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function statusTone(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "IN_GRACE":
    case "PENDING_PAYMENT":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "EXPIRED":
    case "CANCELLED":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function UsageBar({ metric, accent }: { metric: BillingUsageMetric; accent: string }) {
  const pct = usagePercent(metric);
  const warn = !metric.unlimited && metric.limit > 0 && pct >= 85;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-brand-primary">{metric.label}</span>
        <span className={`tabular-nums ${warn ? "font-semibold text-amber-700" : "text-brand-primary-muted"}`}>
          {usageLabel(metric)}
        </span>
      </div>
      {!metric.unlimited && metric.limit > 0 ? (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${warn ? "bg-amber-500" : accent}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="text-xs text-brand-primary-muted">
          {metric.unlimited ? "Unlimited on your plan" : "Not included on your plan"}
        </p>
      )}
    </div>
  );
}

export function SubscriptionBillingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();

  const [tab, setTab] = useState<"plan" | "transactions">("plan");
  const [account, setAccount] = useState<BillingAccountSummary | null>(null);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadAccount = useCallback(async () => {
    if (!activeOrganisationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBillingAccount(activeOrganisationId);
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.subscription.loadError"));
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [activeOrganisationId, t]);

  const loadTransactions = useCallback(async () => {
    if (!activeOrganisationId) return;
    setTxLoading(true);
    try {
      const data = await fetchBillingTransactions(activeOrganisationId, { limit: 50 });
      setTransactions(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.subscription.txLoadError"));
    } finally {
      setTxLoading(false);
    }
  }, [activeOrganisationId, t]);

  useEffect(() => {
    if (!activeOrganisationId || isWorkspaceLoading) return;
    void loadAccount();
  }, [activeOrganisationId, isWorkspaceLoading, loadAccount]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    setMessage(t("dashboard.subscription.paymentSuccess"));
    void loadAccount();
  }, [loadAccount, t]);

  useEffect(() => {
    if (tab === "transactions" && activeOrganisationId) {
      void loadTransactions();
    }
  }, [tab, activeOrganisationId, loadTransactions]);

  const handleRenew = async () => {
    if (!activeOrganisationId || !account?.canManageBilling) return;
    setRenewLoading(true);
    setError(null);
    setMessage(null);
    try {
      const checkout = await fetchRenewCheckout(activeOrganisationId);
      storePaymentCheckout(checkout);
      router.push(PLAN_CHECKOUT_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.subscription.renewError"));
    } finally {
      setRenewLoading(false);
    }
  };

  const handleDownloadInvoice = async (transactionId: string) => {
    if (!activeOrganisationId) return;
    setInvoiceLoadingId(transactionId);
    setError(null);
    try {
      await downloadBillingTransactionInvoice(activeOrganisationId, transactionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.subscription.downloadInvoiceError"));
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const aiAddons = account?.addons.filter((a) => a.isAiRelated) ?? [];
  const otherAddons = account?.addons.filter((a) => !a.isAiRelated) ?? [];
  const planIncludesAi =
    Boolean(account?.usage.aiQueries.unlimited) || (account?.usage.aiQueries.limit ?? 0) > 0;
  const showAddonsSection =
    aiAddons.length > 0 || otherAddons.length > 0 || planIncludesAi;

  if (isWorkspaceLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200/90 text-brand-primary hover:bg-slate-50"
            aria-label={t("common.back")}
          >
            <BackIcon />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-brand-primary lg:text-2xl">
              {t("dashboard.subscription.title")}
            </h1>
            <p className="text-sm text-brand-primary-muted">{t("dashboard.subscription.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-slate-200/90 px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-slate-50"
          >
            {t("dashboard.subscription.profileLink")}
          </Link>
        </div>
      </div>

      {(error || message) && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? message}
        </div>
      )}

      {account?.planRenewalReminder.show ? (
        <div className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">{account.planRenewalReminder.message}</p>
          {account.canManageBilling ? (
            <button
              type="button"
              onClick={() => void handleRenew()}
              disabled={renewLoading}
              className="mt-2 rounded-sm bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-105 disabled:opacity-60"
            >
              {renewLoading ? t("common.pleaseWait") : t("dashboard.subscription.renewCta")}
            </button>
          ) : (
            <p className="mt-1 text-xs">{t("dashboard.subscription.ownerRenewHint")}</p>
          )}
        </div>
      ) : null}

      <div className="mb-6 inline-flex rounded-lg border border-slate-200/90 bg-white p-1">
        <button
          type="button"
          onClick={() => setTab("plan")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            tab === "plan"
              ? "bg-brand-primary text-white"
              : "text-brand-primary-muted hover:text-brand-primary"
          }`}
        >
          {t("dashboard.subscription.tabPlan")}
        </button>
        <button
          type="button"
          onClick={() => setTab("transactions")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            tab === "transactions"
              ? "bg-brand-primary text-white"
              : "text-brand-primary-muted hover:text-brand-primary"
          }`}
        >
          {t("dashboard.subscription.tabTransactions")}
        </button>
      </div>

      {tab === "plan" && account ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-orange-2">
                  {t("dashboard.subscription.currentPlan")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-brand-primary">{account.planDisplayName}</h2>
                <p className="mt-1 text-sm text-brand-primary-muted">
                  {account.billingCycle === "MONTHLY"
                    ? t("dashboard.subscription.billingMonthly")
                    : t("dashboard.subscription.billingYearly")}
                  {" · "}
                  {account.organisationName}
                </p>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${statusTone(account.subscriptionStatus)}`}
              >
                {account.subscriptionStatus.replace(/_/g, " ")}
              </span>
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.subscription.validUntil")}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-primary">
                  {formatBillingDate(account.validityEnd)}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.subscription.accessUntil")}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-primary">
                  {formatBillingDate(account.graceEndsAt)}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <dt className="text-xs text-brand-primary-muted">{t("dashboard.subscription.planCode")}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-brand-primary">{account.planCode}</dd>
              </div>
            </dl>

            {account.canManageBilling ? (
              <button
                type="button"
                onClick={() => void handleRenew()}
                disabled={renewLoading}
                className="login-btn-primary mt-5 rounded-xs px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {renewLoading ? t("common.pleaseWait") : t("dashboard.subscription.manageRenewal")}
              </button>
            ) : null}
          </section>

          {account.highlights.length > 0 ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-brand-primary">
                {t("dashboard.subscription.planBenefits")}
              </h3>
              <ul className="mt-4 space-y-2">
                {account.highlights.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-brand-primary">
                    <span className="mt-0.5 text-brand-orange-2">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-brand-primary">{t("dashboard.subscription.usageTitle")}</h3>
            <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.subscription.usageHint")}</p>
            <div className="mt-5 space-y-5">
              <UsageBar metric={account.usage.aiQueries} accent="bg-violet-500" />
              <UsageBar metric={account.usage.teamSeats} accent="bg-blue-500" />
              <UsageBar metric={account.usage.products} accent="bg-emerald-500" />
              <UsageBar metric={account.usage.monthlyInvoices} accent="bg-brand-orange-2" />
            </div>
          </section>

          {showAddonsSection ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-brand-primary">{t("dashboard.subscription.addonsTitle")}</h3>
              <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.subscription.addonsHint")}</p>
              <div className="mt-4 space-y-3">
                {[...aiAddons, ...otherAddons].map((addon) => (
                  <div
                    key={addon.addonCode}
                    className="flex flex-col gap-3 rounded-lg border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-brand-primary">{addon.title}</p>
                      {addon.description ? (
                        <p className="mt-0.5 text-sm text-brand-primary-muted">{addon.description}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-medium text-brand-orange-2">{addon.priceLabel}</p>
                    </div>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Mahajaan add-on: ${addon.title}`)}`}
                      className="inline-flex shrink-0 justify-center rounded-sm border border-brand-primary px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5"
                    >
                      {addon.isAiRelated
                        ? t("dashboard.subscription.requestAiAddon")
                        : t("dashboard.subscription.requestAddon")}
                    </a>
                  </div>
                ))}
                {planIncludesAi && aiAddons.length === 0 ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-brand-primary">{account.usage.aiQueries.label}</p>
                      <p className="mt-0.5 text-sm text-brand-primary-muted">
                        {t("dashboard.subscription.addonsHint")}
                      </p>
                    </div>
                    <a
                      href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Mahajaan AI usage top-up")}`}
                      className="inline-flex shrink-0 justify-center rounded-sm border border-brand-primary px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5"
                    >
                      {t("dashboard.subscription.requestAiAddon")}
                    </a>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "transactions" ? (
        <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-brand-primary">{t("dashboard.subscription.transactionsTitle")}</h3>
          <p className="mt-1 text-sm text-brand-primary-muted">{t("dashboard.subscription.transactionsHint")}</p>

          {txLoading ? (
            <p className="mt-6 text-sm text-brand-primary-muted">{t("common.pleaseWait")}</p>
          ) : transactions.length === 0 ? (
            <p className="mt-6 text-sm text-brand-primary-muted">{t("dashboard.subscription.noTransactions")}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-brand-primary-muted">
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colDate")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colPlan")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colType")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colAmount")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colPayment")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colStatus")}</th>
                    <th className="px-2 py-2 font-semibold">{t("dashboard.subscription.colInvoice")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((row) => (
                    <tr key={row.transactionId} className="border-b border-slate-50 last:border-0">
                      <td className="px-2 py-3 whitespace-nowrap">{formatBillingDate(row.date)}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium text-brand-primary">{row.planCode}</div>
                      </td>
                      <td className="px-2 py-3 capitalize">
                        {row.changeType.toLowerCase().replace(/_/g, " ")}
                        <div className="text-xs text-brand-primary-muted capitalize">
                          {row.billingCycle.toLowerCase()}
                        </div>
                      </td>
                      <td className="px-2 py-3 tabular-nums font-medium">
                        {formatBillingAmount(row.amountPaise, row.currency)}
                      </td>
                      <td className="px-2 py-3">{row.paymentMethodLabel}</td>
                      <td className="px-2 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(row.status)}`}>
                          {row.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        {row.invoiceNumber ? (
                          <div className="text-xs font-medium text-brand-primary">{row.invoiceNumber}</div>
                        ) : null}
                        {row.invoiceAvailable ? (
                          <button
                            type="button"
                            onClick={() => void handleDownloadInvoice(row.transactionId)}
                            disabled={invoiceLoadingId === row.transactionId}
                            className="mt-1 text-sm font-semibold text-brand-orange-2 hover:text-brand-orange-1 disabled:opacity-60"
                          >
                            {invoiceLoadingId === row.transactionId
                              ? t("common.pleaseWait")
                              : t("dashboard.subscription.downloadInvoice")}
                          </button>
                        ) : (
                          <span className="text-xs text-brand-primary-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

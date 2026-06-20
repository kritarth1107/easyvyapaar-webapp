"use client";

import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { storePaymentCheckout } from "@/lib/auth/plan-signup";
import { useTranslation } from "@/lib/localization";
import type { PlanRenewalReminder } from "@/lib/dashboard/shop-workspace";

function formatMessage(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}

function reminderTitleKey(reminder: PlanRenewalReminder): string {
  switch (reminder.kind) {
    case "pending_payment":
      return "dashboard.planRenewal.pendingTitle";
    case "grace_period":
      return reminder.billingCycle === "MONTHLY"
        ? "dashboard.planRenewal.monthlyGraceTitle"
        : "dashboard.planRenewal.graceTitle";
    case "expiring_soon":
      return "dashboard.planRenewal.expiringSoonTitle";
    case "mandate_issue":
      return "dashboard.planRenewal.mandateTitle";
    case "expired":
      return "dashboard.planRenewal.expiredTitle";
    default:
      return "dashboard.planRenewal.pendingTitle";
  }
}

function reminderMessageKey(reminder: PlanRenewalReminder): string {
  switch (reminder.kind) {
    case "pending_payment":
      return "dashboard.planRenewal.pendingMessage";
    case "grace_period":
      return reminder.billingCycle === "MONTHLY"
        ? "dashboard.planRenewal.monthlyGraceMessage"
        : "dashboard.planRenewal.graceMessage";
    case "expiring_soon":
      return "dashboard.planRenewal.expiringSoonMessage";
    case "mandate_issue":
      return "dashboard.planRenewal.mandateMessage";
    case "expired":
      return "dashboard.planRenewal.expiredMessage";
    default:
      return "dashboard.planRenewal.pendingMessage";
  }
}

function reminderParams(reminder: PlanRenewalReminder): Record<string, string | number> {
  return {
    days: reminder.daysUntilAccessEnds,
    daysUntilRenewal: reminder.daysUntilValidityEnd,
    daysPastDue: reminder.daysPastDue,
    plan: reminder.planCode,
  };
}

export function PlanRenewalBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const { shopStats, isWorkspaceLoading } = useUserMe();

  const reminder = shopStats?.planRenewalReminder;
  if (isWorkspaceLoading || !reminder?.show) return null;

  const isCritical = reminder.severity === "critical";
  const canPay = reminder.isOwner && reminder.checkout;

  const handleRenew = () => {
    if (!reminder.checkout) return;
    storePaymentCheckout(reminder.checkout);
    router.push("/auth/payment");
  };

  return (
    <div
      className={`border-b px-4 py-3 lg:px-6 ${
        isCritical
          ? "border-rose-200/90 bg-rose-50/95"
          : reminder.severity === "warning"
            ? "border-amber-200/90 bg-amber-50/95"
            : "border-sky-200/90 bg-sky-50/95"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-primary">
            {formatMessage(t(reminderTitleKey(reminder) as never), reminderParams(reminder))}
          </p>
          <p className="mt-0.5 text-sm text-brand-primary-muted">
            {formatMessage(t(reminderMessageKey(reminder) as never), reminderParams(reminder))}
          </p>
          {!reminder.isOwner ? (
            <p className="mt-1 text-xs text-brand-primary-muted">
              {t("dashboard.planRenewal.ownerOnly")}
            </p>
          ) : null}
        </div>
        {canPay ? (
          <button
            type="button"
            onClick={handleRenew}
            className="h-9 shrink-0 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-white transition-colors hover:brightness-105"
          >
            {t("dashboard.planRenewal.renewCta")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

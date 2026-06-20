"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlanPaymentCheckout } from "@/components/auth/plan-payment-checkout";
import { useUserMe } from "@/components/providers/user-me-provider";
import { fetchRenewCheckout } from "@/lib/api/billing-account";
import { isPaymentTokenExpired } from "@/lib/auth/payment-session";
import { readPaymentCheckout, storePaymentCheckout } from "@/lib/auth/plan-signup";
import { useTranslation } from "@/lib/localization";
import type { PublicPricingResponse } from "@/lib/types/pricing-api";

const SUBSCRIPTION_SETTINGS_PATH = "/dashboard/settings/subscription";

type DashboardPlanCheckoutPageProps = {
  pricing: PublicPricingResponse | null;
};

export function DashboardPlanCheckoutPage({ pricing }: DashboardPlanCheckoutPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId, isWorkspaceLoading } = useUserMe();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isWorkspaceLoading) return;

    if (!activeOrganisationId) {
      router.replace(SUBSCRIPTION_SETTINGS_PATH);
      return;
    }

    const existing = readPaymentCheckout();
    if (existing && !isPaymentTokenExpired(existing.paymentToken)) {
      setReady(true);
      return;
    }

    void (async () => {
      try {
        const checkout = await fetchRenewCheckout(activeOrganisationId);
        storePaymentCheckout(checkout);
        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("dashboard.subscription.renewError"));
      }
    })();
  }, [activeOrganisationId, isWorkspaceLoading, router, t]);

  if (isWorkspaceLoading || (!ready && !error)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-brand-primary-muted">
        {t("common.pleaseWait")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <button
          type="button"
          onClick={() => router.push(SUBSCRIPTION_SETTINGS_PATH)}
          className="mt-4 text-sm font-semibold text-brand-primary hover:underline"
        >
          {t("dashboard.subscription.title")}
        </button>
      </div>
    );
  }

  return (
    <PlanPaymentCheckout
      pricing={pricing}
      checkoutFallbackPath={SUBSCRIPTION_SETTINGS_PATH}
      embedded
    />
  );
}

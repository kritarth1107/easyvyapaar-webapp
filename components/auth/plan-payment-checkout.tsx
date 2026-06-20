"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { completeAuthSessionOrganisation } from "@/lib/auth/complete-auth-session";
import {
  clearPaymentToken,
  formatPlanPriceInr,
  normalizeSignupPlanCode,
  readPaymentCheckout,
  readPaymentToken,
  storePaymentCheckout,
  type SignupBillingCycle,
  type SignupPlanCode,
} from "@/lib/auth/plan-signup";
import { setStoredActiveOrganisationId } from "@/lib/auth/active-organisation";
import {
  isPaymentSessionExpiredMessage,
  isPaymentTokenExpired,
  redirectToLoginForPayment,
} from "@/lib/auth/payment-session";
import { DASHBOARD_PATH } from "@/lib/auth/session";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useTranslation } from "@/lib/localization";
import { CouponOffersModal } from "@/components/auth/coupon-offers-modal";
import { PricingCompareDialog } from "@/components/marketing/pricing-compare-dialog";
import {
  PLAN_CARD_STYLES,
  PlanCrownIcon,
} from "@/lib/marketing/pricing-feature-icons";
import type { PublicPricingPlan, PublicPricingResponse } from "@/lib/types/pricing-api";
import { PAID_PLAN_CODES } from "@/lib/types/pricing-api";
import type {
  PaymentCheckoutContext,
  PaymentSessionSuccessResponse,
  PlanCouponExploreItem,
} from "@/lib/types/auth-api";
import { isApiErrorResponse, isPaymentCheckoutContext } from "@/lib/types/auth-api";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
};

type RazorpayCheckoutSession = {
  mock: boolean;
  mode: "order" | "subscription";
  orderId?: string;
  subscriptionId?: string;
  amountPaise: number;
  currency: string;
  keyId: string;
};

type RazorpayOptions = {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; contact?: string };
  config?: {
    display: {
      blocks: Record<string, { name: string; instruments: Array<{ method: string }> }>;
      sequence: string[];
      preferences: { show_default_blocks: boolean };
    };
  };
};

type RazorpayCheckout = new (options: RazorpayOptions) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

type BillingToggleValue = "annual" | "monthly";

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed"));
    document.body.appendChild(script);
  });
}

function contextBillingToSignup(cycle: string): SignupBillingCycle {
  return cycle.toUpperCase() === "MONTHLY" ? "monthly" : "yearly";
}

function signupBillingToApi(billing: SignupBillingCycle): "MONTHLY" | "YEARLY" {
  return billing === "monthly" ? "MONTHLY" : "YEARLY";
}

function toggleBillingToSignup(billing: BillingToggleValue): SignupBillingCycle {
  return billing === "monthly" ? "monthly" : "yearly";
}

function signupBillingToToggle(billing: SignupBillingCycle): BillingToggleValue {
  return billing === "monthly" ? "monthly" : "annual";
}

function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function PaymentBillingToggle({
  billing,
  onChange,
  maxSavings,
  disabled,
}: {
  billing: BillingToggleValue;
  onChange: (cycle: BillingToggleValue) => void;
  maxSavings: number;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2">
      {maxSavings > 0 && billing === "monthly" ? (
        <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80 sm:inline">
          Save {maxSavings}% yearly
        </span>
      ) : null}
      <div className="inline-flex rounded-full border border-slate-200/90 bg-white/90 p-0.5 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("annual")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 sm:px-3.5 sm:py-1.5 ${
            billing === "annual"
              ? "brand-gradient-orange-h text-white shadow-sm"
              : "text-brand-primary-muted hover:text-brand-primary"
          }`}
        >
          Annual
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("monthly")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 sm:px-3.5 sm:py-1.5 ${
            billing === "monthly"
              ? "brand-gradient-orange-h text-white shadow-sm"
              : "text-brand-primary-muted hover:text-brand-primary"
          }`}
        >
          Monthly
        </button>
      </div>
    </div>
  );
}

function planCardHighlights(plan: PublicPricingPlan): string[] {
  if (plan.highlights.length > 0) {
    return plan.highlights.slice(0, 2);
  }
  return plan.featureGroups
    .flatMap((group) =>
      group.items.filter((item) => item.included).map((item) => item.label),
    )
    .slice(0, 2);
}

function PaymentPlanCard({
  plan,
  billing,
  selected,
  disabled,
  onSelect,
}: {
  plan: PublicPricingPlan;
  billing: BillingToggleValue;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const style = PLAN_CARD_STYLES[plan.planCode] ?? PLAN_CARD_STYLES.STARTER;
  const monthlyPaise =
    billing === "annual" ? plan.annualMonthlyPricePaise : plan.monthlyPricePaise;
  const highlights = planCardHighlights(plan);
  const isHighlighted = plan.highlighted;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white text-left transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
        selected
          ? `${style.border} ring-2 ring-brand-orange-1/50 scale-[1.02]`
          : `${style.border} hover:-translate-y-0.5`
      } ${isHighlighted && !selected ? style.ring : ""}`}
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl transition-opacity ${style.glow} ${
          selected ? "opacity-80" : "opacity-50 group-hover:opacity-70"
        }`}
      />

      <div className={`relative bg-gradient-to-b px-3.5 pb-3 pt-3.5 sm:px-4 sm:pt-4 ${style.headerGradient}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <PlanCrownIcon className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${style.crown}`} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-primary sm:text-base">{plan.displayName}</p>
              {plan.badge ? (
                <span className="mt-0.5 inline-flex rounded-full bg-brand-orange-2 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                  {plan.badge}
                </span>
              ) : null}
            </div>
          </div>
          {selected ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange-2 text-white">
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
                <path
                  d="M2 6l2.5 2.5L10 3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </div>

        <p className="mt-2.5 flex items-baseline gap-0.5">
          <span className={`text-xl font-bold tabular-nums tracking-tight sm:text-2xl ${style.priceAccent}`}>
            {formatInrFromPaise(monthlyPaise)}
          </span>
          <span className="text-[11px] font-semibold text-brand-primary-muted">/mo</span>
        </p>
        {billing === "annual" && plan.annualSavingsPercent > 0 ? (
          <p className="mt-0.5 text-[10px] font-medium text-emerald-700">
            Save {plan.annualSavingsPercent}% vs monthly
          </p>
        ) : null}
      </div>

      {highlights.length > 0 ? (
        <ul className="relative space-y-2 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
          {highlights.map((line) => (
            <li key={line} className="flex gap-2 text-[11px] leading-snug text-brand-primary sm:text-xs">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${style.checkBg} ${style.checkText}`}
              >
                ✓
              </span>
              <span className="line-clamp-2">{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  );
}

type PlanPaymentCheckoutProps = {
  initialContext?: PaymentCheckoutContext | null;
  paymentToken?: string | null;
  pricing?: PublicPricingResponse | null;
};

export function PlanPaymentCheckout({
  initialContext,
  paymentToken,
  pricing,
}: PlanPaymentCheckoutProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [context, setContext] = useState<PaymentCheckoutContext | null>(initialContext ?? null);
  const [token, setToken] = useState<string | null>(paymentToken ?? null);
  const [selectedPlan, setSelectedPlan] = useState<SignupPlanCode>("STARTER");
  const [selectedBilling, setSelectedBilling] = useState<SignupBillingCycle>("yearly");
  const [loading, setLoading] = useState(false);
  const [selectionUpdating, setSelectionUpdating] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [exploreCoupons, setExploreCoupons] = useState<PlanCouponExploreItem[]>([]);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [redirectingToLogin, setRedirectingToLogin] = useState(false);

  const showPaymentError = useCallback(
    (message: string, errorCode?: number) => {
      if (errorCode === 1007 || isPaymentSessionExpiredMessage(message)) {
        setRedirectingToLogin(true);
        redirectToLoginForPayment(router);
        return;
      }
      setError(message);
    },
    [router],
  );

  const paidPlans = useMemo(() => {
    if (!pricing?.plans.length) return [];
    return pricing.plans
      .filter((p) => PAID_PLAN_CODES.includes(p.planCode as typeof PAID_PLAN_CODES[number]))
      .sort(
        (a, b) =>
          PAID_PLAN_CODES.indexOf(a.planCode as typeof PAID_PLAN_CODES[number]) -
          PAID_PLAN_CODES.indexOf(b.planCode as typeof PAID_PLAN_CODES[number]),
      );
  }, [pricing?.plans]);

  const maxSavings = useMemo(
    () => Math.max(...paidPlans.map((p) => p.annualSavingsPercent), 0),
    [paidPlans],
  );

  const billingToggle = signupBillingToToggle(selectedBilling);

  const previewAmountPaise = useMemo(() => {
    const plan = paidPlans.find((p) => p.planCode === selectedPlan);
    if (plan) {
      return selectedBilling === "yearly" ? plan.yearlyPricePaise : plan.monthlyPricePaise;
    }
    return context?.amountPaise ?? 0;
  }, [context?.amountPaise, paidPlans, selectedBilling, selectedPlan]);

  const displayAmount = useMemo(() => {
    const paise = context?.amountPaise ?? previewAmountPaise;
    return paise > 0 ? formatPlanPriceInr(paise) : "";
  }, [context?.amountPaise, previewAmountPaise]);

  const originalDisplayAmount = useMemo(() => {
    const paise = context?.originalAmountPaise ?? previewAmountPaise;
    return paise > 0 ? formatPlanPriceInr(paise) : "";
  }, [context?.originalAmountPaise, previewAmountPaise]);

  const hasDiscount = (context?.discountPaise ?? 0) > 0;

  const syncFromContext = useCallback((checkout: PaymentCheckoutContext) => {
    setContext(checkout);
    setToken(checkout.paymentToken);
    setSelectedPlan(normalizeSignupPlanCode(checkout.planCode));
    setSelectedBilling(contextBillingToSignup(checkout.billingCycle));
    setCouponInput(checkout.couponCode ?? "");
    storePaymentCheckout(checkout);
  }, []);

  const loadExploreCoupons = useCallback(async (paymentTokenValue: string) => {
    try {
      const res = await fetch("/api/billing/coupons/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentToken: paymentTokenValue }),
      });
      const data: unknown = await res.json();
      if (!res.ok) return;
      const body = data as { success: boolean; data?: PlanCouponExploreItem[] };
      if (body.success && Array.isArray(body.data)) {
        setExploreCoupons(body.data);
      }
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    const paymentTokenValue = token ?? readPaymentToken();
    if (paymentTokenValue) {
      void loadExploreCoupons(paymentTokenValue);
    }
  }, [token, selectedPlan, selectedBilling, loadExploreCoupons]);

  useEffect(() => {
    const storedContext = readPaymentCheckout();
    if (storedContext) {
      if (isPaymentTokenExpired(storedContext.paymentToken)) {
        setRedirectingToLogin(true);
        redirectToLoginForPayment(router);
        return;
      }
      syncFromContext(storedContext);
      return;
    }
    const stored = readPaymentToken();
    if (stored) {
      if (isPaymentTokenExpired(stored)) {
        setRedirectingToLogin(true);
        redirectToLoginForPayment(router);
        return;
      }
      setToken(stored);
      return;
    }
    if (!initialContext && !paymentToken) {
      setRedirectingToLogin(true);
      redirectToLoginForPayment(router);
    }
  }, [initialContext, paymentToken, router, syncFromContext]);

  useEffect(() => {
    if (initialContext) {
      syncFromContext(initialContext);
    }
  }, [initialContext, syncFromContext]);

  const applySelection = useCallback(
    async (
      planCode: SignupPlanCode,
      billing: SignupBillingCycle,
      couponCode?: string | null,
    ) => {
      const paymentTokenValue = token ?? readPaymentToken();
      if (!paymentTokenValue) {
        setRedirectingToLogin(true);
        redirectToLoginForPayment(router);
        return;
      }

      const normalizedCoupon = couponCode?.trim().toUpperCase() ?? "";
      const currentCoupon = context?.couponCode?.trim().toUpperCase() ?? "";

      if (
        planCode === selectedPlan &&
        billing === selectedBilling &&
        context?.planCode === planCode &&
        contextBillingToSignup(context.billingCycle) === billing &&
        normalizedCoupon === currentCoupon
      ) {
        return;
      }

      setSelectionUpdating(true);
      setError(null);

      try {
        const res = await fetch("/api/billing/razorpay/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentToken: paymentTokenValue,
            planCode,
            billingCycle: signupBillingToApi(billing),
            couponCode:
              couponCode === undefined || couponCode === null
                ? context?.couponCode ?? ""
                : couponCode.trim().toUpperCase(),
          }),
        });
        const data: unknown = await res.json();

        if (!res.ok) {
          const message = isApiErrorResponse(data)
            ? data.error.details ?? data.message
            : "Could not update plan selection";
          showPaymentError(message, isApiErrorResponse(data) ? data.error.errorCode : undefined);
          return;
        }

        const body = data as { success: boolean; data?: PaymentCheckoutContext };
        if (!body.success || !body.data || !isPaymentCheckoutContext(body.data)) {
          setError("Unexpected response while updating plan.");
          return;
        }

        syncFromContext(body.data);
        void loadExploreCoupons(body.data.paymentToken);
      } catch {
        setError("Network error while updating plan.");
      } finally {
        setSelectionUpdating(false);
      }
    },
    [context, loadExploreCoupons, router, selectedBilling, selectedPlan, showPaymentError, syncFromContext, token],
  );

  const applyCouponCode = useCallback(
    async (code: string) => {
      const paymentTokenValue = token ?? readPaymentToken();
      if (!paymentTokenValue) return;

      setCouponApplying(true);
      setError(null);
      try {
        await applySelection(selectedPlan, selectedBilling, code);
      } finally {
        setCouponApplying(false);
      }
    },
    [applySelection, selectedBilling, selectedPlan, token],
  );

  const removeCoupon = useCallback(async () => {
    setCouponInput("");
    await applySelection(selectedPlan, selectedBilling, "");
  }, [applySelection, selectedBilling, selectedPlan]);

  const handleBillingChange = useCallback(
    (toggle: BillingToggleValue) => {
      const billing = toggleBillingToSignup(toggle);
      setSelectedBilling(billing);
      void applySelection(selectedPlan, billing, context?.couponCode);
    },
    [applySelection, context?.couponCode, selectedPlan],
  );

  const handlePlanSelect = useCallback(
    (planCode: SignupPlanCode) => {
      setSelectedPlan(planCode);
      void applySelection(planCode, selectedBilling, context?.couponCode);
    },
    [applySelection, context?.couponCode, selectedBilling],
  );

  const verifyPayment = useCallback(
    async (paymentTokenValue: string, razorpayResponse: RazorpaySuccessResponse) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/billing/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentToken: paymentTokenValue,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpaySubscriptionId: razorpayResponse.razorpay_subscription_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
          }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const message = isApiErrorResponse(data)
            ? data.error.details ?? data.message
            : "Payment verification failed";
          showPaymentError(message, isApiErrorResponse(data) ? data.error.errorCode : undefined);
          return;
        }

        const success = data as PaymentSessionSuccessResponse;
        if (!success.success || !success.data?.sessionToken) {
          setError("Payment verified but session could not be created.");
          return;
        }

        clearPaymentToken();
        const { needsSelection, organisations, defaultOrganisationId } =
          completeAuthSessionOrganisation(success.data);

        if (needsSelection) {
          setInfo("Payment successful. Choose your shop to continue.");
          return;
        }

        if (defaultOrganisationId) {
          setStoredActiveOrganisationId(defaultOrganisationId);
        }

        router.push(`${DASHBOARD_PATH}?utm=plan_payment`);
        router.refresh();
      } catch {
        setError("Network error while confirming payment.");
      } finally {
        setLoading(false);
      }
    },
    [router, showPaymentError],
  );

  const startCheckout = useCallback(async () => {
    const paymentTokenValue = token ?? readPaymentToken();
    if (!paymentTokenValue) {
      setRedirectingToLogin(true);
      redirectToLoginForPayment(router);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/billing/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentToken: paymentTokenValue }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message = isApiErrorResponse(data)
          ? data.error.details ?? data.message
          : "Could not start payment";
        showPaymentError(message, isApiErrorResponse(data) ? data.error.errorCode : undefined);
        return;
      }

      const body = data as {
        success: boolean;
        data?: RazorpayCheckoutSession;
      };

      if (!body.success || !body.data) {
        setError("Unexpected payment response");
        return;
      }

      const session = body.data;

      if (session.mock) {
        if (session.mode === "subscription" && session.subscriptionId) {
          await verifyPayment(paymentTokenValue, {
            razorpay_subscription_id: session.subscriptionId,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: "mock_signature",
          });
        } else if (session.orderId) {
          await verifyPayment(paymentTokenValue, {
            razorpay_order_id: session.orderId,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: "mock_signature",
          });
        }
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError("Razorpay checkout could not be loaded.");
        return;
      }

      const isUpiMandate = session.mode === "subscription" && session.subscriptionId;
      const checkoutOptions: RazorpayOptions = {
        key: session.keyId,
        name: "Mahajaan",
        description: isUpiMandate
          ? `${context?.planCode ?? "Plan"} monthly · UPI Autopay`
          : `${context?.planCode ?? "Plan"} annual subscription`,
        prefill: {
          name: context?.name,
          contact: context?.mobile,
        },
        handler: (response) => {
          void verifyPayment(paymentTokenValue, response);
        },
        modal: {
          ondismiss: () => {
            setInfo(
              isUpiMandate
                ? "UPI mandate was not completed. Your account is verified. You can set up Autopay anytime from this page after signing in."
                : "Payment was not completed. Your account is verified. You can pay anytime from this page after signing in.",
            );
            setLoading(false);
          },
        },
      };

      if (isUpiMandate) {
        checkoutOptions.subscription_id = session.subscriptionId;
        checkoutOptions.config = {
          display: {
            blocks: {
              upi: {
                name: "UPI Autopay",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
            preferences: {
              show_default_blocks: false,
            },
          },
        };
      } else {
        checkoutOptions.amount = session.amountPaise;
        checkoutOptions.currency = session.currency;
        checkoutOptions.order_id = session.orderId;
      }

      const checkout = new window.Razorpay(checkoutOptions);

      checkout.open();
    } catch {
      setError("Could not open payment checkout.");
    } finally {
      setLoading(false);
    }
  }, [context, router, showPaymentError, token, verifyPayment]);

  const busy = loading || selectionUpdating || couponApplying;

  if (redirectingToLogin) {
    return null;
  }

  if (!context && !token) {
    return null;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white px-4 py-5 sm:px-8 sm:py-6 lg:px-16 xl:px-24 2xl:px-28">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col lg:mx-0">
        <div className="mb-4 shrink-0 sm:mb-5 lg:hidden">
          <Image
            src={BRAND_LOGO}
            alt={t("common.brandName")}
            width={200}
            height={38}
            className="h-9 w-auto object-contain sm:h-10"
            priority
          />
        </div>

        <div className="shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">Plan payment</p>
          <h1 className="mt-2 text-xl font-bold text-brand-primary sm:text-2xl xl:text-3xl">
            Choose your plan and pay
          </h1>
          <p className="mt-2 text-sm text-brand-primary-muted">
            {context?.organisationName
              ? `Activate Mahajaan for ${context.organisationName}. Switch plan or billing anytime before you pay.`
              : "Activate your Mahajaan subscription to access your dashboard."}
          </p>
          {context?.organisationName ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-brand-surface px-3.5 py-1.5 text-xs font-semibold text-brand-primary">
              <span className="text-brand-primary-muted">Shop</span>
              <span className="truncate">{context.organisationName}</span>
            </div>
          ) : null}
        </div>

        {paidPlans.length > 0 ? (
          <div className="mt-6 shrink-0 sm:mt-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-brand-primary">Select plan</p>
              <PaymentBillingToggle
                billing={billingToggle}
                onChange={handleBillingChange}
                maxSavings={maxSavings}
                disabled={busy}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {paidPlans.map((plan) => (
                <PaymentPlanCard
                  key={plan.planCode}
                  plan={plan}
                  billing={billingToggle}
                  selected={selectedPlan === plan.planCode}
                  disabled={busy}
                  onSelect={() => handlePlanSelect(plan.planCode as SignupPlanCode)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-brand-primary-muted">
              Need Enterprise or white-label?{" "}
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="font-semibold text-brand-orange-2 hover:underline"
              >
                Compare all plans
              </button>
            </p>
          </div>
        ) : null}

        <div className="mt-4 shrink-0">
          <label className="text-sm font-semibold text-brand-primary">Coupon</label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              disabled={busy}
              className="min-w-0 flex-1 rounded-xs border border-slate-300 px-3 py-2.5 text-sm font-mono uppercase tracking-wide text-brand-primary outline-none focus:border-brand-orange-1"
            />
            <button
              type="button"
              disabled={busy || !couponInput.trim()}
              onClick={() => void applyCouponCode(couponInput)}
              className="shrink-0 rounded-xs border border-brand-primary bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Apply
            </button>
            {exploreCoupons.length > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setCouponsOpen((v) => !v)}
                className="shrink-0 rounded-xs border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-brand-primary"
              >
                Offers
              </button>
            ) : null}
          </div>
          {context?.couponCode && context.couponTitle ? (
            <p className="mt-2 rounded-xs border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              {context.couponTitle} applied · save {formatPlanPriceInr(context.discountPaise ?? 0)}
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeCoupon()}
                className="ml-2 font-semibold text-emerald-900 underline"
              >
                Remove
              </button>
            </p>
          ) : null}
        </div>

        <CouponOffersModal
          open={couponsOpen && exploreCoupons.length > 0}
          coupons={exploreCoupons}
          couponInput={couponInput}
          onCouponInputChange={setCouponInput}
          appliedCouponCode={context?.couponCode}
          busy={busy}
          onClose={() => setCouponsOpen(false)}
          onApply={(code) => void applyCouponCode(code)}
        />

        <div className="mt-2 shrink-0 space-y-2">
          {error ? (
            <p className="rounded-xs border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-xs border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {info}
            </p>
          ) : null}
        </div>

        <div className="mt-auto shrink-0 pt-4">
          <div className="rounded-xs border border-slate-200 bg-brand-surface/80 p-4">
            <p className="text-sm font-semibold text-brand-primary-muted">Amount due today</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              {hasDiscount ? (
                <span className="text-sm text-brand-primary-muted line-through tabular-nums">
                  {originalDisplayAmount}
                </span>
              ) : null}
              <span className="text-2xl font-bold tabular-nums text-brand-primary sm:text-3xl">
                {displayAmount || "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-primary-muted">
              {selectedBilling === "yearly"
                ? "Billed annually · GST excluded"
                : "Monthly UPI Autopay · GST excluded"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={busy}
            className="login-btn-primary mt-4 w-full rounded-xs px-4 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Processing…"
              : selectionUpdating
                ? "Updating plan…"
                : selectedBilling === "monthly"
                  ? "Set up UPI Autopay"
                  : "Pay with Razorpay"}
          </button>

          <p className="mt-3 text-center text-xs text-brand-primary-muted">
            Already paid?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-orange-2 hover:underline">
              Sign in again
            </Link>
            {" · "}
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="font-semibold text-brand-orange-2 hover:underline"
            >
              Compare plans
            </button>
          </p>
        </div>

        {pricing ? (
          <PricingCompareDialog
            open={compareOpen}
            rows={pricing.comparisonMatrix ?? []}
            plans={pricing.plans}
            billing={billingToggle}
            onClose={() => setCompareOpen(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

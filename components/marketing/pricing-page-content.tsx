"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { PricingCompareDialog } from "@/components/marketing/pricing-compare-dialog";
import {
  PLAN_CARD_STYLES,
  PlanCrownIcon,
} from "@/lib/marketing/pricing-feature-icons";
import type { PublicPricingPlan, PublicPricingResponse } from "@/lib/types/pricing-api";
import { PAID_PLAN_CODES } from "@/lib/types/pricing-api";
import {
  buildRegisterHref,
  type SignupBillingCycle,
  type SignupPlanCode,
} from "@/lib/auth/plan-signup";

type BillingCycle = "annual" | "monthly";

const TRUST_PILLS = [
  "No credit card to start",
  "Setup help included",
  "Transparent limits",
  "Cancel anytime",
];

const VALUE_PROPS = [
  {
    title: "GST-ready billing",
    description: "Invoices, POS, and party khata built for Indian retail.",
    icon: "invoice",
  },
  {
    title: "Mahajaan AI included",
    description: "Create bills and check stock by chat on Pro and above.",
    icon: "ai",
  },
  {
    title: "WhatsApp on Business",
    description: "Run daily shop work from WhatsApp without opening the app.",
    icon: "whatsapp",
  },
  {
    title: "Real human support",
    description: "Onboarding help and priority support on higher tiers.",
    icon: "support",
  },
];

const INCLUDED_EVERYWHERE = [
  "Cloud sync on web, Android & iOS",
  "Secure data backup",
  "Role-based access",
  "Regular product updates",
];

const ADDON_ICONS: Record<string, string> = {
  "extra-user": "users",
  "ai-topup": "ai",
  "payment-gateway": "card",
  "reseller-whitelabel": "partner",
};

function cleanCopy(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ". ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function formatInrFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatInrWhole(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function ValuePropIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  if (type === "invoice") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 7h6m-6 4h6m-2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (type === "ai") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M18 10a6 6 0 10-12 0v4l-2 2v2h16v-2l-2-2v-4zM9 22h6" strokeLinecap="round" />
    </svg>
  );
}

function AddonIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "card") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  if (type === "partner") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L2 9h7l3-7z" strokeLinejoin="round" />
      </svg>
    );
  }
  return <ValuePropIcon type="ai" />;
}

function PlanPrice({ plan, billing, accentClass }: { plan: PublicPricingPlan; billing: BillingCycle; accentClass: string }) {
  const monthlyPaise =
    billing === "annual" ? plan.annualMonthlyPricePaise : plan.monthlyPricePaise;
  const yearlyTotal = plan.yearlyPricePaise / 100;

  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold tracking-tight sm:text-[2.75rem] ${accentClass}`}>
          {formatInrFromPaise(monthlyPaise)}
        </span>
        <span className="text-sm font-semibold text-brand-primary-muted">/ mo</span>
      </p>
      {billing === "annual" ? (
        <p className="mt-1.5 text-xs font-medium text-brand-primary-muted">
          {formatInrWhole(yearlyTotal)} billed yearly. Save {plan.annualSavingsPercent}% vs monthly.
        </p>
      ) : (
        <p className="mt-1.5 text-xs font-medium text-brand-primary-muted">
          Billed monthly. Save {plan.annualSavingsPercent}% with annual billing.
        </p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  onViewDetails,
}: {
  plan: PublicPricingPlan;
  billing: BillingCycle;
  onViewDetails: () => void;
}) {
  const style = PLAN_CARD_STYLES[plan.planCode] ?? PLAN_CARD_STYLES.STARTER;
  const isHighlighted = plan.highlighted;
  const signupPlan = plan.planCode as SignupPlanCode;
  const signupBilling: SignupBillingCycle = billing === "annual" ? "yearly" : "monthly";
  const registerHref = buildRegisterHref(signupPlan, signupBilling);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white transition duration-300 ${style.border} ${style.shadow} ${style.ring} ${
        isHighlighted ? "lg:-translate-y-2" : "hover:-translate-y-1"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl ${style.glow}`}
      />

      <div className={`relative bg-gradient-to-b px-6 pb-5 pt-6 sm:px-7 sm:pt-7 ${style.headerGradient}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlanCrownIcon className={style.crown} />
            <div>
              <h2 className="text-xl font-bold text-brand-primary">{plan.displayName}</h2>
              {plan.badge ? (
                <span className="mt-1 inline-flex rounded-full bg-brand-orange-2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {plan.badge}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <PlanPrice plan={plan} billing={billing} accentClass={style.priceAccent} />
        </div>
        <p className="mt-3 text-sm leading-6 text-brand-primary-muted">
          {cleanCopy(plan.description)}
        </p>
      </div>

      <div className="relative flex flex-1 flex-col px-6 pb-6 sm:px-7 sm:pb-7">
        <div className="my-5 h-px bg-slate-100" />

        <p className="text-xs font-bold uppercase tracking-wider text-brand-primary-muted">
          What you get
        </p>
        <ul className="mt-4 flex-1 space-y-3">
          {plan.highlights.slice(0, 5).map((line) => (
            <li key={line} className="flex gap-3 text-sm text-brand-primary">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.checkBg} ${style.checkText}`}
              >
                ✓
              </span>
              <span className="leading-snug">{cleanCopy(line)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href={registerHref}
            className={`inline-flex justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition ${style.cta}`}
          >
            {plan.ctaLabel}
          </Link>
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-primary transition hover:border-slate-300 hover:bg-slate-50"
          >
            See full pricing details
          </button>
        </div>
      </div>
    </article>
  );
}

function EnterpriseStrip({
  plan,
  onViewDetails,
}: {
  plan: PublicPricingPlan;
  onViewDetails: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-300/30 bg-gradient-to-br from-violet-900 via-brand-primary to-slate-950 p-6 text-white shadow-2xl shadow-violet-900/30 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-brand-orange-1/15 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <PlanCrownIcon className="text-violet-300" />
            <p className="text-xs font-bold uppercase tracking-wider text-violet-200">Custom plan</p>
          </div>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{plan.displayName}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            {cleanCopy(plan.description)}
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {plan.highlights.slice(0, 4).map((line) => (
              <li key={line} className="flex gap-2 text-sm text-white/90">
                <span className="text-violet-300">✓</span>
                {cleanCopy(line)}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={plan.ctaHref}
            className="inline-flex justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-primary shadow-lg hover:bg-slate-100"
          >
            {plan.ctaLabel}
          </Link>
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex justify-center rounded-xl border border-white/25 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Compare all plans
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingToggle({
  billing,
  onChange,
  maxSavings,
}: {
  billing: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  maxSavings: number;
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
          billing === "annual"
            ? "brand-gradient-orange-h text-white shadow-md"
            : "text-brand-primary-muted hover:text-brand-primary"
        }`}
      >
        Pay annually
        {maxSavings > 0 ? (
          <span className="ml-1.5 text-[11px] font-bold opacity-95">Save up to {maxSavings}%</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
          billing === "monthly"
            ? "brand-gradient-orange-h text-white shadow-md"
            : "text-brand-primary-muted hover:text-brand-primary"
        }`}
      >
        Pay monthly
      </button>
    </div>
  );
}

function PricingControls({
  billing,
  onBillingChange,
  maxSavings,
  onViewDetails,
}: {
  billing: BillingCycle;
  onBillingChange: (cycle: BillingCycle) => void;
  maxSavings: number;
  onViewDetails: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <BillingToggle billing={billing} onChange={onBillingChange} maxSavings={maxSavings} />
      <button
        type="button"
        onClick={onViewDetails}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-brand-primary shadow-sm transition hover:border-brand-orange-1/40 hover:shadow-md"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-orange-2" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        View all features
      </button>
    </div>
  );
}

export function PricingPageContent({ pricing }: { pricing: PublicPricingResponse }) {
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const [compareOpen, setCompareOpen] = useState(false);

  const paidPlans = useMemo(
    () =>
      pricing.plans
        .filter((p) => PAID_PLAN_CODES.includes(p.planCode as typeof PAID_PLAN_CODES[number]))
        .sort(
          (a, b) =>
            PAID_PLAN_CODES.indexOf(a.planCode as typeof PAID_PLAN_CODES[number]) -
            PAID_PLAN_CODES.indexOf(b.planCode as typeof PAID_PLAN_CODES[number]),
        ),
    [pricing.plans],
  );

  const enterprisePlan = pricing.plans.find((p) => p.isCustomPricing);

  const maxSavings = useMemo(
    () => Math.max(...paidPlans.map((p) => p.annualSavingsPercent), 0),
    [paidPlans],
  );

  const openDetails = () => setCompareOpen(true);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,83,26,0.22),transparent_52%)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-primary-light/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-3">Pricing</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              Invest in software that runs your shop every day
            </h1>
            <p className="mt-5 text-base leading-8 text-white/75 sm:text-lg">
              Starter from ₹149/mo on annual billing. Pro adds Mahajaan AI at ₹299. Business adds
              WhatsApp at ₹499. Every limit is listed upfront so you know exactly what you pay for.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {TRUST_PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-brand-surface py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(3,31,73,0.04),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex justify-center">
            <PricingControls
              billing={billing}
              onBillingChange={setBilling}
              maxSavings={maxSavings}
              onViewDetails={openDetails}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {paidPlans.map((plan) => (
              <PlanCard key={plan.planCode} plan={plan} billing={billing} onViewDetails={openDetails} />
            ))}
          </div>

          {enterprisePlan ? (
            <div className="mt-12">
              <EnterpriseStrip plan={enterprisePlan} onViewDetails={openDetails} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">
              Why Mahajaan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-brand-primary sm:text-3xl">
              Built for shops that cannot afford billing mistakes
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200/90 bg-brand-surface/50 p-5 transition hover:border-brand-orange-1/30 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary text-white">
                  <ValuePropIcon type={item.icon} />
                </div>
                <h3 className="mt-4 font-bold text-brand-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-primary-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {pricing.addons.length > 0 ? (
        <section className="bg-brand-surface py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">Add-ons</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-primary sm:text-3xl">
                Stack extras when your shop grows
              </h2>
              <p className="mt-2 text-sm text-brand-primary-muted">
                Available on any paid plan. Add only what you need.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {pricing.addons.map((addon) => (
                <div
                  key={addon.addonCode}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange-1/15 text-brand-orange-2">
                    <AddonIcon type={ADDON_ICONS[addon.addonCode] ?? "ai"} />
                  </div>
                  <p className="mt-4 font-bold text-brand-primary">{addon.title}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-orange-2">{addon.priceLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-brand-primary-muted">
                    {cleanCopy(addon.description)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200/90 bg-brand-surface/40 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-brand-primary">Included in every paid plan</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {INCLUDED_EVERYWHERE.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-brand-primary">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-brand-primary-muted">
              {cleanCopy(pricing.disclaimer)}
            </p>
          </div>
        </div>
      </section>

      <FinalCtaSection />

      <PricingCompareDialog
        open={compareOpen}
        rows={pricing.comparisonMatrix}
        plans={pricing.plans}
        billing={billing}
        onClose={() => setCompareOpen(false)}
      />
    </>
  );
}

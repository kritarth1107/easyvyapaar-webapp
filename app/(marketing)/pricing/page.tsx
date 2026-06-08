import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PRICING_PLANS } from "@/lib/marketing/site-content";
import { PRICING_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Pricing — Free early access & plans for every shop size",
  description:
    "Transparent Mahajaan pricing for Indian retailers. Start free during early access — no credit card. Growth & Business plans with POS, payroll & advanced reports. Compare cost vs Vyapar, myBillBook, TallyPrime, Marg ERP & Busy.",
  path: "/pricing",
  keywords: PRICING_KEYWORDS,
});

export default function PricingPage() {
  return (
    <>
      <section className="bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Grow when your shop grows."
            description="No hidden setup fees. Pick a plan that matches your counter, team size, and reporting needs."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-brand-orange-1/40 bg-white shadow-lg shadow-brand-orange-1/10 ring-2 ring-brand-orange-1/20"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              {plan.highlighted ? (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand-orange-1/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-orange-2">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-xl font-bold text-brand-primary">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-3xl font-bold text-brand-primary">{plan.price}</span>
                <span className="text-sm text-brand-primary-muted"> {plan.period}</span>
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-primary-muted">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-brand-primary">
                    <span className="text-brand-orange-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.id === "business" ? "/contact" : "/auth/register"}
                className={`mt-8 inline-flex justify-center rounded-sm px-5 py-3 text-sm font-semibold ${
                  plan.highlighted
                    ? "brand-gradient-orange-h text-white"
                    : "border border-brand-primary/15 text-brand-primary hover:bg-brand-surface"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl px-4 text-center text-xs text-brand-primary-muted">
          Prices shown are indicative for planning purposes. Final commercial terms may vary during
          early access. GST applicable where required.
        </p>
      </section>
    </>
  );
}

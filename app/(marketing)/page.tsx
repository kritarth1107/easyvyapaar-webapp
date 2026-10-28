import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeaturesShowcase } from "@/components/marketing/features-showcase";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { OnboardingStatsSection } from "@/components/marketing/onboarding-stats-section";
import { ShopTypesStrip } from "@/components/marketing/shop-types-strip";
import { HeroAiChatDemo } from "@/components/marketing/hero-ai-chat-demo";
import { ProductPreviewVisual } from "@/components/marketing/product-preview-visual";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SignupCta } from "@/components/marketing/signup-cta";
import { LEGAL_ENTITY } from "@/legal/company";
import { FAQ_ITEMS, HERO } from "@/lib/marketing/site-content";
import { HOME_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata, getSiteUrl, SITE_NAME } from "@/lib/seo/site-metadata";

function HeroCapabilityIcon({ name }: { name: string }) {
  switch (name) {
    case "receipt":
      return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      );
    case "box":
      return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7" />
          <path d="M12 11v10" />
        </svg>
      );
    case "wallet":
      return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <circle cx="16.5" cy="13.5" r="1" />
        </svg>
      );
    case "ai":
      return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
          <path d="M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8L15.5 17.5l1.8-.7L18 15z" />
        </svg>
      );
    default:
      return null;
  }
}

export const metadata: Metadata = buildMarketingMetadata({
  title: `${SITE_NAME} — AI-powered retail ERP for Indian shops`,
  description:
    "Manage your kirana, electronics, or wholesale shop by chat or dashboard. Mahajaan combines AI assistant, GST billing, POS, inventory, party khata, reports, and payroll — a modern alternative to Vyapar, myBillBook, Tally, Marg & Busy.",
  path: "/",
  keywords: HOME_KEYWORDS,
});

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    url: getSiteUrl(),
    description:
      "GST billing, inventory management, POS, and reports for Indian retail shops.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-brand-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_8%,rgba(253,83,26,0.08),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-brand-primary shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange-1" aria-hidden />
              {HERO.eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {HERO.title} <span className="text-brand-orange-2">{HERO.titleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-primary-muted sm:text-lg">{HERO.subtitle}</p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {HERO.capabilities.map((cap) => (
                <li
                  key={cap.label}
                  className="flex items-start gap-3 rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-surface text-brand-primary">
                    <HeroCapabilityIcon name={cap.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-brand-primary">{cap.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-brand-primary-muted">{cap.hint}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <SignupCta />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-primary-muted">
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {HERO.proof}
              </span>
              <span className="hidden h-3 w-px bg-slate-200 sm:block" aria-hidden />
              <span>From {LEGAL_ENTITY.legalName}</span>
            </div>
          </div>

          <div className="lg:pt-2">
            <HeroAiChatDemo />
          </div>
        </div>
      </section>

      <ShopTypesStrip />

      <FeaturesShowcase />

      <OnboardingStatsSection />

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ProductPreviewVisual variant="billing" />
            <div>
              <SectionHeading
                align="left"
                eyebrow="POS"
                title="Billing that keeps up with your counter"
                description="Search items fast, apply GST automatically, and print or share invoices without leaving the sale screen."
              />
              <Link
                href="/auth/register"
                className="brand-gradient-orange-h mt-8 inline-flex rounded-sm px-6 py-3 text-sm font-semibold text-white"
              >
                Try POS billing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions from shop owners"
            description="Straight answers — no sales fluff."
          />
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
          </div>
          <p className="mt-6 text-center text-sm text-brand-primary-muted">
            <Link href="/faq" className="font-semibold text-brand-orange-2 hover:underline">
              View all FAQs
            </Link>
          </p>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
}

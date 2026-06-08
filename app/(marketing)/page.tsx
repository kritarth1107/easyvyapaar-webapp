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
import { FAQ_ITEMS, HERO } from "@/lib/marketing/site-content";
import { HOME_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata, getSiteUrl, SITE_NAME } from "@/lib/seo/site-metadata";

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

      <section className="relative overflow-hidden bg-brand-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,83,26,0.08),transparent_45%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-2">{HERO.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {HERO.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-primary-muted sm:text-lg">{HERO.subtitle}</p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {HERO.bullets.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-brand-primary">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange-1/15 text-xs text-brand-orange-2">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <SignupCta />
            </div>
            <p className="mt-3 text-xs text-brand-primary-muted">No credit card required during early access.</p>
          </div>

          <div className="lg:pt-4">
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

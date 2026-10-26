import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeaturesShowcase } from "@/components/marketing/features-showcase";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { OnboardingStatsSection } from "@/components/marketing/onboarding-stats-section";
import { ShopTypesStrip } from "@/components/marketing/shop-types-strip";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProductPreviewVisual } from "@/components/marketing/product-preview-visual";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FAQ_ITEMS } from "@/lib/marketing/site-content";
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

      <HeroSection />

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

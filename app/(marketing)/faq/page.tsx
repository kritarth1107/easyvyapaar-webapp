import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FAQ_ITEMS } from "@/lib/marketing/site-content";
import { FAQ_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "FAQ — GST billing, AI chat, data safety & pricing",
  description:
    "Answers about Mahajaan retail ERP: AI shop assistant, GST invoices, POS, inventory, party khata, CA-ready reports, pricing vs Vyapar & myBillBook, data security, and account deletion.",
  path: "/faq",
  keywords: FAQ_KEYWORDS,
});

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions shop owners ask before switching"
            description="If something is not covered here, write to us — we answer plainly."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FaqAccordion items={FAQ_ITEMS} />
          <p className="mt-8 text-center text-sm text-brand-primary-muted">
            Still unsure?{" "}
            <Link href="/contact" className="font-semibold text-brand-orange-2 hover:underline">
              Contact our team
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

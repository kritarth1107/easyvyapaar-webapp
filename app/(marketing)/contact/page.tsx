import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CONTACT_EMAIL } from "@/lib/marketing/site-content";
import { CONTACT_KEYWORDS } from "@/lib/seo/marketing-keywords";
import { buildMarketingMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Contact — Book a demo, onboarding & support",
  description:
    "Talk to Mahajaan for live demos, migration from Vyapar, myBillBook or Tally, onboarding help, and retail ERP support. Email hello@mahajaan.com — built for Indian shop owners.",
  path: "/contact",
  keywords: CONTACT_KEYWORDS,
});

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            align="left"
            eyebrow="Contact"
            title="Talk to the team behind Mahajaan"
            description="Book a demo, ask about onboarding, or tell us about your shop. We reply within one business day."
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-primary-muted">Email</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 block text-lg font-semibold text-brand-orange-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-primary-muted">Domains</p>
              <p className="mt-2 text-lg font-semibold text-brand-primary">mahajaan.com · mahajaan.in</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-brand-primary p-6 text-white">
              <p className="font-semibold">Free onboarding</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                We help early shops set up invoices, upload inventory, and train staff on POS and
                reports — at no extra cost during early access.
              </p>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}

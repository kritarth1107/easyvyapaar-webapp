import Link from "next/link";
import { AiFeaturesSection } from "@/components/marketing/ai-features-section";
import { FeaturesModuleTabs } from "@/components/marketing/features-module-tabs";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { ProductPreviewVisual } from "@/components/marketing/product-preview-visual";
import { SignupCta } from "@/components/marketing/signup-cta";
import {
  ALL_FEATURES,
  BEFORE_AFTER,
  FEATURE_WORKFLOW,
  FEATURES_PAGE_HERO,
} from "@/lib/marketing/site-content";

export function FeaturesPageContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,83,26,0.18),transparent_50%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-3">Features</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.1]">
              {FEATURES_PAGE_HERO.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-white/75 sm:text-lg">{FEATURES_PAGE_HERO.subtitle}</p>
            <div className="mt-8">
              <SignupCta variant="dark" />
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {FEATURES_PAGE_HERO.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductPreviewVisual variant="dashboard" />
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">
            How it connects
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold text-brand-primary sm:text-3xl">
            One sale updates everything downstream
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_WORKFLOW.map((step) => (
              <article
                key={step.step}
                className="relative rounded-2xl border border-slate-200/90 bg-brand-surface/40 p-5"
              >
                <span className="text-3xl font-bold text-brand-orange-1/30">{step.step}</span>
                <h3 className="mt-3 font-bold text-brand-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-brand-primary-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-rose-100 bg-white p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Without Mahajaan</p>
              <h3 className="mt-2 text-xl font-bold text-brand-primary">Scattered tools, mismatched numbers</h3>
              <ul className="mt-5 space-y-3">
                {BEFORE_AFTER.before.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-brand-primary-muted">
                    <span className="text-rose-500">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-900/5 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">With Mahajaan</p>
              <h3 className="mt-2 text-xl font-bold text-brand-primary">One flow from bill to books</h3>
              <ul className="mt-5 space-y-3">
                {BEFORE_AFTER.after.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-brand-primary">
                    <span className="font-bold text-emerald-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <AiFeaturesSection />

      <FeaturesModuleTabs />

      <section className="bg-brand-primary py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">See it on your own counter</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              Sign up free, add a few items, and run a test bill. Most shop owners understand Mahajaan
              faster with their own product names and prices — not a demo catalogue.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 inline-flex rounded-sm bg-white px-6 py-3 text-sm font-semibold text-brand-primary"
            >
              Create free account
            </Link>
          </div>
          <ProductPreviewVisual variant="billing" />
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
}

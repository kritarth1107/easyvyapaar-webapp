import Link from "next/link";
import { SignupCta } from "@/components/marketing/signup-cta";
import { FINAL_CTA_POINTS } from "@/lib/marketing/site-content";

export function FinalCtaSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_24px_80px_-32px_rgba(3,31,73,0.2)]">
          <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-brand-orange-1/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

          <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-2">Get started</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl">
                Start using Mahajaan at your shop
              </h2>
              <p className="mt-4 max-w-lg text-base leading-8 text-brand-primary-muted">
                Create your account in minutes. Add inventory, bill your first customer, and see sales,
                stock, and outstanding balances in one dashboard.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {FINAL_CTA_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-brand-primary">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-brand-primary-muted">
                <span className="rounded-full bg-brand-surface px-3 py-1.5">No credit card</span>
                <span className="rounded-full bg-brand-surface px-3 py-1.5">Free early access</span>
                <span className="rounded-full bg-brand-surface px-3 py-1.5">Setup help included</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-brand-surface/60 p-6 sm:p-8">
              <p className="text-sm font-semibold text-brand-primary">Create your free account</p>
              <p className="mt-1 text-xs text-brand-primary-muted">Enter your mobile number to begin</p>
              <div className="mt-5">
                <SignupCta />
              </div>
              <p className="mt-4 text-center text-xs text-brand-primary-muted">
                Already registered?{" "}
                <Link href="/auth/login" className="font-semibold text-brand-orange-2 hover:underline">
                  Sign in
                </Link>
              </p>

              <div className="mt-6 border-t border-slate-200/80 pt-6">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-primary-muted">
                  Prefer a walkthrough?
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-orange-2"
                >
                  Book a free demo with our team →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { FeatureIcon } from "@/components/marketing/feature-icon";
import { FEATURE_HIGHLIGHTS, FEATURE_PILLARS } from "@/lib/marketing/site-content";

const featureAnchors: Record<string, string> = {
  pos: "pos",
  gst: "billing-sales",
  inventory: "inventory",
  parties: "parties-finance",
  reports: "parties-finance",
  staff: "operations",
};

const accentStyles: Record<string, { icon: string; ring: string; badge: string }> = {
  orange: { icon: "bg-orange-100 text-brand-orange-2", ring: "ring-orange-100", badge: "bg-orange-50 text-orange-700" },
  blue: { icon: "bg-sky-100 text-sky-700", ring: "ring-sky-100", badge: "bg-sky-50 text-sky-700" },
  emerald: { icon: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-100", badge: "bg-emerald-50 text-emerald-700" },
  violet: { icon: "bg-violet-100 text-violet-700", ring: "ring-violet-100", badge: "bg-violet-50 text-violet-700" },
  rose: { icon: "bg-rose-100 text-rose-700", ring: "ring-rose-100", badge: "bg-rose-50 text-rose-700" },
  amber: { icon: "bg-amber-100 text-amber-700", ring: "ring-amber-100", badge: "bg-amber-50 text-amber-700" },
};

export function FeaturesShowcase() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(3,31,73,0.04),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-brand-orange-1/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-2">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-primary sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Everything on the counter, nothing in five different apps
          </h2>
          <p className="mt-4 text-base leading-8 text-brand-primary-muted sm:text-lg">
            Billing, stock, parties, purchases, reports, and staff — connected so stock, GST, and
            outstanding balances always match.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FEATURE_PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              className="rounded-2xl border border-slate-200/90 bg-white/80 px-5 py-4 text-center shadow-sm backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-brand-primary">{pillar.value}</p>
              <p className="mt-1 text-sm font-semibold text-brand-primary">{pillar.label}</p>
              <p className="mt-1 text-xs text-brand-primary-muted">{pillar.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FEATURE_HIGHLIGHTS.map((feature, index) => {
            const accent = accentStyles[feature.accent] ?? accentStyles.orange;
            const featured = index === 0;

            return (
              <article
                key={feature.id}
                className={`group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  featured ? "md:col-span-2 xl:col-span-1 xl:row-span-1" : ""
                }`}
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-surface opacity-80 transition group-hover:scale-110" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.icon}`}>
                      <FeatureIcon type={feature.icon} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${accent.badge}`}>
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-brand-primary">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-brand-primary-muted">{feature.description}</p>

                  <ul className="mt-4 space-y-2">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-sm text-brand-primary">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange-2" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold text-brand-primary-muted">{feature.stat}</span>
                    <Link
                      href={`/features#${featureAnchors[feature.id] ?? feature.id}`}
                      className="text-sm font-semibold text-brand-orange-2 hover:underline"
                    >
                      Explore →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl border border-brand-primary/10 bg-brand-primary px-6 py-8 text-white sm:flex-row sm:px-8">
          <div className="text-center sm:text-left">
            <p className="text-lg font-bold">30+ features across billing, stock, and reports</p>
            <p className="mt-1 text-sm text-white/70">
              See the full module list — purchases, returns, payroll, P&L, and more.
            </p>
          </div>
          <Link
            href="/features"
            className="inline-flex shrink-0 rounded-sm bg-white px-6 py-3 text-sm font-semibold text-brand-primary hover:bg-white/90"
          >
            See all features
          </Link>
        </div>
      </div>
    </section>
  );
}

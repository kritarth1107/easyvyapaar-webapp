import Link from "next/link";
import { HOME_STATS, SETUP_BAND } from "@/lib/marketing/site-content";

function StatIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    clock: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5l4 2-.9 1.6-4.6-2.5V7h1.5z",
    layers: "M12 2 2 7l10 5 10-5-10-5zm0 8.2L4.2 7.8 12 12l7.8-4.2L12 10.2zm-8 3.3 8 4.5 8-4.5v2.3l-8 4.5-8-4.5V13.5z",
    flag: "M6 3h12v2H6V3zm0 4h8v11H6V7zm10 0h2v13h-2V7z",
    wallet: "M3 7h18v10H3V7zm2 2v6h14V9H5zm12 2h2v2h-2v-2z",
  };
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={paths[type] ?? paths.clock} />
    </svg>
  );
}

const statAccents: Record<string, { card: string; icon: string; glow: string }> = {
  orange: {
    card: "from-orange-500/20 via-orange-500/10 to-transparent border-orange-400/20",
    icon: "bg-orange-500/20 text-orange-300",
    glow: "bg-orange-500/30",
  },
  sky: {
    card: "from-sky-500/20 via-sky-500/10 to-transparent border-sky-400/20",
    icon: "bg-sky-500/20 text-sky-300",
    glow: "bg-sky-500/30",
  },
  emerald: {
    card: "from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-400/20",
    icon: "bg-emerald-500/20 text-emerald-300",
    glow: "bg-emerald-500/30",
  },
  violet: {
    card: "from-violet-500/20 via-violet-500/10 to-transparent border-violet-400/20",
    icon: "bg-violet-500/20 text-violet-300",
    glow: "bg-violet-500/30",
  },
};

export function OnboardingStatsSection() {
  return (
    <section className="relative overflow-hidden bg-brand-primary py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(253,83,26,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-brand-primary-light/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-orange-3">
            Onboarding
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            {SETUP_BAND.title}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
            We help early shops go live with real inventory and real invoices — not empty demo data
            you have to tear down later.
          </p>

          <ul className="mt-8 space-y-4">
            {SETUP_BAND.items.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-gradient-orange-h text-xs font-bold text-white">
                  ✓
                </span>
                <span className="text-sm font-medium text-white/90 sm:text-base">{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-sm bg-white px-6 py-3.5 text-sm font-semibold text-brand-primary shadow-lg shadow-black/10 hover:bg-white/95"
          >
            {SETUP_BAND.cta}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_STATS.map((stat) => {
            const accent = statAccents[stat.accent] ?? statAccents.orange;
            return (
              <article
                key={stat.label}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6 ${accent.card}`}
              >
                <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${accent.glow}`} />
                <div className="relative">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent.icon}`}>
                    <StatIcon type={stat.icon} />
                  </div>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl">
                      {stat.value}
                    </span>
                    <span className="pb-1 text-2xl font-bold text-brand-orange-3">{stat.unit}</span>
                  </div>
                  <p className="mt-3 text-base font-bold text-white">{stat.label}</p>
                  <p className="mt-1.5 text-xs leading-5 text-white/60">{stat.hint}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

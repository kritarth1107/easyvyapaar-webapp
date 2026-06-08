"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { SignupCta } from "@/components/marketing/signup-cta";
import { USE_CASES, USE_CASES_PAGE } from "@/lib/marketing/site-content";

const ACCENTS: Record<string, { card: string; badge: string; glow: string; border: string }> = {
  orange: {
    card: "from-orange-50 to-white",
    badge: "bg-orange-100 text-orange-800",
    glow: "bg-orange-400/20",
    border: "border-orange-200/80",
  },
  sky: {
    card: "from-sky-50 to-white",
    badge: "bg-sky-100 text-sky-800",
    glow: "bg-sky-400/20",
    border: "border-sky-200/80",
  },
  emerald: {
    card: "from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    glow: "bg-emerald-400/20",
    border: "border-emerald-200/80",
  },
  violet: {
    card: "from-violet-50 to-white",
    badge: "bg-violet-100 text-violet-800",
    glow: "bg-violet-400/20",
    border: "border-violet-200/80",
  },
  amber: {
    card: "from-amber-50 to-white",
    badge: "bg-amber-100 text-amber-900",
    glow: "bg-amber-400/20",
    border: "border-amber-200/80",
  },
  rose: {
    card: "from-rose-50 to-white",
    badge: "bg-rose-100 text-rose-800",
    glow: "bg-rose-400/20",
    border: "border-rose-200/80",
  },
  blue: {
    card: "from-blue-50 to-white",
    badge: "bg-blue-100 text-blue-800",
    glow: "bg-blue-400/20",
    border: "border-blue-200/80",
  },
};

function SectorIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    store: "M4 4h16v16H4V4zm2 3v4h12V7H6zm0 6v5h5v-5H6zm7 0v5h5v-5h-5z",
    mobile: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v12h6V5H9zm3 14a1 1 0 100-2 1 1 0 000 2z",
    health: "M12 2a6 6 0 00-6 6c0 4.5 6 12 6 12s6-7.5 6-12a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z",
    fabric: "M4 6h16v2l-2 10H6L4 8V6zm4 3v2h2V9H8zm6 0v2h2V9h-2z",
    tools: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1z",
    truck: "M2 7h13v8H2V7zm13 1h4l2 3v4h-6V8zM6 17a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  };
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={paths[type] ?? paths.store} />
    </svg>
  );
}

export function UseCasesPageContent() {
  const [activeId, setActiveId] = useState<(typeof USE_CASES)[number]["id"]>(USE_CASES[0].id);

  useEffect(() => {
    const ids = USE_CASES.map((u) => u.id);
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: (typeof USE_CASES)[number]["id"]) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-brand-primary text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(253,83,26,0.2),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(3,31,73,0.4))]" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-3">{USE_CASES_PAGE.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:leading-[1.08]">
            {USE_CASES_PAGE.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">{USE_CASES_PAGE.subtitle}</p>
          <div className="mt-8 max-w-md">
            <SignupCta variant="dark" />
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {USE_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold transition ${
                  activeId === item.id
                    ? "border-white/40 bg-white text-brand-primary"
                    : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <SectorIcon type={item.icon} />
                {item.title.split(" & ")[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
          {USE_CASES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`shrink-0 rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                activeId === item.id
                  ? "brand-gradient-orange-h text-white"
                  : "text-brand-primary-muted hover:bg-brand-surface hover:text-brand-primary"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
          {USE_CASES.map((item, index) => {
            const accent = ACCENTS[item.accent] ?? ACCENTS.orange;
            const reversed = index % 2 === 1;

            return (
              <article
                key={item.id}
                id={item.id}
                className={`scroll-mt-32 overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br ${accent.card} shadow-sm`}
              >
                <div
                  className={`grid gap-0 lg:grid-cols-2 ${reversed ? "lg:[direction:rtl] lg:*:[direction:ltr]" : ""}`}
                >
                  <div className="relative border-b border-slate-200/60 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:border-slate-200/60">
                    <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl ${accent.glow}`} />
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accent.badge}`}>
                          {item.category}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-brand-primary-muted">
                          {item.metric.label}: {item.metric.value}
                        </span>
                      </div>
                      <div className={`mt-4 inline-flex h-12 w-12 items-center justify-center rounded-sm border ${accent.border} bg-white text-brand-primary shadow-sm`}>
                        <SectorIcon type={item.icon} />
                      </div>
                      <h2 className="mt-4 text-2xl font-bold text-brand-primary sm:text-3xl">{item.title}</h2>
                      <p className="mt-1 text-sm font-semibold text-brand-orange-2">{item.tagline}</p>
                      <p className="mt-4 text-sm leading-7 text-brand-primary-muted">{item.description}</p>
                      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-sm text-brand-primary">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange-2" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center bg-white/70 p-6 sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary-muted">
                      A day in your shop
                    </p>
                    <p className="mt-3 text-base leading-8 text-brand-primary">{item.scenario}</p>
                    <div className="mt-6 rounded-sm border border-slate-200/90 bg-brand-surface/80 p-4">
                      <p className="text-[10px] font-semibold uppercase text-brand-primary-muted">Also works with</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["GST billing", "Party khata", "WhatsApp AI", "Reports"].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm border border-slate-200/80 bg-white px-2 py-1 text-[10px] font-semibold text-brand-primary-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/features"
                      className="mt-5 inline-flex w-fit text-sm font-semibold text-brand-orange-2 hover:underline"
                    >
                      See all features →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-brand-surface py-14">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-brand-primary">Don&apos;t see your shop type?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-brand-primary-muted">
            If you bill customers and track stock, Mahajaan likely fits. Tell us your workflow — kirana,
            clinic, service counter, or hybrid.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="brand-gradient-orange-h inline-flex rounded-sm px-6 py-3 text-sm font-semibold text-white"
            >
              Talk to us
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex rounded-sm border border-brand-primary/15 bg-white px-6 py-3 text-sm font-semibold text-brand-primary hover:bg-white/90"
            >
              Start free
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
}

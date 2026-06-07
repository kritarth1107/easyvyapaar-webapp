"use client";

import Image from "next/image";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useTranslation } from "@/lib/localization";
import { RotatingDukaan } from "./rotating-dukaan";

const featureIcons = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    accent: "emerald",
    titleKey: "login.featureInventoryTitle" as const,
    descKey: "login.featureInventoryDesc" as const,
    statKey: "login.statSkus" as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M9 5a2 2 0 014 0M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    accent: "amber",
    titleKey: "login.featureBillingTitle" as const,
    descKey: "login.featureBillingDesc" as const,
    statKey: "login.statGst" as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path d="M4 19V5M4 19h16M8 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: "sky",
    titleKey: "login.featureAnalyticsTitle" as const,
    descKey: "login.featureAnalyticsDesc" as const,
    statKey: "login.statCharts" as const,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    accent: "violet",
    titleKey: "login.featureMultiStoreTitle" as const,
    descKey: "login.featureMultiStoreDesc" as const,
    statKey: "login.statOutlets" as const,
  },
] as const;

const accentStyles = {
  emerald: {
    bar: "brand-gradient-orange-h",
    icon: "brand-gradient-orange shadow-lg shadow-brand-orange-2/35",
    chip: "bg-brand-orange-1/20 text-brand-orange-3 ring-brand-orange-1/35",
    hover: "hover:border-brand-orange-1/40 hover:bg-brand-orange-1/[0.08]",
  },
  amber: {
    bar: "brand-gradient-orange-h",
    icon: "brand-gradient-orange shadow-lg shadow-brand-orange-2/35",
    chip: "bg-brand-orange-2/20 text-brand-orange-3 ring-brand-orange-2/35",
    hover: "hover:border-brand-orange-2/40 hover:bg-brand-orange-2/[0.08]",
  },
  sky: {
    bar: "bg-gradient-to-r from-brand-orange-3 to-brand-orange-4",
    icon: "brand-gradient-orange shadow-lg shadow-brand-orange-3/35",
    chip: "bg-brand-orange-3/20 text-brand-orange-1 ring-brand-orange-3/35",
    hover: "hover:border-brand-orange-3/40 hover:bg-brand-orange-3/[0.08]",
  },
  violet: {
    bar: "brand-gradient-orange-h",
    icon: "brand-gradient-orange shadow-lg shadow-brand-orange-4/35",
    chip: "bg-brand-orange-4/20 text-brand-orange-3 ring-brand-orange-4/35",
    hover: "hover:border-brand-orange-3/40 hover:bg-brand-orange-3/[0.08]",
  },
};

export function DecorativePanel() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden min-h-screen w-[90%] overflow-hidden bg-brand-surface lg:flex lg:flex-col">
      {/* Background layers — soft cool surface, distinct from pure-white form panel */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-surface via-slate-100/90 to-brand-surface-warm" />
      <div className="login-panel-glow pointer-events-none absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-brand-orange-1/12 blur-[100px]" />
      <div
        className="login-panel-glow pointer-events-none absolute -right-24 bottom-32 h-[400px] w-[400px] rounded-full bg-brand-primary/8 blur-[90px]"
        style={{ animationDelay: "-3s" }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-brand-orange-2/8 blur-[80px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,31,73,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(3,31,73,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Decorative ERP UI sketch */}
      <div className="pointer-events-none absolute right-8 top-1/2 hidden w-[280px] -translate-y-1/2 opacity-80 xl:block 2xl:right-16">
        <div
          className="login-fade-up rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-brand-primary/5 backdrop-blur-sm"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-primary-muted">
              {t("login.overview")}
            </span>
            <span className="h-2 w-2 rounded-full bg-brand-orange-1" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="login-bar-fill h-full w-[72%] rounded-full brand-gradient-orange-h opacity-90" />
            </div>
            <div className="h-2 w-[80%] rounded-full bg-slate-100">
              <div
                className="login-bar-fill h-full w-[55%] rounded-full bg-gradient-to-r from-brand-primary-light/80 to-brand-primary-mid/80"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
            <div className="h-2 w-[60%] rounded-full bg-slate-100">
              <div
                className="login-bar-fill h-full w-[88%] rounded-full bg-gradient-to-r from-brand-orange-3/80 to-brand-orange-4/80"
                style={{ animationDelay: "0.8s" }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["₹24.5k", "18", "3"].map((val, i) => (
              <div key={val} className="rounded-xs bg-brand-surface px-2 py-2 text-center ring-1 ring-slate-200/80">
                <p className="text-[9px] text-brand-primary-muted">
                  {[t("login.sales"), t("login.orders"), t("login.alerts")][i]}
                </p>
                <p className="text-xs font-bold text-brand-primary">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 flex-col px-12 py-11 xl:px-16 2xl:px-20">
        {/* Header */}
        <Image
          src={BRAND_LOGO}
          alt={t("common.brandName")}
          width={240}
          height={45}
          className="h-11 w-auto self-start object-contain object-left sm:h-12"
          priority
        />

        {/* Hero */}
        <div className="mt-16 max-w-3xl flex-1 pr-4 xl:pr-0">
          <p className="login-fade-up inline-flex items-center gap-2.5 rounded-full border border-brand-orange-1/25 bg-white/70 px-4 py-2 text-xs font-medium text-brand-primary shadow-sm ring-1 ring-brand-orange-1/15 backdrop-blur-sm">
            <span className="login-pulse-dot h-2 w-2 rounded-full bg-brand-orange-1" />
            {t("login.badge")}
          </p>

          <h1
            className="login-fade-up mt-8 text-[2.75rem] font-bold leading-[1.15] tracking-tight text-brand-primary xl:text-5xl"
            style={{ animationDelay: "0.08s" }}
          >
            <span className="login-hero-line">
              <span>{t("login.heroLine1")}</span> <RotatingDukaan />
            </span>
            <span className="mt-1 block text-brand-primary-light">{t("login.heroLine2")}</span>
          </h1>
          <p
            className="login-fade-up mt-6 max-w-xl text-[15px] leading-7 text-slate-600"
            style={{ animationDelay: "0.16s" }}
          >
            {t("login.heroSubtitle")}
          </p>
        </div>

        {/* Bottom feature strip */}
        <div className="login-fade-up mt-auto pt-8" style={{ animationDelay: "0.28s" }}>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary-muted">
                {t("login.platformModules")}
              </p>
              <p className="mt-1 text-sm text-slate-600">{t("login.platformSubtitle")}</p>
            </div>
            <div className="hidden items-center gap-1.5 rounded-xs bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200/80 sm:flex">
              <span className="login-pulse-dot-green h-1.5 w-1.5 rounded-xs bg-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-700">
                {t("login.allOperational")}
              </span>
            </div>
          </div>

          <div className="relative rounded-xs bg-gradient-to-b from-brand-orange-1/20 via-slate-200/60 to-transparent p-px shadow-[0_20px_60px_-16px_rgba(3,31,73,0.12)]">
            <div className="overflow-hidden rounded-xs bg-white/95 shadow-sm backdrop-blur-xl">
              <ul className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                {featureIcons.map((feature, i) => {
                  const style = accentStyles[feature.accent];
                  return (
                    <li
                      key={feature.titleKey}
                      className={`login-feature-card group relative flex flex-col p-5 transition-all duration-300 ${style.hover}`}
                      style={{ animationDelay: `${0.35 + i * 0.07}s` }}
                    >
                      <div className={`absolute inset-x-0 top-0 h-[2px] ${style.bar} opacity-80`} />
                      <div className="login-card-shine pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xs text-white ${style.icon}`}
                        >
                          {feature.icon}
                        </div>
                        <span
                          className={`shrink-0 rounded-xs px-2 py-0.5 text-[10px] font-semibold ring-1 ${style.chip}`}
                        >
                          {t(feature.statKey)}
                        </span>
                      </div>

                      <p className="mt-4 text-[15px] font-semibold leading-snug text-brand-primary">
                        {t(feature.titleKey)}
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.55] text-slate-600">
                        {t(feature.descKey)}
                      </p>

                      <div className="mt-4 flex items-center gap-1 text-[11px] font-medium text-brand-primary-muted transition-colors group-hover:text-brand-primary">
                        <span>{t("login.exploreModule")}</span>
                        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden>
                          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
     
        </div>
      </div>
    </div>
  );
}

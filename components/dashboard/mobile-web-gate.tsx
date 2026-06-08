"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  APP_STORE_BADGE,
  BRAND_LOGO,
  GOOGLE_PLAY_BADGE,
} from "@/lib/brand/assets";
import { LOGIN_PATH } from "@/lib/auth/session";
import { useTranslation } from "@/lib/localization";

type MobileWebGateProps = {
  hasSession?: boolean;
};

function FeaturePill({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-brand-surface/80 px-3 py-2.5 text-left text-sm text-brand-primary ring-1 ring-slate-200/70">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-orange-1/12 text-brand-orange-2">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
          <path
            fillRule="evenodd"
            d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      {text}
    </li>
  );
}

export function MobileWebGate({ hasSession = false }: MobileWebGateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const features = [
    t("dashboard.mobileGate.featureBilling"),
    t("dashboard.mobileGate.featureStock"),
    t("dashboard.mobileGate.featureReports"),
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/authentication/logout", { method: "POST" });
      router.push(LOGIN_PATH);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-brand-surface via-white to-brand-surface-warm px-5 py-6">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand-orange-1/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-1/4 h-40 w-40 rounded-full bg-brand-primary/6 blur-3xl" />

      {hasSession && (
        <div className="relative z-10 flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-sm border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-semibold text-brand-primary shadow-sm backdrop-blur-sm disabled:opacity-60"
          >
            {loggingOut ? t("common.pleaseWait") : t("dashboard.accountLogout")}
          </button>
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-4 text-center">
        <Image
          src={BRAND_LOGO}
          alt={t("common.brandName")}
          width={190}
          height={36}
          className="mb-6 h-10 w-auto object-contain"
          priority
        />

        <div className="w-full rounded-3xl border border-white/90 bg-white/80 p-6 shadow-[0_16px_48px_-16px_rgba(3,31,73,0.12)] backdrop-blur-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange-1/20 bg-brand-orange-1/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-orange-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange-1" />
            {t("dashboard.mobileGate.badge")}
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-primary">
            {t("dashboard.mobileGate.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("dashboard.mobileGate.subtitle")}</p>

          <ul className="mt-5 space-y-2">
            {features.map((feature) => (
              <FeaturePill key={feature} text={feature} />
            ))}
          </ul>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-sm font-semibold text-brand-primary">{t("dashboard.mobileGate.downloadHeading")}</p>
            <p className="mt-1 text-sm font-medium text-brand-orange-2">{t("dashboard.mobileGate.comingSoon")}</p>

            <div className="mt-5 flex w-full flex-col gap-3">
              <Image
                src={APP_STORE_BADGE}
                alt="Download on the App Store"
                width={240}
                height={72}
                className="h-14 w-full object-contain"
              />
              <Image
                src={GOOGLE_PLAY_BADGE}
                alt="Get it on Google Play"
                width={270}
                height={80}
                className="h-14 w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

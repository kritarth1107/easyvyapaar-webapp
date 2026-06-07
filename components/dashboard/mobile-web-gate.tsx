"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { LOGIN_PATH } from "@/lib/auth/session";
import { useTranslation } from "@/lib/localization";

type MobileWebGateProps = {
  hasSession?: boolean;
};

function StoreBadge({
  label,
  platform,
  comingSoonLabel,
}: {
  label: string;
  platform: "android" | "ios";
  comingSoonLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-primary">
        {platform === "android" ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 00-.83.22l-1.88 3.24a11.43 11.43 0 00-8.94 0L5.65 5.67a.643.643 0 00-.87-.2.568.568 0 00-.22.83l1.84 3.18C2.92 11.03 1 14.22 1 17.88h22c0-3.66-1.92-6.85-5.4-8.4zM7 20.1c0 .55.45 1 1 1s1-.45 1-1v-2.9c0-.55-.45-1-1-1s-1 .45-1 1v2.9zm8 0c0 .55.45 1 1 1s1-.45 1-1v-2.9c0-.55-.45-1-1-1s-1 .45-1 1v2.9z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.24-.04-.43 0-1.1.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.06.28.06.44zm.198 3.01c-1.88-.1-3.47 1.08-4.35 1.08-.9 0-2.26-1.03-3.71-1.01-1.91.03-3.67 1.11-4.64 2.82-1.98 3.43-.51 8.52 1.42 11.3.95 1.37 2.08 2.91 3.57 2.85 1.43-.06 1.97-.92 3.7-.92 1.73 0 2.22.92 3.74.89 1.55-.03 2.52-1.39 3.46-2.77 1.09-1.59 1.54-3.13 1.56-3.21-.03-.01-3.01-1.16-3.04-4.58-.03-2.87 2.35-4.25 2.46-4.32-1.34-1.96-3.42-2.21-4.15-2.25z" />
          </svg>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-sm font-semibold text-brand-primary">{label}</p>
        <p className="text-xs text-brand-primary-muted">{platform === "android" ? "Google Play" : "App Store"}</p>
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-brand-orange-1/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-orange-2 ring-1 ring-brand-orange-1/20">
        {comingSoonLabel}
      </span>
    </div>
  );
}

export function MobileWebGate({ hasSession = false }: MobileWebGateProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-brand-surface via-white to-brand-surface-warm px-5 py-6">
      {hasSession && (
        <div className="absolute right-4 top-4 z-10">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-primary shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {loggingOut ? t("common.pleaseWait") : t("dashboard.accountLogout")}
          </button>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <Image
          src={BRAND_LOGO}
          alt={t("common.brandName")}
          width={200}
          height={38}
          className="mb-8 h-10 w-auto self-start object-contain"
          priority
        />

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/5 ring-1 ring-brand-primary/10">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-brand-primary" aria-hidden>
            <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 8h4M17 8h4M3 16h4M17 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-brand-orange-2">
          {t("dashboard.mobileGate.badge")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-primary">
          {t("dashboard.mobileGate.title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{t("dashboard.mobileGate.subtitle")}</p>
        <p className="mt-2 text-sm font-medium text-brand-primary">{t("dashboard.mobileGate.desktopOnly")}</p>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-semibold text-brand-primary">{t("dashboard.mobileGate.appBuilding")}</p>
          <p className="text-sm text-slate-600">{t("dashboard.mobileGate.appLaunch")}</p>
          <StoreBadge
            label={t("dashboard.mobileGate.android")}
            platform="android"
            comingSoonLabel={t("dashboard.comingSoon")}
          />
          <StoreBadge
            label={t("dashboard.mobileGate.ios")}
            platform="ios"
            comingSoonLabel={t("dashboard.comingSoon")}
          />
        </div>
      </div>
    </div>
  );
}

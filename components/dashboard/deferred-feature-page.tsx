"use client";

import Link from "next/link";
import { useTranslation, type TranslationKey } from "@/lib/localization";

type DeferredFeaturePageProps = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  backHref?: string;
};

export function DeferredFeaturePage({
  titleKey,
  descriptionKey,
  backHref = "/dashboard",
}: DeferredFeaturePageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border border-slate-200/90 bg-white px-8 py-10 shadow-sm">
        <span className="inline-flex rounded-full bg-brand-orange-1/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-orange-2">
          {t("dashboard.comingSoon")}
        </span>
        <h1 className="mt-4 text-xl font-bold text-brand-primary">{t(titleKey)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(descriptionKey)}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-sm bg-brand-primary px-5 text-sm font-semibold text-white hover:opacity-95"
        >
          {t("common.back")}
        </Link>
      </div>
    </div>
  );
}

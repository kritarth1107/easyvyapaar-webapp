"use client";

import Image from "next/image";
import { BRAND_LOGO } from "@/lib/brand/assets";
import { useTranslation } from "@/lib/localization";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-brand-orange-2" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function RegisterSidebar() {
  const { t } = useTranslation();

  const features = [
    t("sidebar.feature1"),
    t("sidebar.feature2"),
    t("sidebar.feature3"),
    t("sidebar.feature4"),
    t("sidebar.feature5"),
  ];

  return (
    <aside className="hidden w-[30%] min-w-[300px] max-w-[440px] flex-col justify-start bg-brand-surface px-12 py-12 lg:flex lg:px-16 xl:px-20 2xl:px-24">
      <div className="w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 shrink-0 items-center justify-center rounded-xs">
            <Image
              src={BRAND_LOGO}
              alt={t("common.brandName")}
              width={100}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-brand-primary">{t("common.brandName")}</span>
        </div>

        <h2 className="mt-10 text-2xl font-bold leading-snug text-brand-primary">
          {t("sidebar.title")}
        </h2>

        <p className="mt-6 text-sm font-semibold text-brand-primary-light">
          {t("sidebar.featuresTitle")}
        </p>
        <ul className="mt-4 space-y-3">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-brand-primary-mid">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-16 text-xs text-brand-primary-muted">{t("sidebar.trusted")}</p>
    </aside>
  );
}

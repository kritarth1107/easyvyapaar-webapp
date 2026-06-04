"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  APP_LANGUAGES,
  APP_LANGUAGE_FONT,
  useTranslation,
  type LocaleCode,
} from "@/lib/localization";

const LOADING_MS = 2000;
const CYCLE_MS = 160;

type LanguageChangeOverlayProps = {
  open: boolean;
  targetLocale: LocaleCode;
  onComplete: () => void;
};

export function LanguageChangeOverlay({
  open,
  targetLocale,
  onComplete,
}: LanguageChangeOverlayProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const targetIndex = Math.max(
      0,
      APP_LANGUAGES.findIndex((l) => l.code === targetLocale)
    );
    setIndex(targetIndex);

    let i = targetIndex;
    const cycle = window.setInterval(() => {
      i = (i + 1) % APP_LANGUAGES.length;
      setIndex(i);
    }, CYCLE_MS);

    const done = window.setTimeout(() => {
      setIndex(targetIndex);
      onComplete();
    }, LOADING_MS);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(done);
      document.body.style.overflow = prev;
    };
  }, [open, targetLocale, onComplete]);

  if (!open || !mounted) return null;

  const lang = APP_LANGUAGES[index] ?? APP_LANGUAGES[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-primary/55 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={t("dashboard.switchingLanguage")}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 rounded-full border-2 border-brand-orange-1/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand-orange-1 border-r-brand-orange-2" />
          <span
            key={lang.code}
            className="language-cycle-word absolute inset-0 flex items-center justify-center text-lg font-bold text-brand-primary"
            style={{ fontFamily: APP_LANGUAGE_FONT[lang.code] }}
            lang={lang.code}
          >
            {lang.native.charAt(0)}
          </span>
        </div>

        <p
          key={`label-${lang.code}`}
          className="language-cycle-word mt-6 text-2xl font-bold text-brand-primary"
          style={{ fontFamily: APP_LANGUAGE_FONT[lang.code] }}
          lang={lang.code}
        >
          {lang.native}
        </p>
        <p className="mt-1 text-sm font-medium text-brand-primary-muted">{lang.label}</p>

        <p className="mt-5 text-base font-semibold text-brand-primary">
          {t("dashboard.switchingLanguage")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {t("dashboard.switchingLanguageHint")}
        </p>

        <div className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="language-change-progress h-full rounded-full bg-gradient-to-r from-brand-orange-2 to-brand-orange-1" />
        </div>
      </div>
    </div>,
    document.body
  );
}

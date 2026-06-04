"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LanguageChangeOverlay } from "@/components/dashboard/language-change-overlay";
import {
  APP_LANGUAGES,
  APP_LANGUAGE_FONT,
  useTranslation,
  type LocaleCode,
} from "@/lib/localization";

type LanguageSelectModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LanguageSelectModal({ open, onClose }: LanguageSelectModalProps) {
  const { t, locale, setLocale } = useTranslation();
  const [pending, setPending] = useState<LocaleCode>(locale);
  const [mounted, setMounted] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setPending(locale);
  }, [open, locale]);

  useEffect(() => {
    if (!open || changing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, changing, onClose]);

  useEffect(() => {
    if (!open) setChanging(false);
  }, [open]);

  const finishLanguageChange = useCallback(() => {
    setLocale(pending);
    setChanging(false);
    onClose();
  }, [pending, setLocale, onClose]);

  if (!mounted) return null;

  if (changing) {
    return (
      <LanguageChangeOverlay
        open
        targetLocale={pending}
        onComplete={finishLanguageChange}
      />
    );
  }

  if (!open) return null;

  function apply() {
    if (pending === locale) return;
    setChanging(true);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-brand-primary/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="language-modal-title" className="text-lg font-bold text-brand-primary">
          {t("register.language.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t("register.language.subtitle")}</p>

        <div className="mt-5 grid max-h-[min(50vh,320px)] grid-cols-2 gap-3 overflow-y-auto scrollbar-brand sm:grid-cols-3">
          {APP_LANGUAGES.map((lang) => {
            const selected = pending === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setPending(lang.code)}
                className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors ${
                  selected
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-slate-200/90 text-brand-primary hover:border-brand-orange-1/50 hover:bg-brand-surface-warm"
                }`}
                style={{ fontFamily: APP_LANGUAGE_FONT[lang.code] }}
                lang={lang.code}
                aria-pressed={selected}
              >
                <span className="block">{lang.native}</span>
                <span
                  className={`mt-0.5 block text-[11px] font-medium ${selected ? "text-white/70" : "text-slate-500"}`}
                >
                  {lang.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200/90 px-4 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-slate-50"
          >
            {t("common.back")}
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={pending === locale}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-orange-2 to-brand-orange-1 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {t("dashboard.languageModalApply")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

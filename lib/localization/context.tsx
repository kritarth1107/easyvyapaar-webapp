"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readStoredLocale, writeStoredLocale } from "./storage";
import { translate } from "./translate";
import { DEFAULT_LOCALE } from "./types";
import type { LocaleCode, TranslationKey } from "./types";

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: TranslationKey) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    writeStoredLocale(next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, ready } = useLocale();
  return { t, locale, setLocale, ready };
}

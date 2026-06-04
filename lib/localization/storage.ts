import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocaleCode } from "./languages";
import type { LocaleCode } from "./types";

export function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored =
      localStorage.getItem(LOCALE_STORAGE_KEY) ??
      localStorage.getItem("easydukaan.locale");
    if (stored && isLocaleCode(stored)) return stored;
  } catch {
    /* ignore quota / private mode */
  }

  return DEFAULT_LOCALE;
}

export function writeStoredLocale(locale: LocaleCode): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

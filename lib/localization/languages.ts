import {
  DEFAULT_LOCALE,
  PREFERRED_LANGUAGE_CODES,
  type LocaleCode,
  type PreferredLanguageCode,
} from "./types";

export { DEFAULT_LOCALE, PREFERRED_LANGUAGE_CODES };
export type { LocaleCode, PreferredLanguageCode };

export const LOCALE_STORAGE_KEY = "easyvyapaar.locale";

export const APP_LANGUAGES: ReadonlyArray<{
  code: LocaleCode;
  label: string;
  native: string;
}> = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ur", label: "Urdu", native: "اردو" },
] as const;

export const APP_LANGUAGE_FONT: Record<LocaleCode, string> = {
  en: "var(--font-geist-sans), system-ui, sans-serif",
  hi: "var(--font-dukaan-deva), sans-serif",
  gu: "var(--font-dukaan-gu), sans-serif",
  mr: "var(--font-dukaan-deva), sans-serif",
  pa: "var(--font-dukaan-pa), sans-serif",
  ta: "var(--font-dukaan-ta), sans-serif",
  te: "var(--font-dukaan-te), sans-serif",
  ml: "var(--font-dukaan-ml), sans-serif",
  bn: "var(--font-dukaan-deva), sans-serif",
  kn: "var(--font-dukaan-deva), sans-serif",
  ur: "var(--font-dukaan-ur), sans-serif",
};

export function isLocaleCode(value: string): value is LocaleCode {
  return (PREFERRED_LANGUAGE_CODES as readonly string[]).includes(value);
}

export function isPreferredLanguageCode(
  value: string
): value is PreferredLanguageCode {
  return isLocaleCode(value);
}

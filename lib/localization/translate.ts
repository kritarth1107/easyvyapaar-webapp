import { allMessages } from "./messages/locales";
import { DEFAULT_LOCALE } from "./types";
import type { LocaleCode, MessageTree, TranslationKey } from "./types";

function getByPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = tree;

  for (const part of parts) {
    if (current === null || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function translate(locale: LocaleCode, key: TranslationKey): string {
  const primary = getByPath(allMessages[locale], key);
  if (primary) return primary;

  if (locale !== DEFAULT_LOCALE) {
    const fallback = getByPath(allMessages[DEFAULT_LOCALE], key);
    if (fallback) return fallback;
  }

  return key;
}

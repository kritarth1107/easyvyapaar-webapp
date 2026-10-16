import type { TranslationKey } from "@/lib/localization";

/** 409 from the backend: the record changed (another user/tab) since it was loaded. */
export class ConflictError extends Error {
  constructor(message?: string) {
    super(message || "This record was changed by someone else. Reload and try again.");
    this.name = "ConflictError";
  }
}

export function throwIfConflict(res: Response, backendMessage?: string | null): void {
  if (res.status === 409) throw new ConflictError(backendMessage ?? undefined);
}

/** UI message for a failed save: localized conflict text for 409, else the error's own message. */
export function saveErrorMessage(err: unknown, t: (key: TranslationKey) => string, fallback: string): string {
  if (err instanceof ConflictError) return t("dashboard.editConflict.message");
  return err instanceof Error && err.message ? err.message : fallback;
}

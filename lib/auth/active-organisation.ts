import type { OrganisationSummary } from "@/lib/types/user-api";

export const ACTIVE_ORGANISATION_STORAGE_KEY = "easydukan_active_organisation_id";

export function getStoredActiveOrganisationId(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ACTIVE_ORGANISATION_STORAGE_KEY);
  return value?.trim() ? value : null;
}

export function setStoredActiveOrganisationId(organisationId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ORGANISATION_STORAGE_KEY, organisationId);
}

export function clearStoredActiveOrganisationId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_ORGANISATION_STORAGE_KEY);
}

export function findOrganisationInList(
  organisationId: string,
  organisations: OrganisationSummary[]
): OrganisationSummary | undefined {
  return organisations.find((o) => o.orgId === organisationId);
}

/**
 * After login OTP: reuse stored org if still valid; auto-pick when only one; else prompt.
 */
export function resolvePostLoginOrganisation(organisations: OrganisationSummary[]): {
  needsSelection: boolean;
  activeOrganisationId: string | null;
} {
  if (!organisations.length) {
    return { needsSelection: false, activeOrganisationId: null };
  }

  const stored = getStoredActiveOrganisationId();
  if (stored && findOrganisationInList(stored, organisations)) {
    return { needsSelection: false, activeOrganisationId: stored };
  }

  if (organisations.length === 1) {
    setStoredActiveOrganisationId(organisations[0].orgId);
    return { needsSelection: false, activeOrganisationId: organisations[0].orgId };
  }

  return { needsSelection: true, activeOrganisationId: null };
}

export function syncActiveOrganisationFromProfile(
  organisations: OrganisationSummary[],
  defaultOrganisationId?: string
): string | null {
  const stored = getStoredActiveOrganisationId();
  if (stored && findOrganisationInList(stored, organisations)) {
    return stored;
  }

  if (organisations.length === 1) {
    setStoredActiveOrganisationId(organisations[0].orgId);
    return organisations[0].orgId;
  }

  if (defaultOrganisationId && findOrganisationInList(defaultOrganisationId, organisations)) {
    setStoredActiveOrganisationId(defaultOrganisationId);
    return defaultOrganisationId;
  }

  return null;
}

import { normalizeOrganisationProfile } from "@/lib/api/business-profile";
import type { OrganisationProfile } from "@/lib/types/business-profile-api";

function extractApiError(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error === "object" && error !== null) {
    const details = (error as Record<string, unknown>).details;
    if (typeof details === "string" && details.trim()) return details.trim();
  }
  const message = record.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  return null;
}

export async function fetchBusinessProfile(
  organisationId: string,
): Promise<OrganisationProfile> {
  const res = await fetch(
    `/api/business/profile?organisationId=${encodeURIComponent(organisationId)}`,
    { cache: "no-store" },
  );
  const body: unknown = await res.json();
  if (!res.ok) {
    throw new Error(extractApiError(body) ?? "Failed to load business profile");
  }

  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  const profile = normalizeOrganisationProfile(root?.data ?? body);
  if (!profile) {
    throw new Error("Failed to load business profile");
  }
  return profile;
}

import { normalizeOrganisationProfile } from "@/lib/api/business-profile";
import { extractBackendError } from "@/lib/api/inventory";
import type { OrganisationProfile } from "@/lib/types/business-profile-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function uploadBusinessLogo(
  organisationId: string,
  file: File,
): Promise<OrganisationProfile> {
  const formData = new FormData();
  formData.append("logo", file);

  const res = await fetch(
    `/api/business/profile/logo?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "POST", body: formData },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to upload logo");
  }

  const profile = normalizeOrganisationProfile(
    typeof body === "object" && body !== null && "data" in body
      ? (body as { data?: unknown }).data
      : body,
  );
  if (!profile) {
    throw new Error("Failed to upload logo");
  }
  return profile;
}

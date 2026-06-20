import { extractBackendError } from "@/lib/api/inventory";
import type { OrganisationType } from "@/lib/constants/organisation-types";
import type { IndustryType } from "@/lib/constants/industry-types";

export type BusinessCreationEligibility = {
  canCreate: boolean;
  ownedCount: number;
  maxBusinesses: number;
  unlimited: boolean;
  message?: string;
  upgradePlanHint: string;
};

export type CreateBusinessRequest = {
  organisationName: string;
  organisationType: OrganisationType;
  industryType: IndustryType;
  gstin?: string;
};

export type CreateBusinessResponse = {
  organisationId: string;
  name: string;
  organisationType: OrganisationType;
  industryType: IndustryType;
  gstVerified: boolean;
  gstDataMatch: boolean;
};

function unwrapData<T>(body: unknown): T | null {
  const root =
    typeof body === "object" && body !== null
      ? (body as { data?: unknown; success?: boolean })
      : null;
  if (root?.success === true && root.data !== undefined) {
    return root.data as T;
  }
  return null;
}

export async function fetchBusinessCreationEligibility(): Promise<BusinessCreationEligibility> {
  const res = await fetch("/api/user/business-creation-eligibility", { cache: "no-store" });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to check plan limits");
  }
  const data = unwrapData<BusinessCreationEligibility>(body);
  if (!data) throw new Error("Invalid eligibility response");
  return data;
}

export async function createAdditionalBusiness(
  payload: CreateBusinessRequest,
): Promise<CreateBusinessResponse> {
  const res = await fetch("/api/user/organisations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create business");
  }
  const data = unwrapData<CreateBusinessResponse>(body);
  if (!data) throw new Error("Invalid create business response");
  return data;
}

import { extractBackendError } from "@/lib/api/inventory";
import { normalizeUserMeData } from "@/lib/api/user-me";
import type { UserMeData } from "@/lib/types/user-api";
import type {
  LeaveOrganisationResponse,
  MobileChangeOtpInitResponse,
  OrganisationMembership,
  OrganisationMembershipsResponse,
  UpdateUserProfileRequest,
  VerifyMobileChangeResponse,
} from "@/lib/types/user-settings-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeMembership(raw: unknown): OrganisationMembership | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const orgId = typeof row.orgId === "string" ? row.orgId : undefined;
  const name = typeof row.name === "string" ? row.name : undefined;
  const userRole = typeof row.userRole === "string" ? row.userRole : "Member";
  if (!orgId || !name) return null;
  return {
    orgId,
    name,
    logo: typeof row.logo === "string" ? row.logo : undefined,
    userRole,
    isDefault: Boolean(row.isDefault),
    canLeave: Boolean(row.canLeave),
    leaveBlockedReason:
      typeof row.leaveBlockedReason === "string" ? row.leaveBlockedReason : undefined,
  };
}

export async function updateUserProfile(
  payload: UpdateUserProfileRequest,
  organisationId?: string | null,
): Promise<UserMeData> {
  const search = organisationId?.trim()
    ? `?organisationId=${encodeURIComponent(organisationId.trim())}`
    : "";
  const res = await fetch(`/api/user/me${search}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update profile");
  }
  const data = normalizeUserMeData((body as { data?: unknown }).data, organisationId);
  if (!data) throw new Error("Failed to update profile");
  return data;
}

export async function fetchOrganisationMemberships(): Promise<OrganisationMembership[]> {
  const res = await fetch("/api/user/organisation-memberships", { cache: "no-store" });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load organisations");
  }
  const data = (body as { data?: OrganisationMembershipsResponse }).data;
  if (!data?.memberships) return [];
  return data.memberships
    .map((row) => normalizeMembership(row))
    .filter((row): row is OrganisationMembership => row !== null);
}

export async function requestMobileChangeOtp(newMobile: string): Promise<MobileChangeOtpInitResponse> {
  const res = await fetch("/api/user/me/mobile/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newMobile }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send OTP");
  }
  const data = (body as { data?: MobileChangeOtpInitResponse }).data;
  if (!data?.verificationToken) throw new Error("Failed to send OTP");
  return data;
}

export async function verifyMobileChangeOtp(
  verificationToken: string,
  otp: string,
  organisationId?: string | null,
): Promise<VerifyMobileChangeResponse> {
  const search = organisationId?.trim()
    ? `?organisationId=${encodeURIComponent(organisationId.trim())}`
    : "";
  const res = await fetch(`/api/user/me/mobile/verify-otp${search}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verificationToken, otp }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to verify OTP");
  }
  const data = (body as { data?: VerifyMobileChangeResponse }).data;
  const profile = normalizeUserMeData(data?.profile, organisationId);
  if (!profile) throw new Error("Failed to verify OTP");
  return { profile, sessionToken: data?.sessionToken ?? "" };
}

export async function leaveOrganisation(
  organisationId: string,
  activeOrganisationId?: string | null,
): Promise<UserMeData> {
  const search = activeOrganisationId?.trim()
    ? `?organisationId=${encodeURIComponent(activeOrganisationId.trim())}`
    : "";
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/leave${search}`,
    { method: "POST" },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to leave organisation");
  }
  const data = (body as { data?: LeaveOrganisationResponse }).data;
  const profile = normalizeUserMeData(data?.profile, activeOrganisationId);
  if (!profile) throw new Error("Failed to leave organisation");
  return profile;
}

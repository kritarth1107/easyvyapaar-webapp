import { extractBackendError } from "@/lib/api/inventory";
import type { UserRole } from "@/lib/permissions/role-permissions";

export type OrganisationMember = {
  userId: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  joiningStatus: "JOINED" | "PENDING";
  joinedAt: string;
  isSelf: boolean;
};

export type PendingInvite = {
  inviteId: string;
  organisationId: string;
  organisationName: string;
  role: UserRole;
  mobile: string;
  invitedAt: string;
  expiresAt: string;
  type: "membership" | "external";
};

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrganisationMembers(organisationId: string): Promise<{
  members: OrganisationMember[];
  pendingInvites: PendingInvite[];
}> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members`,
    { cache: "no-store" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load team");
  }
  const data = (body as { data?: { members: OrganisationMember[]; pendingInvites: PendingInvite[] } }).data;
  return { members: data?.members ?? [], pendingInvites: data?.pendingInvites ?? [] };
}

export const MOCK_INVITE_CONSENT_OTP = "887766";

export async function requestInviteConsentOtp(
  organisationId: string,
  mobile: string,
  role: UserRole,
): Promise<{ verificationToken: string; mobile: string; role: UserRole }> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/invite/request-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, role }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send consent OTP");
  }
  const data = (body as {
    data?: { verificationToken: string; mobile: string; role: UserRole };
  }).data;
  if (!data?.verificationToken) {
    throw new Error("Invalid response from server");
  }
  return data;
}

export async function verifyInviteConsentOtp(
  organisationId: string,
  verificationToken: string,
  otp: string,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/invite/verify-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationToken, otp }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to verify OTP and send invite");
  }
}

export async function updateMemberRole(
  organisationId: string,
  memberUserId: string,
  role: UserRole,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/${encodeURIComponent(memberUserId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update role");
  }
}

export async function removeOrganisationMember(
  organisationId: string,
  memberUserId: string,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/${encodeURIComponent(memberUserId)}`,
    { method: "DELETE" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to remove member");
  }
}

export async function revokeOrganisationInvite(
  organisationId: string,
  inviteId: string,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/${encodeURIComponent(inviteId)}`,
    { method: "DELETE" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to revoke invite");
  }
}

export async function fetchMyPendingInvites(): Promise<PendingInvite[]> {
  const res = await fetch("/api/user/me/pending-invites", { cache: "no-store" });
  const body = await parseJson(res);
  if (!res.ok) return [];
  return (body as { data?: { invites: PendingInvite[] } }).data?.invites ?? [];
}

export async function acceptOrganisationInvite(organisationId: string): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/accept`,
    { method: "POST" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to accept invite");
  }
}

export async function declineOrganisationInvite(organisationId: string): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/decline`,
    { method: "POST" },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to decline invite");
  }
}

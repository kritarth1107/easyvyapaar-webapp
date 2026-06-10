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

export async function previewInviteMobile(
  organisationId: string,
  mobile: string,
): Promise<{ userExists: boolean; needsProfile: boolean; existingName?: string }> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/invite/preview?mobile=${encodeURIComponent(mobile)}`,
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to check mobile");
  }
  const data = (body as {
    data?: { userExists: boolean; needsProfile: boolean; existingName?: string };
  }).data;
  return {
    userExists: Boolean(data?.userExists),
    needsProfile: Boolean(data?.needsProfile),
    ...(data?.existingName ? { existingName: data.existingName } : {}),
  };
}

export async function requestInviteConsentOtp(
  organisationId: string,
  mobile: string,
  role: UserRole,
  inviteeName?: string,
): Promise<{
  verificationToken: string;
  mobile: string;
  role: UserRole;
  details?: string;
}> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/members/invite/request-otp`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile,
        role,
        ...(inviteeName?.trim() ? { inviteeName: inviteeName.trim() } : {}),
      }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send consent OTP");
  }
  const root = body as {
    data?: { verificationToken: string; mobile: string; role: UserRole };
    details?: string;
    message?: string;
  };
  const data = root.data;
  if (!data?.verificationToken) {
    throw new Error("Invalid response from server");
  }
  const details =
    typeof root.details === "string" && root.details.trim()
      ? root.details.trim()
      : typeof root.message === "string" && root.message.trim()
        ? root.message.trim()
        : undefined;
  return { ...data, ...(details ? { details } : {}) };
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
      credentials: "same-origin",
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
    { method: "DELETE", credentials: "same-origin" },
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
    { method: "DELETE", credentials: "same-origin" },
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

export async function requestInviteActionOtp(
  organisationId: string,
  action: "accept" | "decline",
): Promise<{ verificationToken: string; details?: string }> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/request-action-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send OTP");
  }
  const root = body as {
    data?: { verificationToken: string };
    details?: string;
    message?: string;
  };
  if (!root.data?.verificationToken) {
    throw new Error("Invalid OTP response");
  }
  const details =
    typeof root.details === "string" && root.details.trim()
      ? root.details.trim()
      : typeof root.message === "string" && root.message.trim()
        ? root.message.trim()
        : undefined;
  return { verificationToken: root.data.verificationToken, ...(details ? { details } : {}) };
}

export async function acceptOrganisationInvite(
  organisationId: string,
  verificationToken: string,
  otp: string,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationToken, otp }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to accept invite");
  }
}

export async function declineOrganisationInvite(
  organisationId: string,
  verificationToken: string,
  otp: string,
): Promise<void> {
  const res = await fetch(
    `/api/user/organisations/${encodeURIComponent(organisationId)}/invites/decline`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationToken, otp }),
    },
  );
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to decline invite");
  }
}

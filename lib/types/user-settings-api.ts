import type { UserMeData } from "@/lib/types/user-api";

export type UpdateUserProfileRequest = {
  name?: string;
  email?: string;
  preferredLanguage?: string;
};

export type OrganisationMembership = {
  orgId: string;
  name: string;
  logo?: string;
  userRole: string;
  isDefault: boolean;
  canLeave: boolean;
  leaveBlockedReason?: string;
};

export type OrganisationMembershipsResponse = {
  memberships: OrganisationMembership[];
};

export type MobileChangeOtpInitResponse = {
  verificationToken: string;
  otpSent: boolean;
  newMobile: string;
};

export type VerifyMobileChangeResponse = {
  profile: UserMeData;
  sessionToken: string;
};

export type LeaveOrganisationResponse = {
  profile: UserMeData;
};

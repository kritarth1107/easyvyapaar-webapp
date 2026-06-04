export interface OrganisationSummary {
  orgId: string;
  name: string;
  logo?: string;
  userRole: string;
}

export interface UserMeData {
  userId: string;
  name: string;
  mobile: string;
  email?: string;
  status: string;
  isMobileVerified: boolean;
  preferredLanguage: string;
  defaultOrganisationId?: string;
  defaultOrganisation?: OrganisationSummary;
  organisations: OrganisationSummary[];
}

export interface UserMeSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: UserMeData;
}

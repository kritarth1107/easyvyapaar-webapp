import type { IndustryType } from "@/lib/constants/industry-types";
import type { OrganisationType } from "@/lib/constants/organisation-types";

export interface OrganisationSummary {
  orgId: string;
  name: string;
  logo?: string;
  userRole: string;
  gstNumber?: string | null;
  pan?: string | null;
  organisationType?: OrganisationType | string | null;
  industryType?: IndustryType | string | null;
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
  /** Resolved active shop — default org when no organisationId is requested */
  activeOrganisation?: OrganisationSummary | null;
}

export interface UserMeSuccessResponse {
  success: true;
  message: string;
  details: string;
  data: UserMeData;
}

export type OrganisationProfileAddress = {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  stateCode: string;
  pincode: string;
  country: string;
};

export type OrganisationAdditionalDetail = {
  field: string;
  value: string;
};

export type OrganisationProfile = {
  organisationId: string;
  name: string;
  legalName?: string;
  organisationType: string;
  businessCategory?: string;
  industryType?: string;
  businessType?: string[];
  enableTDS?: boolean;
  enableTCS?: boolean;
  additionalDetails?: OrganisationAdditionalDetail[];
  registrationNumber?: string;
  gstin?: string;
  pan?: string;
  gstVerified: boolean;
  gstDataMatch: boolean;
  address: OrganisationProfileAddress;
  logoUrl?: string;
  contactNumber: string;
  alternateContact?: string;
  email?: string;
  website?: string;
  ownerUserId: string;
  status: string;
  currentPlan: string;
  membership?: {
    role: string;
    joinedAt: string;
    isActive: boolean;
    joiningStatus: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type BusinessProfileSuccessResponse = {
  success: true;
  message: string;
  details: string;
  data: OrganisationProfile;
};

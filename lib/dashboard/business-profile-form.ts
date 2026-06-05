import { INDIAN_STATE_CODE_LABELS } from "@/lib/constants/indian-state-codes";
import { INDUSTRY_TYPE_OPTIONS } from "@/lib/constants/industry-types";
import { ORGANISATION_TYPE_LABELS } from "@/lib/constants/organisation-types";
import type { OrganisationSummary } from "@/lib/types/user-api";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const INDUSTRY_TYPE_NONE = "NONE";

export const BUSINESS_TYPES = [
  "Retailer",
  "Wholesaler",
  "Manufacturer",
  "Distributor",
  "Service Provider",
] as const;

export const REGISTRATION_TYPES = [
  "Proprietorship",
  "Partnership",
  "One Person Company",
  "Private Limited",
  "Public Limited",
  "LLP",
  "HUF",
  "Trust",
] as const;

export const ADDITIONAL_DETAIL_TYPES = [
  { value: "website", label: "Website" },
  { value: "msme", label: "MSME Number" },
  { value: "cin", label: "CIN" },
  { value: "udyam", label: "Udyam Registration" },
] as const;

export type AdditionalBusinessDetail = {
  id: string;
  type: string;
  value: string;
};

export type BusinessProfileForm = {
  name: string;
  logoDataUrl: string | null;
  phone: string;
  email: string;
  billingAddress: string;
  state: string;
  pincode: string;
  city: string;
  gstRegistered: boolean;
  gstVerified: boolean;
  gstNumber: string;
  enableEInvoicing: boolean;
  pan: string;
  enableTds: boolean;
  enableTcs: boolean;
  businessTypes: string[];
  industryType: string;
  registrationType: string;
  signatureSource: "desktop" | "draw";
  signatureDataUrl: string | null;
  additionalDetails: AdditionalBusinessDetail[];
};

export const DEFAULT_BUSINESS_PROFILE: BusinessProfileForm = {
  name: "",
  logoDataUrl: null,
  phone: "",
  email: "",
  billingAddress: "",
  state: "",
  pincode: "",
  city: "",
  gstRegistered: true,
  gstVerified: false,
  gstNumber: "",
  enableEInvoicing: false,
  pan: "",
  enableTds: false,
  enableTcs: false,
  businessTypes: [],
  industryType: INDUSTRY_TYPE_NONE,
  registrationType: "Proprietorship",
  signatureSource: "desktop",
  signatureDataUrl: null,
  additionalDetails: [],
};

export function buildBusinessProfileFromOrg(
  org: OrganisationSummary | null | undefined,
): BusinessProfileForm {
  if (!org) {
    return { ...DEFAULT_BUSINESS_PROFILE };
  }

  const registrationType =
    org.organisationType && org.organisationType in ORGANISATION_TYPE_LABELS
      ? ORGANISATION_TYPE_LABELS[org.organisationType as keyof typeof ORGANISATION_TYPE_LABELS]
      : DEFAULT_BUSINESS_PROFILE.registrationType;

  return {
    ...DEFAULT_BUSINESS_PROFILE,
    name: org.name || "",
    logoDataUrl: org.logo ?? null,
    gstNumber: org.gstNumber ?? "",
    pan: org.pan ?? "",
    gstRegistered: Boolean(org.gstNumber),
    registrationType,
  };
}

export const INDUSTRY_OPTIONS = [
  { value: INDUSTRY_TYPE_NONE, label: "None" },
  ...INDUSTRY_TYPE_OPTIONS,
];

export const STATE_OPTIONS = Object.values(INDIAN_STATE_CODE_LABELS)
  .sort((a, b) => a.localeCompare(b))
  .map((label) => ({ value: label, label }));

export const REGISTRATION_OPTIONS = REGISTRATION_TYPES.map((r) => ({
  value: r,
  label: r,
}));

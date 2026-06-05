import { stateCodeToLabel, stateLabelToCode } from "@/lib/constants/indian-state-codes";
import { ORGANISATION_TYPE_LABELS, type OrganisationType } from "@/lib/constants/organisation-types";
import {
  ADDITIONAL_DETAIL_TYPES,
  DEFAULT_BUSINESS_PROFILE,
  INDUSTRY_TYPE_NONE,
  type AdditionalBusinessDetail,
  type BusinessProfileForm,
} from "@/lib/dashboard/business-profile-form";
import type { OrganisationProfile } from "@/lib/types/business-profile-api";

const ADDITIONAL_FIELD_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  CIN: "CIN",
  MSME: "MSME Number",
  UDYAM: "Udyam Registration",
  NAME_OTHER: "Other",
};

const BACKEND_BUSINESS_TYPE_LABELS: Record<string, string> = {
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  MANUFACTURER: "Manufacturer",
  DISTRIBUTOR: "Distributor",
  SERVICE_PROVIDER: "Service Provider",
  OTHER: "Other",
};

const FORM_BUSINESS_TYPE_TO_BACKEND: Record<string, string> = {
  Retailer: "RETAILER",
  Wholesaler: "WHOLESALER",
  Manufacturer: "MANUFACTURER",
  Distributor: "DISTRIBUTOR",
  "Service Provider": "SERVICE_PROVIDER",
};

const DETAIL_LABEL_TO_FIELD: Record<string, string> = {
  Website: "WEBSITE",
  CIN: "CIN",
  "MSME Number": "MSME",
  "Udyam Registration": "UDYAM",
  Other: "NAME_OTHER",
};

export type UpdateOrganisationPayload = {
  name?: string;
  industryType?: string;
  businessType?: string[];
  enableTDS?: boolean;
  enableTCS?: boolean;
  additionalDetails?: { field: string; value: string }[];
  gstin?: string;
  pan?: string;
  address?: {
    line1?: string;
    line2?: string;
    landmark?: string;
    city?: string;
    stateCode?: string;
    pincode?: string;
    country?: string;
  };
  contactNumber?: string;
  email?: string;
  website?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function normalizeAddress(raw: unknown): OrganisationProfile["address"] | null {
  const a = asRecord(raw);
  if (!a) return null;

  const line1 = pickString(a.line1);
  const city = pickString(a.city);
  const stateCode = pickString(a.stateCode, a.state_code);
  const pincode = pickString(a.pincode);
  const country = pickString(a.country) ?? "IN";

  if (!line1 || !city || !stateCode || !pincode) return null;

  return {
    line1,
    line2: pickString(a.line2),
    landmark: pickString(a.landmark),
    city,
    district: pickString(a.district),
    stateCode,
    pincode,
    country,
  };
}

export function normalizeOrganisationProfile(raw: unknown): OrganisationProfile | null {
  const root = asRecord(raw);
  if (!root) return null;

  const organisationId = pickString(root.organisationId, root.organisation_id, root.orgId);
  const name = pickString(root.name, root.tradeName, root.trade_name);
  const organisationType = pickString(root.organisationType, root.organisation_type);
  const contactNumber = pickString(root.contactNumber, root.contact_number, root.mobile);
  const address = normalizeAddress(root.address);

  if (!organisationId || !name || !organisationType || !contactNumber || !address) {
    return null;
  }

  const additionalDetailsRaw = root.additionalDetails ?? root.additional_details;
  const additionalDetails = Array.isArray(additionalDetailsRaw)
    ? additionalDetailsRaw
        .map((item) => {
          const d = asRecord(item);
          if (!d) return null;
          const field = pickString(d.field);
          const value = pickString(d.value);
          if (!field || !value) return null;
          return { field, value };
        })
        .filter((item): item is { field: string; value: string } => item !== null)
    : undefined;

  const businessTypeRaw = root.businessType ?? root.business_type;
  const businessType = Array.isArray(businessTypeRaw)
    ? businessTypeRaw.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : undefined;

  return {
    organisationId,
    name,
    legalName: pickString(root.legalName, root.legal_name),
    organisationType,
    businessCategory: pickString(root.businessCategory, root.business_category),
    industryType: pickString(root.industryType, root.industry_type),
    businessType,
    enableTDS: Boolean(root.enableTDS ?? root.enableTds ?? root.enable_tds),
    enableTCS: Boolean(root.enableTCS ?? root.enableTcs ?? root.enable_tcs),
    additionalDetails,
    registrationNumber: pickString(root.registrationNumber, root.registration_number),
    gstin: pickString(root.gstin, root.gstIN, root.GSTIN),
    pan: pickString(root.pan, root.PAN),
    gstVerified: Boolean(root.gstVerified ?? root.gst_verified),
    gstDataMatch: Boolean(root.gstDataMatch ?? root.gst_data_match),
    address,
    logoUrl: pickString(root.logoUrl, root.logo_url, root.logo),
    contactNumber,
    alternateContact: pickString(root.alternateContact, root.alternate_contact),
    email: pickString(root.email),
    website: pickString(root.website),
    ownerUserId: pickString(root.ownerUserId, root.owner_user_id) ?? "",
    status: pickString(root.status) ?? "ACTIVE",
    currentPlan: pickString(root.currentPlan, root.current_plan) ?? "FREE",
  };
}

function formatBillingAddress(address: OrganisationProfile["address"]): string {
  return [address.line1, address.line2, address.landmark].filter(Boolean).join(", ");
}

function mapAdditionalDetails(
  profile: OrganisationProfile,
): AdditionalBusinessDetail[] {
  const items: AdditionalBusinessDetail[] = (profile.additionalDetails ?? []).map(
    (detail, index) => ({
      id: `${detail.field}-${index}`,
      type: ADDITIONAL_FIELD_LABELS[detail.field] ?? detail.field,
      value: detail.value,
    }),
  );

  if (
    profile.website &&
    !items.some((item) => item.type.toLowerCase().includes("website"))
  ) {
    items.push({
      id: `website-${items.length}`,
      type: ADDITIONAL_DETAIL_TYPES.find((d) => d.value === "website")?.label ?? "Website",
      value: profile.website,
    });
  }

  return items;
}

export function mapProfileToForm(profile: OrganisationProfile): BusinessProfileForm {
  const orgType = profile.organisationType as OrganisationType;
  const registrationType =
    orgType in ORGANISATION_TYPE_LABELS
      ? ORGANISATION_TYPE_LABELS[orgType]
      : DEFAULT_BUSINESS_PROFILE.registrationType;

  const businessTypes = (profile.businessType ?? [])
    .map((type) => BACKEND_BUSINESS_TYPE_LABELS[type] ?? type)
    .filter(Boolean);

  return {
    name: profile.name,
    logoDataUrl: profile.logoUrl ?? null,
    phone: profile.contactNumber,
    email: profile.email ?? "",
    billingAddress: formatBillingAddress(profile.address),
    state: stateCodeToLabel(profile.address.stateCode),
    pincode: profile.address.pincode,
    city: profile.address.city,
    gstRegistered: Boolean(profile.gstin),
    gstVerified: profile.gstVerified ?? false,
    gstNumber: profile.gstin ?? "",
    enableEInvoicing: false,
    pan: profile.pan ?? "",
    enableTds: profile.enableTDS ?? false,
    enableTcs: profile.enableTCS ?? false,
    businessTypes,
    industryType: profile.industryType?.trim() || INDUSTRY_TYPE_NONE,
    registrationType,
    signatureSource: "desktop",
    signatureDataUrl: null,
    additionalDetails: mapAdditionalDetails(profile),
  };
}

function mapFormAdditionalDetails(form: BusinessProfileForm): {
  additionalDetails: { field: string; value: string }[];
  website?: string;
} {
  const additionalDetails: { field: string; value: string }[] = [];
  let website: string | undefined;

  for (const detail of form.additionalDetails) {
    const value = detail.value.trim();
    if (!value) continue;

    const field =
      DETAIL_LABEL_TO_FIELD[detail.type] ??
      ADDITIONAL_DETAIL_TYPES.find((item) => item.label === detail.type)?.value.toUpperCase();

    if (!field || !["WEBSITE", "CIN", "MSME", "UDYAM", "NAME_OTHER"].includes(field)) {
      continue;
    }

    if (field === "WEBSITE") {
      website = value;
    }

    additionalDetails.push({ field, value });
  }

  return { additionalDetails, website };
}

export function mapFormToUpdatePayload(form: BusinessProfileForm): UpdateOrganisationPayload {
  const payload: UpdateOrganisationPayload = {
    enableTDS: form.enableTds,
    enableTCS: form.enableTcs,
    contactNumber: form.phone.trim(),
    email: form.email.trim() || undefined,
    businessType: form.businessTypes
      .map((type) => FORM_BUSINESS_TYPE_TO_BACKEND[type])
      .filter((type): type is string => Boolean(type)),
  };

  if (!form.gstVerified) {
    const name = form.name.trim();
    if (name.length >= 2) {
      payload.name = name;
    }

    if (form.gstRegistered) {
      const gstin = form.gstNumber.trim().toUpperCase();
      if (gstin) payload.gstin = gstin;
    }

    const pan = form.pan.trim().toUpperCase();
    if (pan) payload.pan = pan;
  }

  if (form.industryType && form.industryType !== INDUSTRY_TYPE_NONE) {
    payload.industryType = form.industryType;
  }

  const stateCode = stateLabelToCode(form.state);
  const billingAddress = form.billingAddress.trim();
  const city = form.city.trim();
  const pincode = form.pincode.trim();

  if (billingAddress || city || pincode || stateCode) {
    payload.address = {
      ...(billingAddress && { line1: billingAddress }),
      ...(city && { city }),
      ...(pincode && { pincode }),
      ...(stateCode && { stateCode }),
      country: "IN",
    };
  }

  const { additionalDetails, website } = mapFormAdditionalDetails(form);
  payload.additionalDetails = additionalDetails;
  if (website) payload.website = website;

  return payload;
}

export function normalizeBusinessProfileResponse(body: unknown): unknown {
  const root = asRecord(body);
  if (!root || root.success !== true) return body;

  const normalized = normalizeOrganisationProfile(root.data);
  if (!normalized) return body;

  return { ...root, data: normalized };
}

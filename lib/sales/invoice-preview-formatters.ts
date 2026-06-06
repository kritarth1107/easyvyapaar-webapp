import { stateCodeToLabel } from "@/lib/constants/indian-state-codes";
import type { OrganisationProfile } from "@/lib/types/business-profile-api";

export function formatGstinOrPanLine(gstin?: string | null, pan?: string | null): string {
  const gst = gstin?.trim();
  if (gst) return `GSTIN: ${gst}`;
  const p = pan?.trim().toUpperCase();
  if (p) return `PAN: ${p}`;
  return "";
}

export function formatOrganisationFullAddress(profile: OrganisationProfile): string {
  const state = stateCodeToLabel(profile.address.stateCode);
  return [
    profile.address.line1,
    profile.address.line2,
    profile.address.landmark,
    profile.address.city,
    state,
    profile.address.pincode,
  ]
    .filter((part) => part?.trim())
    .join(", ");
}

export function organisationPlaceOfSupply(profile: OrganisationProfile): string {
  return stateCodeToLabel(profile.address.stateCode);
}

export type InvoiceOrganisationSnapshot = {
  businessAddress: string;
  businessPhone: string;
  businessTaxLine: string;
  placeOfSupply: string;
};

export function organisationProfileToSnapshot(
  profile: OrganisationProfile,
): InvoiceOrganisationSnapshot {
  return {
    businessAddress: formatOrganisationFullAddress(profile),
    businessPhone: profile.contactNumber.trim(),
    businessTaxLine: formatGstinOrPanLine(profile.gstin, profile.pan),
    placeOfSupply: organisationPlaceOfSupply(profile),
  };
}

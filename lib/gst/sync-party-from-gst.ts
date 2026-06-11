import { extractPanFromGstin } from "@/lib/parties/create-party-form";
import { fetchPartyDetail, updateParty } from "@/lib/parties/parties-api-client";
import { placeOfSupplyFromGstin, resolveStateCodeFromGstin } from "@/lib/gst/gst-state";
import { stateCodeToLabel } from "@/lib/constants/indian-state-codes";
import type { CheckGstSuccessData } from "@/lib/types/auth-api";
import type { PartyDetail } from "@/lib/types/parties-api";
import type { SelectedInvoiceParty } from "@/components/dashboard/sales/party-select-modal";

export function resolvePlaceOfSupplyFromGstLookup(
  data: CheckGstSuccessData,
  gstin: string,
): string {
  if (data.placeOfSupply?.trim()) return data.placeOfSupply.trim();
  if (data.billingStateCode?.trim()) {
    return stateCodeToLabel(data.billingStateCode.trim());
  }
  return placeOfSupplyFromGstin(gstin);
}

export function resolveBillingStateCodeFromGstLookup(
  data: CheckGstSuccessData,
  gstin: string,
): string {
  if (data.billingStateCode?.trim()) return data.billingStateCode.trim().toUpperCase();
  return resolveStateCodeFromGstin(gstin);
}

export async function syncPartyFromGstLookup(
  organisationId: string,
  partyId: string,
  data: CheckGstSuccessData,
  gstin: string,
): Promise<{ party: PartyDetail; selected: SelectedInvoiceParty }> {
  const verifiedGstin = data.gstin?.trim().toUpperCase() || gstin.trim().toUpperCase();
  const tradeName = (data.tradeName ?? data.legalName ?? "").trim();
  const billingAddress = data.billingAddress?.trim() ?? "";
  const billingStateCode = resolveBillingStateCodeFromGstLookup(data, verifiedGstin);
  const placeOfSupply = resolvePlaceOfSupplyFromGstLookup(data, verifiedGstin);
  const pan = extractPanFromGstin(verifiedGstin);

  const detail = await fetchPartyDetail(organisationId, partyId);
  const updated = await updateParty(organisationId, partyId, {
    partyType: detail.partyType,
    partyCategory: detail.partyCategory,
    name: tradeName || detail.name,
    phone: detail.phone,
    email: detail.email,
    billingAddress: billingAddress || detail.billingAddress,
    shippingAddress: billingAddress || detail.shippingAddress || detail.billingAddress,
    creditPeriodDays: detail.creditPeriodDays,
    creditLimit: detail.creditLimit,
    gstin: verifiedGstin,
    ...(pan ? { pan } : detail.pan ? { pan: detail.pan } : {}),
    billingStateCode,
  });

  const selected: SelectedInvoiceParty = {
    partyId: updated.partyId,
    name: updated.name,
    balance: updated.currentBalance,
    ...(updated.phone ? { phone: updated.phone } : {}),
    ...(updated.billingAddress?.trim() ? { billingAddress: updated.billingAddress.trim() } : {}),
    ...(updated.shippingAddress?.trim() ? { shippingAddress: updated.shippingAddress.trim() } : {}),
    gstin: updated.gstin ?? verifiedGstin,
    ...(updated.pan ? { pan: updated.pan } : pan ? { pan } : {}),
    billingStateCode: updated.billingStateCode ?? billingStateCode,
    placeOfSupply,
  };

  return { party: updated, selected };
}

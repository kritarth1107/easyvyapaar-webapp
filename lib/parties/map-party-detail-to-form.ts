import type { EditPartyFormState } from "@/lib/parties/create-party-form";
import {
  PARTY_CUSTOM_FIELD_TYPES,
  type PartyCustomFieldTypeId,
} from "@/lib/parties/party-custom-field-types";
import type { PartyDetail } from "@/lib/types/parties-api";

const KNOWN_FIELD_TYPES = new Set(PARTY_CUSTOM_FIELD_TYPES.map((row) => row.id));

function mapCustomFieldFromApi(
  field: PartyDetail["customFields"][number],
  index: number,
): EditPartyFormState["customFields"][number] {
  const id = `cf-${index}-${field.fieldType}`;
  if (field.fieldType === "other" || !KNOWN_FIELD_TYPES.has(field.fieldType as PartyCustomFieldTypeId)) {
    return {
      id,
      fieldType: "other",
      customLabel: field.fieldLabel,
      value: field.value,
    };
  }
  return {
    id,
    fieldType: field.fieldType as PartyCustomFieldTypeId,
    customLabel: "",
    value: field.value,
  };
}

export function mapPartyDetailToForm(party: PartyDetail): EditPartyFormState {
  const billingAddress = party.billingAddress ?? "";
  const shippingAddress = party.shippingAddress ?? "";

  return {
    partyType: party.partyType,
    partyCategory: party.partyCategory,
    name: party.name,
    phone: party.phone ?? "",
    email: party.email ?? "",
    openingBalance: String(party.openingBalanceAmount),
    openingBalanceType: party.openingBalanceType,
    gstin: party.gstin ?? "",
    pan: party.pan ?? "",
    billingAddress,
    shippingAddress,
    sameAsBilling: billingAddress === shippingAddress,
    creditPeriodDays: String(party.creditPeriodDays),
    creditLimit: String(party.creditLimit),
    contactPersonName: party.contactPersonName ?? "",
    contactPersonDob: party.contactPersonDob ?? "",
    status: party.status,
    bankAccounts:
      party.bankAccounts.length > 0
        ? party.bankAccounts.map((row, index) => ({
            id: row.bankAccountId || `bank-${index}-${row.accountNumber || index}`,
            accountHolderName: row.accountHolderName,
            bankName: row.bankName,
            accountNumber: row.accountNumber,
            ifscCode: row.ifscCode,
            branchName: row.branchName,
            isPrimary: row.isPrimary,
          }))
        : [],
    customFields:
      party.customFields.length > 0
        ? party.customFields.map(mapCustomFieldFromApi)
        : [],
  };
}

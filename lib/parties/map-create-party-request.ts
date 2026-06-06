import type { CreatePartyFormState } from "@/lib/parties/create-party-form";
import {
  CUSTOM_FIELD_TYPE_LABEL_KEYS,
  type PartyCustomFieldTypeId,
} from "@/lib/parties/party-custom-field-types";
import type { CreatePartyRequest } from "@/lib/types/parties-api";
import type { TranslationKey } from "@/lib/localization";

export function mapCreatePartyFormToRequest(
  form: CreatePartyFormState,
  organisationId: string,
  t: (key: TranslationKey) => string,
): CreatePartyRequest {
  const customFields = form.customFields
    .filter((row) => row.fieldType && row.value.trim())
    .map((row) => {
      const fieldType = row.fieldType as PartyCustomFieldTypeId;
      const fieldLabel =
        fieldType === "other"
          ? row.customLabel.trim()
          : t(CUSTOM_FIELD_TYPE_LABEL_KEYS[fieldType]);

      return {
        fieldType,
        fieldLabel,
        value: row.value.trim(),
      };
    })
    .filter((row) => row.fieldLabel);

  return {
    organisationId,
    partyType: form.partyType as CreatePartyRequest["partyType"],
    partyCategory: form.partyCategory.trim(),
    name: form.name.trim(),
    ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    ...(form.email.trim() ? { email: form.email.trim() } : {}),
    openingBalance: Number(form.openingBalance) || 0,
    openingBalanceType: form.openingBalanceType,
    ...(form.gstin.trim() ? { gstin: form.gstin.trim().toUpperCase() } : {}),
    ...(form.pan.trim() ? { pan: form.pan.trim().toUpperCase() } : {}),
    ...(form.billingAddress.trim() ? { billingAddress: form.billingAddress.trim() } : {}),
    ...(form.sameAsBilling
      ? form.billingAddress.trim()
        ? { shippingAddress: form.billingAddress.trim() }
        : {}
      : form.shippingAddress.trim()
        ? { shippingAddress: form.shippingAddress.trim() }
        : {}),
    creditPeriodDays: Number(form.creditPeriodDays) || 0,
    creditLimit: Number(form.creditLimit) || 0,
    ...(form.contactPersonName.trim() ? { contactPersonName: form.contactPersonName.trim() } : {}),
    ...(form.contactPersonDob ? { contactPersonDob: form.contactPersonDob } : {}),
    bankAccounts: form.bankAccounts.map((row) => ({
      accountHolderName: row.accountHolderName,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      ifscCode: row.ifscCode,
      branchName: row.branchName,
      isPrimary: row.isPrimary,
    })),
    customFields,
  };
}

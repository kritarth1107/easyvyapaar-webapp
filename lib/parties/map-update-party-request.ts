import type { EditPartyFormState } from "@/lib/parties/create-party-form";
import {
  CUSTOM_FIELD_TYPE_LABEL_KEYS,
  type PartyCustomFieldTypeId,
} from "@/lib/parties/party-custom-field-types";
import type { UpdatePartyRequest } from "@/lib/types/parties-api";
import type { TranslationKey } from "@/lib/localization";

export function mapUpdatePartyFormToRequest(
  form: EditPartyFormState,
  t: (key: TranslationKey) => string,
): UpdatePartyRequest {
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
    partyType: form.partyType as UpdatePartyRequest["partyType"],
    partyCategory: form.partyCategory.trim(),
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    gstin: form.gstin.trim().toUpperCase(),
    pan: form.pan.trim().toUpperCase(),
    billingAddress: form.billingAddress.trim(),
    shippingAddress: form.sameAsBilling
      ? form.billingAddress.trim()
      : form.shippingAddress.trim(),
    creditPeriodDays: Number(form.creditPeriodDays) || 0,
    creditLimit: Number(form.creditLimit) || 0,
    contactPersonName: form.contactPersonName.trim(),
    ...(form.contactPersonDob ? { contactPersonDob: form.contactPersonDob } : {}),
    status: form.status,
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

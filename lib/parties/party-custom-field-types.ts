import type { TranslationKey } from "@/lib/localization";

export type PartyCustomFieldTypeId =
  | "birthday"
  | "anniversary"
  | "trader_license"
  | "udyam"
  | "drug_license"
  | "fssai"
  | "iec"
  | "msme"
  | "registration_number"
  | "other";

export type PartyCustomFieldInputType = "date" | "text" | "tel";

export type PartyCustomFieldTypeDef = {
  id: PartyCustomFieldTypeId;
  inputType: PartyCustomFieldInputType;
};

export const CUSTOM_FIELD_TYPE_LABEL_KEYS: Record<PartyCustomFieldTypeId, TranslationKey> = {
  birthday: "dashboard.createParty.customFieldTypes.birthday",
  anniversary: "dashboard.createParty.customFieldTypes.anniversary",
  trader_license: "dashboard.createParty.customFieldTypes.trader_license",
  udyam: "dashboard.createParty.customFieldTypes.udyam",
  drug_license: "dashboard.createParty.customFieldTypes.drug_license",
  fssai: "dashboard.createParty.customFieldTypes.fssai",
  iec: "dashboard.createParty.customFieldTypes.iec",
  msme: "dashboard.createParty.customFieldTypes.msme",
  registration_number: "dashboard.createParty.customFieldTypes.registration_number",
  other: "dashboard.createParty.customFieldTypes.other",
};

export const PARTY_CUSTOM_FIELD_TYPES: PartyCustomFieldTypeDef[] = [
  { id: "birthday", inputType: "date" },
  { id: "anniversary", inputType: "date" },
  { id: "trader_license", inputType: "text" },
  { id: "udyam", inputType: "text" },
  { id: "drug_license", inputType: "text" },
  { id: "fssai", inputType: "text" },
  { id: "iec", inputType: "text" },
  { id: "msme", inputType: "text" },
  { id: "registration_number", inputType: "text" },
  { id: "other", inputType: "text" },
];

export type PartyCustomFieldRow = {
  id: string;
  fieldType: PartyCustomFieldTypeId | "";
  customLabel: string;
  value: string;
};

export function createPartyCustomFieldRow(): PartyCustomFieldRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fieldType: "",
    customLabel: "",
    value: "",
  };
}

export function getPartyCustomFieldInputType(
  fieldType: PartyCustomFieldTypeId | "",
): PartyCustomFieldInputType {
  if (!fieldType) return "text";
  const def = PARTY_CUSTOM_FIELD_TYPES.find((row) => row.id === fieldType);
  return def?.inputType ?? "text";
}

export function isPartyCustomFieldDateType(fieldType: PartyCustomFieldTypeId | ""): boolean {
  return getPartyCustomFieldInputType(fieldType) === "date";
}

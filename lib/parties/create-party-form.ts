import type { PartyType } from "@/lib/types/parties-api";
import { type PartyCustomFieldRow } from "@/lib/parties/party-custom-field-types";

export type OpeningBalanceType = "to_collect" | "to_pay";

export type PartyBankAccountRow = {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary: boolean;
};

export type PartyStatus = "ACTIVE" | "INACTIVE";

export type CreatePartyFormState = {
  partyType: PartyType | "";
  partyCategory: string;
  name: string;
  phone: string;
  email: string;
  openingBalance: string;
  openingBalanceType: OpeningBalanceType;
  gstin: string;
  pan: string;
  billingAddress: string;
  shippingAddress: string;
  sameAsBilling: boolean;
  creditPeriodDays: string;
  creditLimit: string;
  contactPersonName: string;
  contactPersonDob: string;
  bankAccounts: PartyBankAccountRow[];
  customFields: PartyCustomFieldRow[];
};

export type EditPartyFormState = CreatePartyFormState & {
  status: PartyStatus;
};

function newBankRow(primary = false): PartyBankAccountRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    isPrimary: primary,
  };
}

export function createInitialPartyForm(): CreatePartyFormState {
  return {
    partyType: "",
    partyCategory: "",
    name: "",
    phone: "",
    email: "",
    openingBalance: "0",
    openingBalanceType: "to_collect",
    gstin: "",
    pan: "",
    billingAddress: "",
    shippingAddress: "",
    sameAsBilling: true,
    creditPeriodDays: "30",
    creditLimit: "0",
    contactPersonName: "",
    contactPersonDob: "",
    bankAccounts: [],
    customFields: [],
  };
}

export function createBankAccountRow(primary = false): PartyBankAccountRow {
  return newBankRow(primary);
}

/** PAN is embedded in GSTIN at positions 3–12 (0-based slice 2:12). */
export function extractPanFromGstin(gstin: string): string | null {
  const normalized = gstin.trim().toUpperCase().replace(/\s/g, "");
  if (normalized.length < 12) return null;
  const pan = normalized.slice(2, 12);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return null;
  return pan;
}

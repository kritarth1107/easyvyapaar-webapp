import type { PartyType } from "@/lib/types/parties-api";

/** Parties list table row mapped from API summaries. */
export type Party = {
  id: string;
  name: string;
  type: PartyType;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  partyCategory?: string;
  city: string;
  state: string;
  billingAddress?: string;
  /** Positive = to collect. Negative = to pay. */
  balance: number;
  creditLimit?: number;
  lastTransactionDate?: string;
  transactionCount: number;
  isActive: boolean;
};

import type { Party } from "@/lib/types/party-ui";
import type { PartySummary } from "@/lib/types/parties-api";

export function mapPartySummaryToParty(summary: PartySummary): Party {
  const addressLines =
    summary.billingAddress
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  return {
    id: summary.partyId,
    name: summary.name,
    type: summary.type,
    phone: summary.phone,
    email: summary.email,
    gstin: summary.gstin,
    pan: summary.pan,
    partyCategory: summary.partyCategory,
    city: addressLines[0] ?? "—",
    state: addressLines.length > 1 ? (addressLines[addressLines.length - 1] ?? "") : "",
    billingAddress: summary.billingAddress,
    balance: summary.balance,
    creditLimit: summary.creditLimit,
    lastTransactionDate: summary.lastTransactionDate,
    transactionCount: summary.transactionCount,
    isActive: summary.isActive,
  };
}

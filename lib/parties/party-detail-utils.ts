import type { NamedSlice } from "@/lib/dashboard/stock-summary-analytics";
import type { PartyDetail } from "@/lib/types/parties-api";

/** Masks the last 6 characters of an account number; shows the leading digits. */
export function maskBankAccountNumber(accountNumber: string): string {
  const value = accountNumber.replace(/\s/g, "");
  if (!value) return "—";
  if (value.length <= 6) return "•".repeat(value.length);
  return `${value.slice(0, value.length - 6)}${"•".repeat(6)}`;
}

export function formatPartyInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

export function formatPartyDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function getPartyIdentityLine(party: PartyDetail): string {
  if (party.gstin) return party.gstin;
  if (party.pan) return party.pan;
  return party.partyCategory;
}

export function getReceivableAmount(party: PartyDetail): number {
  return Math.max(0, party.currentBalance);
}

export function getPayableAmount(party: PartyDetail): number {
  return party.currentBalance < 0 ? Math.abs(party.currentBalance) : 0;
}

export function getCreditUtilization(party: PartyDetail): number {
  if (party.creditLimit <= 0) return 0;
  return Math.min(100, (getReceivableAmount(party) / party.creditLimit) * 100);
}

export function buildBalanceSlices(party: PartyDetail): NamedSlice[] {
  const receivable = getReceivableAmount(party);
  const payable = getPayableAmount(party);
  if (receivable === 0 && payable === 0) {
    return [{ id: "settled", label: "Settled", value: 1, color: "#94A3B8" }];
  }
  const slices: NamedSlice[] = [];
  if (receivable > 0) {
    slices.push({ id: "receivable", label: "To collect", value: receivable, color: "#059669" });
  }
  if (payable > 0) {
    slices.push({ id: "payable", label: "To pay", value: payable, color: "#DC2626" });
  }
  return slices;
}

/** Activity trend seeded from transaction count for chart preview until invoices exist. */
export function buildActivityTrend(party: PartyDetail): { day: string; units: number; value: number }[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const total = party.transactionCount;
  if (total === 0) {
    return months.map((day) => ({ day, units: 0, value: 0 }));
  }
  const weights = [0.08, 0.1, 0.12, 0.15, 0.22, 0.33];
  return months.map((day, index) => {
    const units = Math.round(total * weights[index]);
    const value = units * (party.lastTransaction?.amount ?? Math.max(500, getReceivableAmount(party) / 10 || 1000));
    return { day, units, value };
  });
}

export function buildLedgerRows(party: PartyDetail) {
  const opening =
    party.openingBalanceType === "to_pay"
      ? -party.openingBalanceAmount
      : party.openingBalanceAmount;

  return {
    opening,
    closing: party.currentBalance,
    movement: party.currentBalance - opening,
  };
}

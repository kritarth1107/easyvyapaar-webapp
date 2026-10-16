import type { PartyLedgerEntry, PartyLedgerEntryType } from "@/lib/types/parties-api";
import type { TranslationKey } from "@/lib/localization";

/** Backend rejects from > to with 400; ISO dates compare lexically. Null/empty = open-ended. */
export function isLedgerRangeInvalid(from?: string | null, to?: string | null): boolean {
  return Boolean(from && to && from.slice(0, 10) > to.slice(0, 10));
}

export class LedgerRangeError extends Error {
  constructor() {
    super("Ledger 'from' date is after 'to' date");
    this.name = "LedgerRangeError";
  }
}

export function ledgerFromDate(days: string): string | undefined {
  const offset = Number(days);
  if (!Number.isFinite(offset) || offset <= 0) return undefined;
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

export function getLedgerEntryTypeLabel(type: PartyLedgerEntryType): TranslationKey {
  const map: Record<PartyLedgerEntryType, TranslationKey> = {
    opening_balance: "dashboard.partyDetail.ledgerTypeOpening",
    sales_invoice: "dashboard.partyDetail.ledgerTypeInvoice",
    invoice_payment: "dashboard.partyDetail.ledgerTypePayment",
    sales_return: "dashboard.partyDetail.ledgerTypeReturn",
    credit_note: "dashboard.partyDetail.ledgerTypeCreditNote",
    debit_note: "dashboard.partyDetail.ledgerTypeDebitNote",
    payment_in: "dashboard.partyDetail.ledgerTypePaymentIn",
    payment_out: "dashboard.partyDetail.ledgerTypePaymentOut",
    quotation: "dashboard.partyDetail.ledgerTypeQuotation",
    purchase_bill: "dashboard.partyDetail.ledgerTypePurchaseBill",
    purchase_return: "dashboard.partyDetail.ledgerTypePurchaseReturn",
    purchase_payment: "dashboard.partyDetail.ledgerTypePurchasePayment",
    purchase_payment_reversal: "dashboard.partyDetail.ledgerTypePurchasePaymentReversal",
    expense: "dashboard.partyDetail.ledgerTypeExpense",
    tds_deducted: "dashboard.purchaseSummary.ledgerTdsDeducted",
    tds_reversal: "dashboard.purchaseSummary.ledgerTdsReversal",
  };
  return map[type];
}

export function getLedgerEntryHref(entry: PartyLedgerEntry): string | null {
  if (!entry.referenceId) return null;
  switch (entry.entryType) {
    case "sales_invoice":
    case "invoice_payment":
      return `/dashboard/sales/invoices/${encodeURIComponent(entry.referenceId)}`;
    case "sales_return":
      return `/dashboard/sales/sales-returns/${encodeURIComponent(entry.referenceId)}`;
    case "credit_note":
    case "debit_note":
      return `/dashboard/sales/credit-notes/${encodeURIComponent(entry.referenceId)}`;
    case "payment_in":
    case "payment_out":
      return `/dashboard/finance/payments/${encodeURIComponent(entry.referenceId)}`;
    case "quotation":
      return `/dashboard/sales/quotations/${encodeURIComponent(entry.referenceId)}`;
    case "purchase_bill":
    case "purchase_payment":
    case "purchase_payment_reversal":
    case "tds_deducted":
    case "tds_reversal":
      return `/dashboard/purchases/${encodeURIComponent(entry.referenceId)}`;
    default:
      return null;
  }
}

export function formatSignedPartyBalance(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  if (amount > 0) return `${formatted} Dr`;
  if (amount < 0) return `${formatted} Cr`;
  return formatted;
}

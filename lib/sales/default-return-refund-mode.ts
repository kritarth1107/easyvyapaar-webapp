import type { SalesRefundMode } from "@/lib/types/sales-returns-api";

const CASH_LIKE_MODES = new Set<string>(["cash", "upi", "card", "bank", "cheque"]);

export function defaultSalesReturnRefundMode(invoice: {
  isCashSale: boolean;
  amountReceived: number;
  paymentMode: string;
}): SalesRefundMode {
  if (invoice.isCashSale) return "cash";
  if (invoice.amountReceived > 0 && CASH_LIKE_MODES.has(invoice.paymentMode)) {
    return invoice.paymentMode as SalesRefundMode;
  }
  return "credit_to_party";
}

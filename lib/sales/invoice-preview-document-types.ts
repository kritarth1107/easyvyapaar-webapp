/** Stable ids for invoice summary rows (labels are translated, keys are not). */
export type InvoiceSummaryRowKey =
  | "taxableAmount"
  | "discountBeforeTax"
  | "netTaxable"
  | "discountAfterTax"
  | "roundOff"
  | "totalAmount"
  | "receivedAmount"
  | "balanceAmount";

import type { BillbookLine, InvoiceGstRow, SampleLine } from "@/lib/sales/invoice-preview-data";

export type { InvoiceGstRow };

export type LiveInvoicePreviewLine = {
  name: string;
  description?: string;
  hsn: string;
  qtyLabel: string;
  rate: string;
  discount: string;
  discountSub: string;
  tax: string;
  taxSub: string;
  amount: string;
  serialLabel?: string;
};

export type LiveInvoicePreviewModel = {
  businessName: string;
  businessAddress: string;
  businessTaxLine: string;
  businessPhone: string;
  placeOfSupply: string;
  displayNumber: string;
  invoiceDate: string;
  dueDate?: string;
  partyName: string;
  partyAddress?: string;
  partyTaxLine?: string;
  partyPhone?: string;
  shippingAddress?: string;
  partyBalance?: string;
  lines: LiveInvoicePreviewLine[];
  gstRows: InvoiceGstRow[];
  totalDisc: string;
  totalTax: string;
  totalAmount: string;
  amountInWords: string;
  notes?: string;
  terms?: string;
  bankLabel?: string;
  summaryRows: Array<{ key?: InvoiceSummaryRowKey; label: string; value: string; bold?: boolean }>;
  amountReceived: string;
  balanceAmount: string;
  paymentMode: string;
  documentTitle?: string;
  /** Bill of Supply: drop the tax column, tax total and GST breakdown. */
  hideTax?: boolean;
};

export type InvoicePreviewDocument = {
  businessAddress?: string;
  businessTaxLine?: string;
  businessPhone?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  partyName?: string;
  partyAddress?: string;
  partyTaxLine?: string;
  partyPhone?: string;
  placeOfSupply?: string;
  shippingAddress?: string;
  partyBalance?: string;
  lines?: SampleLine[];
  billbookLines?: BillbookLine[];
  gstRows?: InvoiceGstRow[];
  summaryRows?: Array<{ key?: InvoiceSummaryRowKey; label: string; value: string; bold?: boolean }>;
  totalDisc?: string;
  totalTax?: string;
  totalAmount?: string;
  receivedAmount?: string;
  previousBalance?: string;
  currentBalance?: string;
  amountInWords?: string;
  notes?: string;
  terms?: string;
  bankDetails?: string;
  hideTax?: boolean;
  documentTitle?: string;
  dueDateLabel?: string;
  hidePaymentSummary?: boolean;
};

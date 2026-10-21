export const INVOICE_CANCEL_BLOCKERS = [
  "already_cancelled",
  "irn_active",
  "ewb_active",
  "has_payments",
  "has_returns",
  "has_credit_notes",
] as const;
export type InvoiceCancelBlocker = (typeof INVOICE_CANCEL_BLOCKERS)[number];

import type { PaymentHistoryEntry } from "@/lib/api/payment-history";

export type MarkInvoiceUnpaidResult = {
  invoice: SalesInvoiceDetail;
  reversedAmount: number;
  /** Voucher allocations released; the money stays with the party as an advance. */
  releasedAllocations: Array<{ paymentId: string; displayNumber: string; amount: number; unallocatedAmount: number }>;
  reversedByMode: Array<{ paymentMode: string; amount: number }>;
};

export type SalesInvoiceType = "gst_invoice" | "cash_memo" | "bill_of_supply";

export type SalesInvoiceStatus =
  | "paid"
  | "unpaid"
  | "partial"
  | "partial_return"
  | "returned"
  | "cancelled";

export type SalesInvoiceSummary = {
  invoiceId: string;
  displayNumber: string;
  partyName: string;
  partyId?: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  amountReceived: number;
  balanceAmount: number;
  status: SalesInvoiceStatus;
  isCashSale: boolean;
  invoiceType: SalesInvoiceType;
  partyGstin?: string;
  placeOfSupply?: string;
  firstItemName?: string;
  lineCount?: number;
  taxAmount?: number;
  paymentMode?: string;
};

export type SalesInvoiceLineItem = {
  lineId: string;
  itemId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  pricePerItem: number;
  discount: number;
  discountType: "percent" | "amount";
  gstPercent: number;
  salesTaxMode: "with_tax" | "without_tax";
  taxable: number;
  tax: number;
  amount: number;
  serialNumbers?: string[];
  supplierId?: string;
  supplierName?: string;
};

export type SalesInvoiceDetail = SalesInvoiceSummary & {
  organisationId: string;
  invoicePrefix: string;
  invoiceNumber: string;
  paymentTermsDays: number;
  lineItems: SalesInvoiceLineItem[];
  notes?: string;
  terms?: string;
  bankAccount?: {
    bankAccountId?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  additionalCharges: Array<{
    chargeId: string;
    label: string;
    amount: number;
    taxPercent: number;
  }>;
  discountAfterTax: number;
  discountType: "percent" | "amount";
  discountTiming: "after_tax" | "before_tax";
  autoRoundOff: boolean;
  roundOffAmount: number;
  subtotal: number;
  lineTax: number;
  additionalChargesTotal: number;
  additionalChargesTax: number;
  taxableAmount: number;
  discountAmount: number;
  totalBeforeRound: number;
  paymentMode: string;
  theme: string;
  partyPhone?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQr?: string;
  eInvoiceStatus?: 'none' | 'generated' | 'cancelled' | 'failed';
  eInvoiceMode?: 'mock' | 'live';
  eInvoiceCancelledAt?: string;
  eInvoiceCancelReason?: string;
  ewayBillNo?: string;
  ewayBillDate?: string;
  ewayValidUpto?: string;
  eWayBillStatus?: "none" | "generated" | "cancelled" | "failed";
  eWayBillMode?: "mock" | "live";
  vehicleNumber?: string;
  transporterId?: string;
  /** Set when the invoice itself is cancelled (not just its IRN). */
  cancelledAt?: string;
  cancelReason?: string;
  /** Backend verdict for Cancel; blockers explain why not. */
  cancellable?: boolean;
  cancelBlockers?: InvoiceCancelBlocker[];
  paymentHistory?: PaymentHistoryEntry[];
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSalesInvoiceRequest = {
  invoiceType?: SalesInvoiceType;
  isCashSale?: boolean;
  partyId?: string;
  partyName?: string;
  partyGstin?: string;
  invoicePrefix?: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  paymentTermsDays?: number;
  lineItems: Array<{
    itemId: string;
    name: string;
    hsn?: string;
    qty: number;
    unit?: string;
    pricePerItem: number;
    discount?: number;
    discountType?: "percent" | "amount";
    gstPercent?: number;
    salesTaxMode: "with_tax" | "without_tax";
    serialNumbers?: string[];
    supplierId?: string;
    supplierName?: string;
  }>;
  notes?: string;
  terms?: string;
  bankAccount?: {
    bankAccountId?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
  };
  additionalCharges?: Array<{
    label?: string;
    amount?: number;
    taxPercent?: number;
  }>;
  discountAfterTax?: number;
  discountType?: "percent" | "amount";
  discountTiming?: "after_tax" | "before_tax";
  autoRoundOff?: boolean;
  roundOffAmount?: number;
  amountReceived?: number;
  paymentMode?: string;
  fullyPaid?: boolean;
  theme?: string;
};

export type RecordSalesInvoicePaymentRequest = {
  amount?: number;
  fullyPaid?: boolean;
  paymentMode?: string;
};

export type NextInvoiceNumber = {
  invoicePrefix: string;
  invoiceNumber: string;
  suggestedDisplay: string;
};

export type SalesInvoiceListParams = {
  status?: SalesInvoiceStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export type SalesInvoiceListResponse = {
  items: SalesInvoiceSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** PATCH body: create body minus type, numbering and payment fields (unpaid, no IRN/EWB/returns only). */
export type UpdateSalesInvoiceRequest = Omit<
  CreateSalesInvoiceRequest,
  "invoiceType" | "invoicePrefix" | "invoiceNumber" | "amountReceived" | "fullyPaid"
>;

export type EInvoiceResult = {
  mode: 'mock' | 'live';
  status: 'none' | 'generated' | 'cancelled' | 'failed';
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  signedQr?: string;
  cancelledAt?: string;
  cancelReason?: string;
  isMock: boolean;
  message: string;
};

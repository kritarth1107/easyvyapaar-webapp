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
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSalesInvoiceRequest = {
  isCashSale?: boolean;
  partyId?: string;
  partyName?: string;
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

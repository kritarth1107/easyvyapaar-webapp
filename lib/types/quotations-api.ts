export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

export type QuotationSummary = {
  quotationId: string;
  displayNumber: string;
  partyName: string;
  partyId?: string;
  quotationDate: string;
  validUntil?: string;
  totalAmount: number;
  status: QuotationStatus;
};

export type QuotationLineItem = {
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

export type QuotationDetail = QuotationSummary & {
  organisationId: string;
  quotationPrefix: string;
  quotationNumber: string;
  lineItems: QuotationLineItem[];
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
  theme: string;
  partyPhone?: string;
  convertedInvoiceId?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextQuotationNumber = {
  quotationPrefix: string;
  quotationNumber: string;
  suggestedDisplay: string;
};

export type QuotationListParams = {
  status?: QuotationStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
};

export type QuotationListResponse = {
  items: QuotationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateQuotationRequest = {
  partyId: string;
  quotationPrefix?: string;
  quotationNumber?: string;
  quotationDate: string;
  validUntil?: string;
  status?: QuotationStatus;
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
    salesTaxMode?: "with_tax" | "without_tax";
    serialNumbers?: string[];
    supplierId?: string;
    supplierName?: string;
  }>;
  notes?: string;
  terms?: string;
  bankAccount?: QuotationDetail["bankAccount"];
  additionalCharges?: Array<{ label?: string; amount?: number; taxPercent?: number }>;
  discountAfterTax?: number;
  discountType?: "percent" | "amount";
  discountTiming?: "after_tax" | "before_tax";
  autoRoundOff?: boolean;
  roundOffAmount?: number;
  theme?: string;
};

export type UpdateQuotationRequest = Omit<
  CreateQuotationRequest,
  "quotationPrefix" | "quotationNumber"
>;

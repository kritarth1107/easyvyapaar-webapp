export type SalesReturnStatus = "draft" | "completed" | "cancelled";
export type SalesRefundMode = "cash" | "upi" | "card" | "bank" | "credit_to_party";

export type SalesReturnSummary = {
  salesReturnId: string;
  displayNumber: string;
  invoiceId: string;
  invoiceDisplayNumber: string;
  partyName: string;
  partyId?: string;
  returnDate: string;
  totalAmount: number;
  refundAmount: number;
  status: SalesReturnStatus;
};

export type SalesReturnLineItem = {
  lineId: string;
  invoiceLineId: string;
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
};

export type SalesReturnDetail = SalesReturnSummary & {
  organisationId: string;
  isCashSale: boolean;
  returnPrefix: string;
  returnNumber: string;
  reason?: string;
  notes?: string;
  lineItems: SalesReturnLineItem[];
  subtotal: number;
  lineTax: number;
  taxableAmount: number;
  refundMode: SalesRefundMode;
  partyPhone?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextSalesReturnNumber = {
  returnPrefix: string;
  returnNumber: string;
  suggestedDisplay: string;
};

export type SalesReturnListParams = {
  status?: SalesReturnStatus | "all";
  search?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
};

export type SalesReturnListResponse = {
  items: SalesReturnSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateSalesReturnRequest = {
  invoiceId: string;
  returnPrefix?: string;
  returnNumber?: string;
  returnDate: string;
  status?: SalesReturnStatus;
  reason?: string;
  notes?: string;
  lineItems: Array<{
    invoiceLineId: string;
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
  }>;
  refundAmount?: number;
  refundMode?: SalesRefundMode;
};

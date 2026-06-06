export type CreditNoteType = "credit" | "debit";
export type CreditNoteStatus = "draft" | "completed" | "cancelled";
export type CreditNoteSettlementMode = "cash" | "upi" | "card" | "bank" | "credit_to_party";

export type CreditNoteSummary = {
  creditNoteId: string;
  noteType: CreditNoteType;
  displayNumber: string;
  invoiceId: string;
  invoiceDisplayNumber: string;
  partyName: string;
  partyId?: string;
  noteDate: string;
  totalAmount: number;
  settlementAmount: number;
  status: CreditNoteStatus;
};

export type CreditNoteLineItem = {
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

export type CreditNoteDetail = CreditNoteSummary & {
  organisationId: string;
  isCashSale: boolean;
  notePrefix: string;
  noteNumber: string;
  reason?: string;
  notes?: string;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  lineTax: number;
  taxableAmount: number;
  settlementMode: CreditNoteSettlementMode;
  partyPhone?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextCreditNoteNumber = {
  notePrefix: string;
  noteNumber: string;
  suggestedDisplay: string;
};

export type CreditNoteListParams = {
  noteType?: CreditNoteType | "all";
  status?: CreditNoteStatus | "all";
  search?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
};

export type CreditNoteListResponse = {
  items: CreditNoteSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateCreditNoteRequest = {
  noteType?: CreditNoteType;
  invoiceId: string;
  notePrefix?: string;
  noteNumber?: string;
  noteDate: string;
  status?: CreditNoteStatus;
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
  settlementAmount?: number;
  settlementMode?: CreditNoteSettlementMode;
};

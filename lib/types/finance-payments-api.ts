export type FinancePaymentType = "payment_in" | "payment_out";
export type FinancePaymentStatus = "completed" | "cancelled";
export type FinancePaymentMode = "cash" | "upi" | "card" | "bank" | "cheque";

export type PaymentActivitySourceType =
  | "finance_voucher"
  | "invoice_payment"
  | "sales_return_refund"
  | "credit_note_refund"
  | "purchase_payment"
  | "expense";

export type FinancePaymentAllocation = {
  invoiceId: string;
  invoiceDisplayNumber: string;
  amount: number;
};

export type FinancePaymentSummary = {
  entryId: string;
  sourceType: PaymentActivitySourceType;
  paymentId: string;
  paymentType: FinancePaymentType;
  displayNumber: string;
  partyId: string;
  partyName: string;
  partyPhone?: string;
  paymentDate: string;
  amount: number;
  paymentMode: FinancePaymentMode;
  status: FinancePaymentStatus;
  unallocatedAmount: number;
  invoiceId?: string;
  invoiceDisplayNumber?: string;
  grossAmount?: number;
  refundedAmount?: number;
  netAmount?: number;
  adjustmentLabel?: string;
  description?: string;
};

export type FinancePaymentDetail = FinancePaymentSummary & {
  organisationId: string;
  partyPhone?: string;
  paymentPrefix: string;
  paymentNumber: string;
  referenceNumber?: string;
  notes?: string;
  allocations: FinancePaymentAllocation[];
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextFinancePaymentNumber = {
  paymentPrefix: string;
  paymentNumber: string;
  suggestedDisplay: string;
};

export type FinancePaymentListParams = {
  paymentType?: FinancePaymentType | "all";
  status?: FinancePaymentStatus | "all";
  partyId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type FinancePaymentListResponse = {
  items: FinancePaymentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateFinancePaymentRequest = {
  paymentType: FinancePaymentType;
  partyId: string;
  paymentPrefix?: string;
  paymentNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode?: FinancePaymentMode;
  referenceNumber?: string;
  notes?: string;
  allocateToInvoices?: boolean;
  allocations?: Array<{ invoiceId: string; amount: number }>;
};

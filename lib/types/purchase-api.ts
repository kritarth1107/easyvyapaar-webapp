export type PurchasePaymentStatus = "paid" | "partial" | "pending" | "unpaid";
export type PurchaseBillStatus = "draft" | "completed" | "cancelled";
export type PurchaseOrderStatus = "draft" | "open" | "partial" | "received" | "cancelled";
export type PurchaseReturnStatus = "draft" | "completed" | "cancelled";
export type PurchasePaymentMode = "cash" | "upi" | "card" | "bank" | "cheque";

export type PurchaseLineItem = {
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
  purchaseTaxMode: "with_tax" | "without_tax";
  taxable: number;
  tax: number;
  amount: number;
};

export type PurchaseBillSummary = {
  purchaseBillId: string;
  displayNumber: string;
  partyId: string;
  partyName: string;
  billDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PurchasePaymentStatus;
  status: PurchaseBillStatus;
};

export type PurchaseBillDetail = PurchaseBillSummary & {
  organisationId: string;
  billPrefix: string;
  billNumber: string;
  notes?: string;
  attachmentFilename?: string;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  lineTax: number;
  taxableAmount: number;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderSummary = {
  purchaseOrderId: string;
  displayNumber: string;
  partyId: string;
  partyName: string;
  orderDate: string;
  expectedDate?: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
};

export type PurchaseOrderDetail = PurchaseOrderSummary & {
  organisationId: string;
  orderPrefix: string;
  orderNumber: string;
  notes?: string;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  lineTax: number;
  taxableAmount: number;
  receivedQty?: number;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseReturnSummary = {
  purchaseReturnId: string;
  displayNumber: string;
  purchaseBillId: string;
  purchaseBillDisplayNumber: string;
  partyId: string;
  partyName: string;
  returnDate: string;
  totalAmount: number;
  status: PurchaseReturnStatus;
};

export type PurchaseReturnDetail = PurchaseReturnSummary & {
  organisationId: string;
  returnPrefix: string;
  returnNumber: string;
  reason?: string;
  notes?: string;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  lineTax: number;
  taxableAmount: number;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextPurchaseNumber = {
  prefix: string;
  number: string;
  suggestedDisplay: string;
};

export type PurchaseBillListParams = {
  status?: PurchaseBillStatus | "all";
  paymentStatus?: PurchasePaymentStatus | "all";
  partyId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PurchaseOrderListParams = {
  status?: PurchaseOrderStatus | "all";
  partyId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PurchaseReturnListParams = {
  status?: PurchaseReturnStatus | "all";
  partyId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PurchaseBillListResponse = PaginatedResponse<PurchaseBillSummary>;
export type PurchaseOrderListResponse = PaginatedResponse<PurchaseOrderSummary>;
export type PurchaseReturnListResponse = PaginatedResponse<PurchaseReturnSummary>;

export type CreatePurchaseBillRequest = {
  partyId: string;
  billPrefix?: string;
  billNumber?: string;
  billDate: string;
  status?: PurchaseBillStatus;
  notes?: string;
  attachmentFilename?: string;
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
    purchaseTaxMode?: "with_tax" | "without_tax";
  }>;
  paidAmount?: number;
  paymentMode?: PurchasePaymentMode;
};

export type CreatePurchaseOrderRequest = {
  partyId: string;
  orderPrefix?: string;
  orderNumber?: string;
  orderDate: string;
  expectedDate?: string;
  status?: PurchaseOrderStatus;
  notes?: string;
  lineItems: CreatePurchaseBillRequest["lineItems"];
};

export type CreatePurchaseReturnRequest = {
  purchaseBillId: string;
  returnPrefix?: string;
  returnNumber?: string;
  returnDate: string;
  status?: PurchaseReturnStatus;
  reason?: string;
  notes?: string;
  lineItems: Array<{
    billLineId?: string;
    itemId: string;
    name: string;
    hsn?: string;
    qty: number;
    unit?: string;
    pricePerItem: number;
    discount?: number;
    discountType?: "percent" | "amount";
    gstPercent?: number;
    purchaseTaxMode?: "with_tax" | "without_tax";
  }>;
};

export type RecordPurchaseBillPaymentRequest = {
  amount: number;
  paymentDate: string;
  paymentMode?: PurchasePaymentMode;
  referenceNumber?: string;
  notes?: string;
};

export type ConvertPurchaseOrderRequest = {
  billDate?: string;
  paidAmount?: number;
  paymentMode?: PurchasePaymentMode;
};

export type MarkPurchaseOrderReceivedRequest = {
  receivedItems?: Array<{ lineId: string; receivedQty: number }>;
};

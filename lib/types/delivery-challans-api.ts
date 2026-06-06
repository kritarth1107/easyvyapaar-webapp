export type DeliveryChallanStatus = "draft" | "dispatched" | "delivered" | "cancelled";

export type DeliveryChallanSummary = {
  deliveryChallanId: string;
  displayNumber: string;
  partyName: string;
  partyId?: string;
  challanDate: string;
  deliveryDate?: string;
  totalQty: number;
  lineCount: number;
  status: DeliveryChallanStatus;
  invoiceId?: string;
  invoiceDisplayNumber?: string;
};

export type DeliveryChallanLineItem = {
  lineId: string;
  itemId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  pricePerItem: number;
  serialNumbers?: string[];
};

export type DeliveryChallanDetail = DeliveryChallanSummary & {
  organisationId: string;
  challanPrefix: string;
  challanNumber: string;
  lineItems: DeliveryChallanLineItem[];
  shippingAddress?: string;
  vehicleNumber?: string;
  transportRef?: string;
  notes?: string;
  stockDeducted: boolean;
  partyPhone?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NextDeliveryChallanNumber = {
  challanPrefix: string;
  challanNumber: string;
  suggestedDisplay: string;
};

export type DeliveryChallanListParams = {
  status?: DeliveryChallanStatus | "all";
  search?: string;
  invoiceId?: string;
  page?: number;
  limit?: number;
};

export type DeliveryChallanListResponse = {
  items: DeliveryChallanSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateDeliveryChallanLineInput = {
  itemId: string;
  name: string;
  hsn: string;
  qty: number;
  unit: string;
  pricePerItem?: number;
  serialNumbers?: string[];
};

export type CreateDeliveryChallanRequest = {
  partyId: string;
  invoiceId?: string;
  challanPrefix?: string;
  challanNumber?: string;
  challanDate: string;
  deliveryDate?: string;
  status?: "draft" | "dispatched" | "delivered";
  shippingAddress?: string;
  vehicleNumber?: string;
  transportRef?: string;
  notes?: string;
  lineItems: CreateDeliveryChallanLineInput[];
};

export type UpdateDeliveryChallanRequest = {
  partyId?: string;
  invoiceId?: string | null;
  challanDate?: string;
  deliveryDate?: string | null;
  status?: DeliveryChallanStatus;
  shippingAddress?: string | null;
  vehicleNumber?: string | null;
  transportRef?: string | null;
  notes?: string | null;
  lineItems?: CreateDeliveryChallanLineInput[];
};

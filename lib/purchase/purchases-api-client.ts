import {
  extractBackendError,
  normalizeNextPurchaseNumber,
  normalizePurchaseBillDetailResponse,
  normalizePurchaseBillListResponse,
  normalizePurchaseOrderDetailResponse,
  normalizePurchaseOrderListResponse,
  normalizePurchaseReturnDetailResponse,
  normalizePurchaseReturnListResponse,
} from "@/lib/api/purchases";
import type {
  ConvertPurchaseOrderRequest,
  CreatePurchaseBillRequest,
  CreatePurchaseOrderRequest,
  CreatePurchaseReturnRequest,
  MarkPurchaseOrderReceivedRequest,
  NextPurchaseNumber,
  PurchaseBillDetail,
  PurchaseBillListParams,
  PurchaseBillListResponse,
  PurchaseOrderDetail,
  PurchaseOrderListParams,
  PurchaseOrderListResponse,
  PurchaseReturnDetail,
  PurchaseReturnListParams,
  PurchaseReturnListResponse,
  RecordPurchaseBillPaymentRequest,
} from "@/lib/types/purchase-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildQuery(organisationId: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams({ organisationId });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "all" && String(value).trim()) {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

// Bills
export async function fetchNextPurchaseBillNumber(organisationId: string): Promise<NextPurchaseNumber> {
  const res = await fetch(
    `/api/purchase/bills/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load bill number");
  const data = normalizeNextPurchaseNumber(body);
  if (!data) throw new Error("Failed to load bill number");
  return data;
}

export async function fetchPurchaseBills(
  organisationId: string,
  params: PurchaseBillListParams = {},
): Promise<PurchaseBillListResponse> {
  const res = await fetch(
    `/api/purchase/bills?${buildQuery(organisationId, {
      status: params.status,
      paymentStatus: params.paymentStatus,
      partyId: params.partyId,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase bills");
  return normalizePurchaseBillListResponse(body);
}

export async function fetchPurchaseBillDetail(
  organisationId: string,
  purchaseBillId: string,
): Promise<PurchaseBillDetail> {
  const res = await fetch(
    `/api/purchase/bills/${encodeURIComponent(purchaseBillId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase bill");
  const bill = normalizePurchaseBillDetailResponse(body);
  if (!bill) throw new Error("Failed to load purchase bill");
  return bill;
}

export async function createPurchaseBill(
  organisationId: string,
  payload: CreatePurchaseBillRequest,
  pdfFile?: File | null,
): Promise<PurchaseBillDetail> {
  let res: Response;
  if (pdfFile) {
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    formData.append("attachment", pdfFile);
    res = await fetch(
      `/api/purchase/bills?organisationId=${encodeURIComponent(organisationId)}`,
      { method: "POST", body: formData },
    );
  } else {
    res = await fetch(
      `/api/purchase/bills?organisationId=${encodeURIComponent(organisationId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  }
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create purchase bill");
  const bill = normalizePurchaseBillDetailResponse(body);
  if (!bill) throw new Error("Failed to create purchase bill");
  return bill;
}

export async function recordPurchaseBillPayment(
  organisationId: string,
  purchaseBillId: string,
  payload: RecordPurchaseBillPaymentRequest,
): Promise<PurchaseBillDetail> {
  const res = await fetch(
    `/api/purchase/bills/${encodeURIComponent(purchaseBillId)}/payments?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to record payment");
  const bill = normalizePurchaseBillDetailResponse(body);
  if (!bill) throw new Error("Failed to record payment");
  return bill;
}

// Orders
export async function fetchNextPurchaseOrderNumber(organisationId: string): Promise<NextPurchaseNumber> {
  const res = await fetch(
    `/api/purchase/orders/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load order number");
  const data = normalizeNextPurchaseNumber(body);
  if (!data) throw new Error("Failed to load order number");
  return data;
}

export async function fetchPurchaseOrders(
  organisationId: string,
  params: PurchaseOrderListParams = {},
): Promise<PurchaseOrderListResponse> {
  const res = await fetch(
    `/api/purchase/orders?${buildQuery(organisationId, {
      status: params.status,
      partyId: params.partyId,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase orders");
  return normalizePurchaseOrderListResponse(body);
}

export async function fetchPurchaseOrderDetail(
  organisationId: string,
  purchaseOrderId: string,
): Promise<PurchaseOrderDetail> {
  const res = await fetch(
    `/api/purchase/orders/${encodeURIComponent(purchaseOrderId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase order");
  const order = normalizePurchaseOrderDetailResponse(body);
  if (!order) throw new Error("Failed to load purchase order");
  return order;
}

export async function createPurchaseOrder(
  organisationId: string,
  payload: CreatePurchaseOrderRequest,
): Promise<PurchaseOrderDetail> {
  const res = await fetch(
    `/api/purchase/orders?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create purchase order");
  const order = normalizePurchaseOrderDetailResponse(body);
  if (!order) throw new Error("Failed to create purchase order");
  return order;
}

export async function markPurchaseOrderReceived(
  organisationId: string,
  purchaseOrderId: string,
  payload: MarkPurchaseOrderReceivedRequest = {},
): Promise<PurchaseOrderDetail> {
  const res = await fetch(
    `/api/purchase/orders/${encodeURIComponent(purchaseOrderId)}/received?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to mark order received");
  const order = normalizePurchaseOrderDetailResponse(body);
  if (!order) throw new Error("Failed to mark order received");
  return order;
}

export async function convertPurchaseOrderToBill(
  organisationId: string,
  purchaseOrderId: string,
  payload: ConvertPurchaseOrderRequest = {},
): Promise<PurchaseBillDetail> {
  const res = await fetch(
    `/api/purchase/orders/${encodeURIComponent(purchaseOrderId)}/convert-to-bill?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to convert order to bill");
  const bill = normalizePurchaseBillDetailResponse(body);
  if (!bill) throw new Error("Failed to convert order to bill");
  return bill;
}

// Returns
export async function fetchNextPurchaseReturnNumber(organisationId: string): Promise<NextPurchaseNumber> {
  const res = await fetch(
    `/api/purchase/returns/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load return number");
  const data = normalizeNextPurchaseNumber(body);
  if (!data) throw new Error("Failed to load return number");
  return data;
}

export async function fetchPurchaseReturns(
  organisationId: string,
  params: PurchaseReturnListParams = {},
): Promise<PurchaseReturnListResponse> {
  const res = await fetch(
    `/api/purchase/returns?${buildQuery(organisationId, {
      status: params.status,
      partyId: params.partyId,
      search: params.search,
      page: params.page,
      limit: params.limit ?? 100,
    })}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase returns");
  return normalizePurchaseReturnListResponse(body);
}

export async function fetchPurchaseReturnDetail(
  organisationId: string,
  purchaseReturnId: string,
): Promise<PurchaseReturnDetail> {
  const res = await fetch(
    `/api/purchase/returns/${encodeURIComponent(purchaseReturnId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load purchase return");
  const ret = normalizePurchaseReturnDetailResponse(body);
  if (!ret) throw new Error("Failed to load purchase return");
  return ret;
}

export async function createPurchaseReturn(
  organisationId: string,
  payload: CreatePurchaseReturnRequest,
): Promise<PurchaseReturnDetail> {
  const res = await fetch(
    `/api/purchase/returns?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create purchase return");
  const ret = normalizePurchaseReturnDetailResponse(body);
  if (!ret) throw new Error("Failed to create purchase return");
  return ret;
}

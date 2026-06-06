import {
  extractBackendError,
  normalizeDeliveryChallanDetailResponse,
  normalizeDeliveryChallanListResponse,
  normalizeNextDeliveryChallanNumber,
} from "@/lib/api/delivery-challans";
import type {
  CreateDeliveryChallanRequest,
  DeliveryChallanDetail,
  DeliveryChallanListParams,
  DeliveryChallanListResponse,
  NextDeliveryChallanNumber,
  UpdateDeliveryChallanRequest,
} from "@/lib/types/delivery-challans-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: DeliveryChallanListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.invoiceId?.trim()) search.set("invoiceId", params.invoiceId.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextDeliveryChallanNumber(
  organisationId: string,
): Promise<NextDeliveryChallanNumber> {
  const res = await fetch(
    `/api/sales/delivery-challans/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load challan number");
  }
  const data = normalizeNextDeliveryChallanNumber(body);
  if (!data) throw new Error("Failed to load challan number");
  return data;
}

export async function fetchDeliveryChallans(
  organisationId: string,
  params: DeliveryChallanListParams = {},
): Promise<DeliveryChallanListResponse> {
  const res = await fetch(`/api/sales/delivery-challans?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load delivery challans");
  }
  return normalizeDeliveryChallanListResponse(body);
}

export async function fetchDeliveryChallanDetail(
  organisationId: string,
  deliveryChallanId: string,
): Promise<DeliveryChallanDetail> {
  const res = await fetch(
    `/api/sales/delivery-challans/${encodeURIComponent(deliveryChallanId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load delivery challan");
  }
  const challan = normalizeDeliveryChallanDetailResponse(body);
  if (!challan) throw new Error("Failed to load delivery challan");
  return challan;
}

export async function createDeliveryChallan(
  organisationId: string,
  payload: CreateDeliveryChallanRequest,
): Promise<DeliveryChallanDetail> {
  const res = await fetch(
    `/api/sales/delivery-challans?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create delivery challan");
  }
  const challan = normalizeDeliveryChallanDetailResponse(body);
  if (!challan) throw new Error("Failed to create delivery challan");
  return challan;
}

export async function updateDeliveryChallan(
  organisationId: string,
  deliveryChallanId: string,
  payload: UpdateDeliveryChallanRequest,
): Promise<DeliveryChallanDetail> {
  const res = await fetch(
    `/api/sales/delivery-challans/${encodeURIComponent(deliveryChallanId)}?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update delivery challan");
  }
  const challan = normalizeDeliveryChallanDetailResponse(body);
  if (!challan) throw new Error("Failed to update delivery challan");
  return challan;
}

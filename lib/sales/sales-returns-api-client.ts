import {
  extractBackendError,
  normalizeNextSalesReturnNumber,
  normalizeSalesReturnDetailResponse,
  normalizeSalesReturnListResponse,
} from "@/lib/api/sales-returns";
import type {
  CreateSalesReturnRequest,
  NextSalesReturnNumber,
  SalesReturnDetail,
  SalesReturnListParams,
  SalesReturnListResponse,
} from "@/lib/types/sales-returns-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: SalesReturnListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.invoiceId?.trim()) search.set("invoiceId", params.invoiceId.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextSalesReturnNumber(
  organisationId: string,
): Promise<NextSalesReturnNumber> {
  const res = await fetch(
    `/api/sales/sales-returns/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load return number");
  }
  const data = normalizeNextSalesReturnNumber(body);
  if (!data) throw new Error("Failed to load return number");
  return data;
}

export async function fetchSalesReturns(
  organisationId: string,
  params: SalesReturnListParams = {},
): Promise<SalesReturnListResponse> {
  const res = await fetch(`/api/sales/sales-returns?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load sales returns");
  }
  return normalizeSalesReturnListResponse(body);
}

export async function fetchSalesReturnDetail(
  organisationId: string,
  salesReturnId: string,
): Promise<SalesReturnDetail> {
  const res = await fetch(
    `/api/sales/sales-returns/${encodeURIComponent(salesReturnId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load sales return");
  }
  const salesReturn = normalizeSalesReturnDetailResponse(body);
  if (!salesReturn) throw new Error("Failed to load sales return");
  return salesReturn;
}

export async function createSalesReturn(
  organisationId: string,
  payload: CreateSalesReturnRequest,
): Promise<SalesReturnDetail> {
  const res = await fetch(
    `/api/sales/sales-returns?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create sales return");
  }
  const salesReturn = normalizeSalesReturnDetailResponse(body);
  if (!salesReturn) throw new Error("Failed to create sales return");
  return salesReturn;
}

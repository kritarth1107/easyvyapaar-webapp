import {
  extractBackendError,
  normalizeNextQuotationNumber,
  normalizeQuotationDetailResponse,
  normalizeQuotationListResponse,
} from "@/lib/api/quotations";
import type {
  CreateQuotationRequest,
  NextQuotationNumber,
  QuotationDetail,
  QuotationListParams,
  QuotationListResponse,
  UpdateQuotationRequest,
} from "@/lib/types/quotations-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: QuotationListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextQuotationNumber(
  organisationId: string,
): Promise<NextQuotationNumber> {
  const res = await fetch(
    `/api/sales/quotations/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load quotation number");
  }
  const data = normalizeNextQuotationNumber(body);
  if (!data) throw new Error("Failed to load quotation number");
  return data;
}

export async function fetchQuotations(
  organisationId: string,
  params: QuotationListParams = {},
): Promise<QuotationListResponse> {
  const res = await fetch(`/api/sales/quotations?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load quotations");
  }
  return normalizeQuotationListResponse(body);
}

export async function fetchQuotationDetail(
  organisationId: string,
  quotationId: string,
): Promise<QuotationDetail> {
  const res = await fetch(
    `/api/sales/quotations/${encodeURIComponent(quotationId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load quotation");
  }
  const quotation = normalizeQuotationDetailResponse(body);
  if (!quotation) throw new Error("Failed to load quotation");
  return quotation;
}

export async function updateQuotation(
  organisationId: string,
  quotationId: string,
  payload: UpdateQuotationRequest,
): Promise<QuotationDetail> {
  const res = await fetch(
    `/api/sales/quotations/${encodeURIComponent(quotationId)}?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to update quotation");
  }
  const quotation = normalizeQuotationDetailResponse(body);
  if (!quotation) throw new Error("Failed to update quotation");
  return quotation;
}

export async function createQuotation(
  organisationId: string,
  payload: CreateQuotationRequest,
): Promise<QuotationDetail> {
  const res = await fetch(
    `/api/sales/quotations?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create quotation");
  }
  const quotation = normalizeQuotationDetailResponse(body);
  if (!quotation) throw new Error("Failed to create quotation");
  return quotation;
}

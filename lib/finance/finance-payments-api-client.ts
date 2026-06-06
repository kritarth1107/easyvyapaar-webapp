import {
  extractBackendError,
  normalizeFinancePaymentDetailResponse,
  normalizeFinancePaymentListResponse,
  normalizeNextFinancePaymentNumber,
} from "@/lib/api/finance-payments";
import type {
  CreateFinancePaymentRequest,
  FinancePaymentDetail,
  FinancePaymentListParams,
  FinancePaymentListResponse,
  FinancePaymentType,
  NextFinancePaymentNumber,
} from "@/lib/types/finance-payments-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: FinancePaymentListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.paymentType && params.paymentType !== "all") search.set("paymentType", params.paymentType);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.partyId?.trim()) search.set("partyId", params.partyId.trim());
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextFinancePaymentNumber(
  organisationId: string,
  paymentType: FinancePaymentType = "payment_in",
): Promise<NextFinancePaymentNumber> {
  const res = await fetch(
    `/api/finance/payments/next-number?organisationId=${encodeURIComponent(organisationId)}&paymentType=${encodeURIComponent(paymentType)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load payment number");
  }
  const data = normalizeNextFinancePaymentNumber(body);
  if (!data) throw new Error("Failed to load payment number");
  return data;
}

export async function fetchFinancePayments(
  organisationId: string,
  params: FinancePaymentListParams = {},
): Promise<FinancePaymentListResponse> {
  const res = await fetch(`/api/finance/payments?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load payments");
  }
  return normalizeFinancePaymentListResponse(body);
}

export async function fetchFinancePaymentDetail(
  organisationId: string,
  paymentId: string,
): Promise<FinancePaymentDetail> {
  const res = await fetch(
    `/api/finance/payments/${encodeURIComponent(paymentId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load payment");
  }
  const payment = normalizeFinancePaymentDetailResponse(body);
  if (!payment) throw new Error("Failed to load payment");
  return payment;
}

export async function createFinancePayment(
  organisationId: string,
  payload: CreateFinancePaymentRequest,
): Promise<FinancePaymentDetail> {
  const res = await fetch(
    `/api/finance/payments?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to record payment");
  }
  const payment = normalizeFinancePaymentDetailResponse(body);
  if (!payment) throw new Error("Failed to record payment");
  return payment;
}

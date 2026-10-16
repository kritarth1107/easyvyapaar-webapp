/**
 * Proforma invoices reuse the quotation UI: the backend proforma shape is the quotation
 * shape with proforma* keys (proformaId / proformaPrefix / proformaNumber / proformaDate)
 * and statuses draft | sent | converted | cancelled. We remap keys at this boundary and
 * reuse the quotation normalisers and types.
 */
import { throwIfConflict } from "@/lib/api/conflict";
import {
  extractBackendError,
  normalizeQuotationDetailResponse,
  normalizeQuotationListResponse,
} from "@/lib/api/quotations";
import { normalizeSalesInvoiceDetailResponse } from "@/lib/api/sales";
import type {
  CreateQuotationRequest,
  NextQuotationNumber,
  QuotationDetail,
  QuotationListParams,
  QuotationListResponse,
  UpdateQuotationRequest,
} from "@/lib/types/quotations-api";
import type { SalesInvoiceDetail, SalesInvoiceType } from "@/lib/types/sales-api";

export const PROFORMA_STATUSES = ["draft", "sent", "converted", "cancelled"] as const;
export type ProformaStatus = (typeof PROFORMA_STATUSES)[number];

const TO_QUOTATION_KEYS: Record<string, string> = {
  proformaId: "quotationId",
  proformaPrefix: "quotationPrefix",
  proformaNumber: "quotationNumber",
  proformaDate: "quotationDate",
};

function remapKeys(value: unknown, map: Record<string, string>): unknown {
  if (Array.isArray(value)) return value.map((row) => remapKeys(row, map));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    // lineItems / additionalCharges never carry proforma* keys; only remap the top levels.
    const nextKey = map[key] ?? key;
    out[nextKey] =
      key === "data" || key === "items" || key === "proforma" ? remapKeys(child, map) : child;
  }
  return out;
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function orgQs(organisationId: string) {
  return `organisationId=${encodeURIComponent(organisationId)}`;
}

/** Quotation-shaped request → proforma request body. */
function toProformaBody(payload: CreateQuotationRequest | UpdateQuotationRequest): Record<string, unknown> {
  const { quotationDate, ...rest } = payload as CreateQuotationRequest;
  const body: Record<string, unknown> = { ...rest, proformaDate: quotationDate };
  if ("quotationPrefix" in body) {
    body.proformaPrefix = body.quotationPrefix;
    delete body.quotationPrefix;
  }
  if ("quotationNumber" in body) {
    body.proformaNumber = body.quotationNumber;
    delete body.quotationNumber;
  }
  // Proforma statuses are a subset; anything else falls back to draft.
  if (body.status && !["draft", "sent", "cancelled"].includes(String(body.status))) {
    body.status = "draft";
  }
  return body;
}

function asProforma(body: unknown, fallback: string): QuotationDetail {
  const detail = normalizeQuotationDetailResponse(remapKeys(body, TO_QUOTATION_KEYS));
  if (!detail) throw new Error(fallback);
  return detail;
}

export async function fetchNextProformaNumber(organisationId: string): Promise<NextQuotationNumber> {
  const res = await fetch(`/api/sales/proformas/next-number?${orgQs(organisationId)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load proforma number");
  const root = (body as { data?: Record<string, unknown> } | null)?.data ?? (body as Record<string, unknown> | null);
  const prefix = typeof root?.proformaPrefix === "string" ? root.proformaPrefix : "";
  const number = typeof root?.proformaNumber === "string" ? root.proformaNumber : "";
  if (!number) throw new Error("Failed to load proforma number");
  return {
    quotationPrefix: prefix,
    quotationNumber: number,
    suggestedDisplay: typeof root?.suggestedDisplay === "string" ? root.suggestedDisplay : `${prefix}${number}`,
  };
}

export async function fetchProformas(
  organisationId: string,
  params: QuotationListParams = {},
): Promise<QuotationListResponse> {
  const search = new URLSearchParams({ organisationId });
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const res = await fetch(`/api/sales/proformas?${search.toString()}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load proforma invoices");
  return normalizeQuotationListResponse(remapKeys(body, TO_QUOTATION_KEYS));
}

export async function fetchProformaDetail(organisationId: string, proformaId: string): Promise<QuotationDetail> {
  const res = await fetch(`/api/sales/proformas/${encodeURIComponent(proformaId)}?${orgQs(organisationId)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load proforma invoice");
  return asProforma(body, "Failed to load proforma invoice");
}

export async function createProforma(
  organisationId: string,
  payload: CreateQuotationRequest,
): Promise<QuotationDetail> {
  const res = await fetch(`/api/sales/proformas?${orgQs(organisationId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProformaBody(payload)),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to create proforma invoice");
  return asProforma(body, "Failed to create proforma invoice");
}

export async function updateProforma(
  organisationId: string,
  proformaId: string,
  payload: UpdateQuotationRequest | { status: ProformaStatus },
): Promise<QuotationDetail> {
  const isStatusOnly = Object.keys(payload).length === 1 && "status" in payload;
  const res = await fetch(`/api/sales/proformas/${encodeURIComponent(proformaId)}?${orgQs(organisationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isStatusOnly ? payload : toProformaBody(payload as UpdateQuotationRequest)),
  });
  const body = await parseJsonResponse(res);
  throwIfConflict(res, extractBackendError(body));
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to update proforma invoice");
  return asProforma(body, "Failed to update proforma invoice");
}

/** Soft delete; the backend refuses converted proformas. */
export async function deleteProforma(organisationId: string, proformaId: string): Promise<void> {
  const res = await fetch(`/api/sales/proformas/${encodeURIComponent(proformaId)}?${orgQs(organisationId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await parseJsonResponse(res);
    throw new Error(extractBackendError(body) ?? "Failed to delete proforma invoice");
  }
}

export type ConvertProformaRequest = {
  invoiceType?: SalesInvoiceType;
  invoicePrefix?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTermsDays?: number;
  partyGstin?: string;
  amountReceived?: number;
  paymentMode?: string;
  fullyPaid?: boolean;
};

export async function convertProforma(
  organisationId: string,
  proformaId: string,
  payload: ConvertProformaRequest,
): Promise<{ proforma: QuotationDetail; invoice: SalesInvoiceDetail | null }> {
  const res = await fetch(
    `/api/sales/proformas/${encodeURIComponent(proformaId)}/convert?${orgQs(organisationId)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to convert proforma invoice");
  const data = ((body as { data?: Record<string, unknown> } | null)?.data ?? body) as Record<string, unknown> | null;
  return {
    proforma: asProforma(data?.proforma, "Failed to convert proforma invoice"),
    invoice: normalizeSalesInvoiceDetailResponse(data?.invoice ?? null),
  };
}

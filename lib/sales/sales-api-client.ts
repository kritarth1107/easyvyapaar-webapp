import {
  extractBackendError,
  normalizeNextInvoiceNumber,
  normalizeSalesInvoiceDetailResponse,
  normalizeSalesInvoiceListResponse,
} from "@/lib/api/sales";
import type {
  CreateSalesInvoiceRequest,
  NextInvoiceNumber,
  RecordSalesInvoicePaymentRequest,
  SalesInvoiceDetail,
  SalesInvoiceListParams,
  SalesInvoiceListResponse,
} from "@/lib/types/sales-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildListQuery(organisationId: string, params: SalesInvoiceListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

export async function fetchNextInvoiceNumber(
  organisationId: string,
): Promise<NextInvoiceNumber> {
  const res = await fetch(
    `/api/sales/invoices/next-number?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load invoice number");
  }
  const data = normalizeNextInvoiceNumber(body);
  if (!data) {
    throw new Error("Failed to load invoice number");
  }
  return data;
}

export async function fetchSalesInvoices(
  organisationId: string,
  params: SalesInvoiceListParams = {},
): Promise<SalesInvoiceListResponse> {
  const res = await fetch(`/api/sales/invoices?${buildListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load invoices");
  }
  return normalizeSalesInvoiceListResponse(body);
}

export async function fetchSalesInvoiceDetail(
  organisationId: string,
  invoiceId: string,
): Promise<SalesInvoiceDetail> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load invoice");
  }
  const invoice = normalizeSalesInvoiceDetailResponse(body);
  if (!invoice) {
    throw new Error("Failed to load invoice");
  }
  return invoice;
}

export async function recordSalesInvoicePayment(
  organisationId: string,
  invoiceId: string,
  payload: RecordSalesInvoicePaymentRequest,
): Promise<SalesInvoiceDetail> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/payments?organisationId=${encodeURIComponent(organisationId)}`,
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
  const invoice = normalizeSalesInvoiceDetailResponse(body);
  if (!invoice) {
    throw new Error("Failed to record payment");
  }
  return invoice;
}

export async function createSalesInvoice(
  organisationId: string,
  payload: CreateSalesInvoiceRequest,
): Promise<SalesInvoiceDetail> {
  const res = await fetch(
    `/api/sales/invoices?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create invoice");
  }
  const invoice = normalizeSalesInvoiceDetailResponse(body);
  if (!invoice) {
    throw new Error("Failed to create invoice");
  }
  return invoice;
}

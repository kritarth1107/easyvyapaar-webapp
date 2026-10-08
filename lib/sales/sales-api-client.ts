import {
  extractBackendError,
  normalizeNextInvoiceNumber,
  normalizeSalesInvoiceDetailResponse,
  normalizeSalesInvoiceListResponse,
} from "@/lib/api/sales";
import type {
  CreateSalesInvoiceRequest,
  EInvoiceResult,
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

export function buildSalesInvoicePdfUrl(
  organisationId: string,
  invoiceId: string,
  cacheKey?: number,
): string {
  const params = new URLSearchParams({ organisationId });
  if (cacheKey != null) params.set("v", String(cacheKey));
  return `/api/sales/invoices/${encodeURIComponent(invoiceId)}/pdf?${params.toString()}`;
}

export async function sendSalesInvoiceEmail(
  organisationId: string,
  invoiceId: string,
  email: string,
): Promise<{ sent: true; email: string }> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/send-email?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send invoice email");
  }
  const data = (body as { data?: { sent?: boolean; email?: string } })?.data;
  if (!data?.sent || !data.email) {
    throw new Error("Failed to send invoice email");
  }
  return { sent: true, email: data.email };
}

export async function sendSalesInvoiceWhatsApp(
  organisationId: string,
  invoiceId: string,
  phone: string,
): Promise<{ sent: true; phone: string; mode: "template" | "session"; hint?: string }> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/send-whatsapp?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to send invoice via WhatsApp");
  }
  const data = (body as {
    data?: { sent?: boolean; phone?: string; mode?: string; hint?: string };
  })?.data;
  if (!data?.sent || !data.phone) {
    throw new Error("Failed to send invoice via WhatsApp");
  }
  const mode = data.mode === "template" ? "template" : "session";
  return {
    sent: true,
    phone: data.phone,
    mode,
    ...(typeof data.hint === "string" && data.hint ? { hint: data.hint } : {}),
  };
}


function normalizeEInvoiceResult(body: unknown): EInvoiceResult | null {
  const root = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
  const data = root && root.success === true ? root.data : body;
  const row = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
  if (!row) return null;
  const mode = row.mode === 'live' ? 'live' : 'mock';
  const statusRaw = typeof row.status === 'string' ? row.status : 'none';
  const status =
    statusRaw === 'generated' || statusRaw === 'cancelled' || statusRaw === 'failed'
      ? statusRaw
      : 'none';
  const message = typeof row.message === 'string' ? row.message : '';
  return {
    mode,
    status,
    isMock: Boolean(row.isMock) || mode === 'mock',
    message,
    ...(typeof row.irn === 'string' && row.irn ? { irn: row.irn } : {}),
    ...(typeof row.ackNo === 'string' && row.ackNo ? { ackNo: row.ackNo } : {}),
    ...(typeof row.ackDate === 'string' && row.ackDate ? { ackDate: row.ackDate } : {}),
    ...(typeof row.signedQr === 'string' && row.signedQr ? { signedQr: row.signedQr } : {}),
    ...(typeof row.cancelledAt === 'string' && row.cancelledAt ? { cancelledAt: row.cancelledAt } : {}),
    ...(typeof row.cancelReason === 'string' && row.cancelReason ? { cancelReason: row.cancelReason } : {}),
  };
}

export async function generateSalesInvoiceEInvoice(
  organisationId: string,
  invoiceId: string,
): Promise<EInvoiceResult> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-invoice/generate?organisationId=${encodeURIComponent(organisationId)}`,
    { method: 'POST' },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? 'Failed to generate IRN');
  }
  const data = normalizeEInvoiceResult(body);
  if (!data) throw new Error('Failed to generate IRN');
  return data;
}

export async function fetchSalesInvoiceEInvoiceStatus(
  organisationId: string,
  invoiceId: string,
): Promise<EInvoiceResult> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-invoice?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? 'Failed to load e-Invoice status');
  }
  const data = normalizeEInvoiceResult(body);
  if (!data) throw new Error('Failed to load e-Invoice status');
  return data;
}

export async function cancelSalesInvoiceEInvoice(
  organisationId: string,
  invoiceId: string,
  reason = '1',
): Promise<EInvoiceResult> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-invoice/cancel?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? 'Failed to cancel IRN');
  }
  const data = normalizeEInvoiceResult(body);
  if (!data) throw new Error('Failed to cancel IRN');
  return data;
}


export async function generateSalesInvoiceEWayBill(
  organisationId: string,
  invoiceId: string,
  payload: { vehicleNumber?: string; transporterId?: string } = {},
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-way-bill/generate?organisationId=${encodeURIComponent(organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to generate E-Way Bill");
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  return (root?.data as Record<string, unknown>) ?? {};
}

export async function fetchSalesInvoiceEWayBillStatus(
  organisationId: string,
  invoiceId: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-way-bill?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to load E-Way Bill status");
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  return (root?.data as Record<string, unknown>) ?? {};
}

export async function cancelSalesInvoiceEWayBill(
  organisationId: string,
  invoiceId: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `/api/sales/invoices/${encodeURIComponent(invoiceId)}/e-way-bill/cancel?organisationId=${encodeURIComponent(organisationId)}`,
    { method: "POST" },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) throw new Error(extractBackendError(body) ?? "Failed to cancel E-Way Bill");
  const root = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  return (root?.data as Record<string, unknown>) ?? {};
}

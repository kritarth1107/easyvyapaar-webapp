import { extractBackendError } from "@/lib/api/inventory";
import type {
  FinancePaymentDetail,
  FinancePaymentListResponse,
  FinancePaymentSummary,
  NextFinancePaymentNumber,
} from "@/lib/types/finance-payments-api";

export { extractBackendError };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function unwrapData(body: unknown): unknown {
  const root = asRecord(body);
  if (root?.success === true && root.data !== undefined) return root.data;
  return body;
}

function normalizePagination(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const page = pickNumber(row.page);
  const limit = pickNumber(row.limit);
  const total = pickNumber(row.total);
  const totalPages = pickNumber(row.totalPages);
  if (page === undefined || limit === undefined || total === undefined || totalPages === undefined) {
    return null;
  }
  return { page, limit, total, totalPages };
}

export function normalizeNextFinancePaymentNumber(raw: unknown): NextFinancePaymentNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const paymentPrefix = pickString(row.paymentPrefix);
  const paymentNumber = pickString(row.paymentNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!paymentPrefix || !paymentNumber || !suggestedDisplay) return null;
  return { paymentPrefix, paymentNumber, suggestedDisplay };
}

export function normalizeFinancePaymentSummary(raw: unknown): FinancePaymentSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const entryId = pickString(row.entryId);
  const sourceType = pickString(row.sourceType) as FinancePaymentSummary["sourceType"] | undefined;
  const paymentId = pickString(row.paymentId);
  const paymentType = pickString(row.paymentType) as FinancePaymentSummary["paymentType"] | undefined;
  const displayNumber = pickString(row.displayNumber);
  const partyId = pickString(row.partyId) ?? "";
  const partyName = pickString(row.partyName);
  const paymentDate = pickString(row.paymentDate);
  const amount = pickNumber(row.amount);
  const paymentMode = pickString(row.paymentMode) as FinancePaymentSummary["paymentMode"] | undefined;
  const status = pickString(row.status) as FinancePaymentSummary["status"] | undefined;
  const unallocatedAmount = pickNumber(row.unallocatedAmount);

  const validSource =
    sourceType === "finance_voucher" ||
    sourceType === "invoice_payment" ||
    sourceType === "sales_return_refund" ||
    sourceType === "credit_note_refund" ||
    sourceType === "purchase_payment" ||
    sourceType === "expense";

  if (
    !entryId ||
    !validSource ||
    !paymentId ||
    (paymentType !== "payment_in" && paymentType !== "payment_out") ||
    !displayNumber ||
    !partyName ||
    !paymentDate ||
    amount === undefined ||
    !paymentMode ||
    !status ||
    unallocatedAmount === undefined
  ) {
    return null;
  }

  return {
    entryId,
    sourceType,
    paymentId,
    paymentType,
    displayNumber,
    partyId,
    partyName,
    paymentDate,
    amount,
    paymentMode,
    status,
    unallocatedAmount,
    ...(pickString(row.partyPhone) && { partyPhone: pickString(row.partyPhone) }),
    ...(pickString(row.invoiceId) && { invoiceId: pickString(row.invoiceId) }),
    ...(pickString(row.invoiceDisplayNumber) && {
      invoiceDisplayNumber: pickString(row.invoiceDisplayNumber),
    }),
    ...(pickNumber(row.grossAmount) !== undefined && { grossAmount: pickNumber(row.grossAmount) }),
    ...(pickNumber(row.refundedAmount) !== undefined && {
      refundedAmount: pickNumber(row.refundedAmount),
    }),
    ...(pickNumber(row.netAmount) !== undefined && { netAmount: pickNumber(row.netAmount) }),
    ...(pickString(row.adjustmentLabel) && { adjustmentLabel: pickString(row.adjustmentLabel) }),
    ...(pickString(row.description) && { description: pickString(row.description) }),
  };
}

function normalizeAllocation(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const invoiceId = pickString(row.invoiceId);
  const invoiceDisplayNumber = pickString(row.invoiceDisplayNumber);
  const amount = pickNumber(row.amount);
  if (!invoiceId || !invoiceDisplayNumber || amount === undefined) return null;
  return { invoiceId, invoiceDisplayNumber, amount };
}

export function normalizeFinancePaymentDetail(raw: unknown): FinancePaymentDetail | null {
  const summary = normalizeFinancePaymentSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;
  if (summary.sourceType !== "finance_voucher") return null;

  const organisationId = pickString(row.organisationId);
  const paymentPrefix = pickString(row.paymentPrefix) ?? "";
  const paymentNumber = pickString(row.paymentNumber);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (!organisationId || !paymentNumber || !createdByUserId || !createdAt || !updatedAt) {
    return null;
  }

  const allocations = Array.isArray(row.allocations)
    ? row.allocations
        .map((item) => normalizeAllocation(item))
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  return {
    ...summary,
    organisationId,
    paymentPrefix,
    paymentNumber,
    allocations,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.partyPhone) && { partyPhone: pickString(row.partyPhone) }),
    ...(pickString(row.referenceNumber) && { referenceNumber: pickString(row.referenceNumber) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizeFinancePaymentListResponse(body: unknown): FinancePaymentListResponse {
  const data = unwrapData(body);
  const row = asRecord(data);
  const itemsRaw = Array.isArray(data) ? data : Array.isArray(row?.items) ? row.items : [];
  const pagination = normalizePagination(row?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: itemsRaw
      .map((item) => normalizeFinancePaymentSummary(item))
      .filter((item): item is FinancePaymentSummary => item !== null),
    pagination,
  };
}

export function normalizeFinancePaymentDetailResponse(body: unknown): FinancePaymentDetail | null {
  return normalizeFinancePaymentDetail(unwrapData(body));
}

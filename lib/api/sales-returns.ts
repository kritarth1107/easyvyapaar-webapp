import { extractBackendError } from "@/lib/api/inventory";
import { inferSalesTaxMode, normalizeSalesTaxMode } from "@/lib/sales/invoice-tax";
import type {
  NextSalesReturnNumber,
  SalesReturnDetail,
  SalesReturnListResponse,
  SalesReturnSummary,
} from "@/lib/types/sales-returns-api";

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

export function normalizeNextSalesReturnNumber(raw: unknown): NextSalesReturnNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const returnPrefix = pickString(row.returnPrefix);
  const returnNumber = pickString(row.returnNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!returnPrefix || !returnNumber || !suggestedDisplay) return null;
  return { returnPrefix, returnNumber, suggestedDisplay };
}

export function normalizeSalesReturnSummary(raw: unknown): SalesReturnSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const salesReturnId = pickString(row.salesReturnId);
  const displayNumber = pickString(row.displayNumber);
  const invoiceId = pickString(row.invoiceId);
  const invoiceDisplayNumber = pickString(row.invoiceDisplayNumber);
  const partyName = pickString(row.partyName);
  const returnDate = pickString(row.returnDate);
  const status = pickString(row.status) as SalesReturnSummary["status"] | undefined;
  const totalAmount = pickNumber(row.totalAmount);
  const refundAmount = pickNumber(row.refundAmount);

  if (
    !salesReturnId ||
    !displayNumber ||
    !invoiceId ||
    !invoiceDisplayNumber ||
    !partyName ||
    !returnDate ||
    !status ||
    totalAmount === undefined ||
    refundAmount === undefined
  ) {
    return null;
  }

  return {
    salesReturnId,
    displayNumber,
    invoiceId,
    invoiceDisplayNumber,
    partyName,
    returnDate,
    totalAmount,
    refundAmount,
    status,
    ...(pickString(row.partyId) && { partyId: pickString(row.partyId) }),
  };
}

function normalizeSalesReturnLineItem(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;
  const lineId = pickString(row.lineId);
  const invoiceLineId = pickString(row.invoiceLineId);
  const itemId = pickString(row.itemId);
  const name = pickString(row.name);
  const unit = pickString(row.unit) ?? "";
  const hsn = pickString(row.hsn) ?? "";
  const qty = pickNumber(row.qty);
  const pricePerItem = pickNumber(row.pricePerItem);
  const discount = pickNumber(row.discount);
  const discountType = pickString(row.discountType);
  const gstPercent = pickNumber(row.gstPercent);
  const taxable = pickNumber(row.taxable);
  const tax = pickNumber(row.tax);
  const amount = pickNumber(row.amount);

  if (
    !lineId ||
    !invoiceLineId ||
    !itemId ||
    !name ||
    qty === undefined ||
    pricePerItem === undefined ||
    discount === undefined ||
    (discountType !== "percent" && discountType !== "amount") ||
    gstPercent === undefined ||
    taxable === undefined ||
    tax === undefined ||
    amount === undefined
  ) {
    return null;
  }

  return {
    lineId,
    invoiceLineId,
    itemId,
    name,
    hsn,
    qty,
    unit,
    pricePerItem,
    discount,
    discountType: discountType as "percent" | "amount",
    gstPercent,
    salesTaxMode: normalizeSalesTaxMode(
      inferSalesTaxMode({
        qty,
        pricePerItem,
        gstPercent,
        amount,
        ...(typeof row.salesTaxMode === "string"
          ? { salesTaxMode: normalizeSalesTaxMode(row.salesTaxMode) }
          : {}),
      }),
    ),
    taxable,
    tax,
    amount,
    ...(Array.isArray(row.serialNumbers)
      ? {
          serialNumbers: row.serialNumbers
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean),
        }
      : {}),
  };
}

export function normalizeSalesReturnDetail(raw: unknown): SalesReturnDetail | null {
  const summary = normalizeSalesReturnSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const returnPrefix = pickString(row.returnPrefix) ?? "";
  const returnNumber = pickString(row.returnNumber);
  const refundMode = pickString(row.refundMode) as SalesReturnDetail["refundMode"] | undefined;
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);
  const subtotal = pickNumber(row.subtotal);
  const lineTax = pickNumber(row.lineTax);
  const taxableAmount = pickNumber(row.taxableAmount);
  const isCashSale = row.isCashSale;

  if (
    !organisationId ||
    !returnNumber ||
    !refundMode ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt ||
    subtotal === undefined ||
    lineTax === undefined ||
    taxableAmount === undefined ||
    typeof isCashSale !== "boolean"
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems
        .map((line) => normalizeSalesReturnLineItem(line))
        .filter((line): line is NonNullable<typeof line> => line !== null)
    : [];

  return {
    ...summary,
    organisationId,
    isCashSale,
    returnPrefix,
    returnNumber,
    lineItems,
    subtotal,
    lineTax,
    taxableAmount,
    refundMode,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.reason) && { reason: pickString(row.reason) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.partyPhone) && { partyPhone: pickString(row.partyPhone) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizeSalesReturnListResponse(body: unknown): SalesReturnListResponse {
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
      .map((item) => normalizeSalesReturnSummary(item))
      .filter((item): item is SalesReturnSummary => item !== null),
    pagination,
  };
}

export function normalizeSalesReturnDetailResponse(body: unknown): SalesReturnDetail | null {
  return normalizeSalesReturnDetail(unwrapData(body));
}

import { extractBackendError } from "@/lib/api/inventory";
import type {
  DeliveryChallanDetail,
  DeliveryChallanListResponse,
  DeliveryChallanSummary,
  NextDeliveryChallanNumber,
} from "@/lib/types/delivery-challans-api";

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

function pickBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
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

const VALID_STATUSES = new Set(["draft", "dispatched", "delivered", "cancelled"]);

export function normalizeNextDeliveryChallanNumber(raw: unknown): NextDeliveryChallanNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const challanPrefix = pickString(row.challanPrefix);
  const challanNumber = pickString(row.challanNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!challanPrefix || !challanNumber || !suggestedDisplay) return null;
  return { challanPrefix, challanNumber, suggestedDisplay };
}

function normalizeLineItem(raw: unknown) {
  const row = asRecord(raw);
  if (!row) return null;

  const lineId = pickString(row.lineId);
  const itemId = pickString(row.itemId);
  const name = pickString(row.name);
  const hsn = pickString(row.hsn) ?? "";
  const qty = pickNumber(row.qty);
  const unit = pickString(row.unit) ?? "";
  const pricePerItem = pickNumber(row.pricePerItem);

  if (!lineId || !itemId || !name || qty === undefined || pricePerItem === undefined) {
    return null;
  }

  const serialNumbers = Array.isArray(row.serialNumbers)
    ? row.serialNumbers.map((s) => pickString(s)).filter((s): s is string => Boolean(s))
    : undefined;

  return {
    lineId,
    itemId,
    name,
    hsn,
    qty,
    unit,
    pricePerItem,
    ...(serialNumbers?.length ? { serialNumbers } : {}),
  };
}

export function normalizeDeliveryChallanSummary(raw: unknown): DeliveryChallanSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const deliveryChallanId = pickString(row.deliveryChallanId);
  const displayNumber = pickString(row.displayNumber);
  const partyName = pickString(row.partyName);
  const challanDate = pickString(row.challanDate);
  const status = pickString(row.status);
  const totalQty = pickNumber(row.totalQty);
  const lineCount = pickNumber(row.lineCount);

  if (
    !deliveryChallanId ||
    !displayNumber ||
    !partyName ||
    !challanDate ||
    !status ||
    !VALID_STATUSES.has(status) ||
    totalQty === undefined ||
    lineCount === undefined
  ) {
    return null;
  }

  return {
    deliveryChallanId,
    displayNumber,
    partyName,
    challanDate,
    totalQty,
    lineCount,
    status: status as DeliveryChallanSummary["status"],
    ...(pickString(row.partyId) ? { partyId: pickString(row.partyId) } : {}),
    ...(pickString(row.deliveryDate) ? { deliveryDate: pickString(row.deliveryDate) } : {}),
    ...(pickString(row.invoiceId) ? { invoiceId: pickString(row.invoiceId) } : {}),
    ...(pickString(row.invoiceDisplayNumber)
      ? { invoiceDisplayNumber: pickString(row.invoiceDisplayNumber) }
      : {}),
  };
}

export function normalizeDeliveryChallanDetailResponse(raw: unknown): DeliveryChallanDetail | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;

  const summary = normalizeDeliveryChallanSummary(row);
  if (!summary) return null;

  const organisationId = pickString(row.organisationId);
  const challanPrefix = pickString(row.challanPrefix);
  const challanNumber = pickString(row.challanNumber);
  const stockDeducted = pickBoolean(row.stockDeducted);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (
    !organisationId ||
    !challanPrefix ||
    !challanNumber ||
    stockDeducted === undefined ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems.map(normalizeLineItem).filter((line): line is NonNullable<typeof line> => line !== null)
    : [];

  return {
    ...summary,
    organisationId,
    challanPrefix,
    challanNumber,
    lineItems,
    stockDeducted,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.shippingAddress) ? { shippingAddress: pickString(row.shippingAddress) } : {}),
    ...(pickString(row.vehicleNumber) ? { vehicleNumber: pickString(row.vehicleNumber) } : {}),
    ...(pickString(row.transportRef) ? { transportRef: pickString(row.transportRef) } : {}),
    ...(pickString(row.notes) ? { notes: pickString(row.notes) } : {}),
    ...(pickString(row.partyPhone) ? { partyPhone: pickString(row.partyPhone) } : {}),
    ...(pickString(row.updatedByUserId) ? { updatedByUserId: pickString(row.updatedByUserId) } : {}),
  };
}

export function normalizeDeliveryChallanListResponse(raw: unknown): DeliveryChallanListResponse {
  const data = asRecord(unwrapData(raw));
  const itemsRaw = Array.isArray(data?.items) ? data.items : [];
  const pagination = normalizePagination(data?.pagination);

  return {
    items: itemsRaw
      .map(normalizeDeliveryChallanSummary)
      .filter((row): row is DeliveryChallanSummary => row !== null),
    pagination: pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

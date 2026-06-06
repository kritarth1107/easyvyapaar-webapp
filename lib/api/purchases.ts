import { extractBackendError } from "@/lib/api/inventory";
import type {
  NextPurchaseNumber,
  PurchaseBillDetail,
  PurchaseBillListResponse,
  PurchaseBillSummary,
  PurchaseLineItem,
  PurchaseOrderDetail,
  PurchaseOrderListResponse,
  PurchaseOrderSummary,
  PurchaseReturnDetail,
  PurchaseReturnListResponse,
  PurchaseReturnSummary,
} from "@/lib/types/purchase-api";

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

function normalizeLineItem(raw: unknown): PurchaseLineItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const lineId = pickString(row.lineId, row.id);
  const itemId = pickString(row.itemId);
  const name = pickString(row.name);
  const qty = pickNumber(row.qty);
  const pricePerItem = pickNumber(row.pricePerItem);
  const discount = pickNumber(row.discount);
  const discountType = pickString(row.discountType);
  const gstPercent = pickNumber(row.gstPercent);
  const taxable = pickNumber(row.taxable);
  const tax = pickNumber(row.tax);
  const amount = pickNumber(row.amount);
  const purchaseTaxMode = pickString(row.purchaseTaxMode, row.salesTaxMode);

  if (
    !lineId ||
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
    itemId,
    name,
    hsn: pickString(row.hsn) ?? "",
    qty,
    unit: pickString(row.unit) ?? "",
    pricePerItem,
    discount,
    discountType: discountType as "percent" | "amount",
    gstPercent,
    purchaseTaxMode:
      purchaseTaxMode === "without_tax" ? "without_tax" : "with_tax",
    taxable,
    tax,
    amount,
  };
}

export function normalizeNextPurchaseNumber(raw: unknown): NextPurchaseNumber | null {
  const row = asRecord(unwrapData(raw));
  if (!row) return null;
  const prefix = pickString(row.prefix, row.billPrefix, row.orderPrefix, row.returnPrefix);
  const number = pickString(row.number, row.billNumber, row.orderNumber, row.returnNumber);
  const suggestedDisplay = pickString(row.suggestedDisplay);
  if (!prefix || !number || !suggestedDisplay) return null;
  return { prefix, number, suggestedDisplay };
}

export function normalizePurchaseBillSummary(raw: unknown): PurchaseBillSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const purchaseBillId = pickString(row.purchaseBillId, row.billId);
  const displayNumber = pickString(row.displayNumber);
  const partyId = pickString(row.partyId);
  const partyName = pickString(row.partyName);
  const billDate = pickString(row.billDate);
  const totalAmount = pickNumber(row.totalAmount);
  const paidAmount = pickNumber(row.paidAmount) ?? pickNumber(row.amountPaid) ?? 0;
  const balanceAmount =
    pickNumber(row.balanceAmount) ??
    (totalAmount !== undefined ? Math.max(0, totalAmount - paidAmount) : undefined);
  const rawStatus = pickString(row.status);
  let paymentStatus = pickString(row.paymentStatus) as PurchaseBillSummary["paymentStatus"] | undefined;
  if (!paymentStatus && totalAmount !== undefined) {
    if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = "paid";
    else if (paidAmount > 0) paymentStatus = "partial";
    else paymentStatus = "pending";
  }
  let status: PurchaseBillSummary["status"] = "completed";
  if (rawStatus === "cancelled") status = "cancelled";
  else if (rawStatus === "draft") status = "draft";

  if (
    !purchaseBillId ||
    !displayNumber ||
    !partyId ||
    !partyName ||
    !billDate ||
    totalAmount === undefined ||
    balanceAmount === undefined ||
    !paymentStatus
  ) {
    return null;
  }

  return {
    purchaseBillId,
    displayNumber,
    partyId,
    partyName,
    billDate,
    totalAmount,
    paidAmount,
    balanceAmount,
    paymentStatus,
    status,
  };
}

export function normalizePurchaseBillDetail(raw: unknown): PurchaseBillDetail | null {
  const summary = normalizePurchaseBillSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const billPrefix = pickString(row.billPrefix) ?? "";
  const billNumber = pickString(row.billNumber);
  const subtotal = pickNumber(row.subtotal);
  const lineTax = pickNumber(row.lineTax);
  const taxableAmount = pickNumber(row.taxableAmount);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (
    !organisationId ||
    !billNumber ||
    subtotal === undefined ||
    lineTax === undefined ||
    taxableAmount === undefined ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems
        .map((line) => normalizeLineItem(line))
        .filter((line): line is PurchaseLineItem => line !== null)
    : [];

  return {
    ...summary,
    organisationId,
    billPrefix,
    billNumber,
    lineItems,
    subtotal,
    lineTax,
    taxableAmount,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.attachmentFilename) && {
      attachmentFilename: pickString(row.attachmentFilename),
    }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizePurchaseBillListResponse(body: unknown): PurchaseBillListResponse {
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
      .map((item) => normalizePurchaseBillSummary(item))
      .filter((item): item is PurchaseBillSummary => item !== null),
    pagination,
  };
}

export function normalizePurchaseBillDetailResponse(body: unknown): PurchaseBillDetail | null {
  return normalizePurchaseBillDetail(unwrapData(body));
}

export function normalizePurchaseOrderSummary(raw: unknown): PurchaseOrderSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const purchaseOrderId = pickString(row.purchaseOrderId, row.orderId);
  const displayNumber = pickString(row.displayNumber);
  const partyId = pickString(row.partyId);
  const partyName = pickString(row.partyName);
  const orderDate = pickString(row.orderDate);
  const totalAmount = pickNumber(row.totalAmount);
  const rawStatus = pickString(row.status);
  const statusMap: Record<string, PurchaseOrderSummary["status"]> = {
    draft: "draft",
    sent: "open",
    open: "open",
    partial_received: "partial",
    partial: "partial",
    received: "received",
    cancelled: "cancelled",
  };
  const status = rawStatus ? statusMap[rawStatus] : undefined;

  if (!purchaseOrderId || !displayNumber || !partyId || !partyName || !orderDate || totalAmount === undefined || !status) {
    return null;
  }

  return {
    purchaseOrderId,
    displayNumber,
    partyId,
    partyName,
    orderDate,
    totalAmount,
    status,
    ...(pickString(row.expectedDate) && { expectedDate: pickString(row.expectedDate) }),
  };
}

export function normalizePurchaseOrderDetail(raw: unknown): PurchaseOrderDetail | null {
  const summary = normalizePurchaseOrderSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const orderPrefix = pickString(row.orderPrefix) ?? "";
  const orderNumber = pickString(row.orderNumber);
  const subtotal = pickNumber(row.subtotal);
  const lineTax = pickNumber(row.lineTax);
  const taxableAmount = pickNumber(row.taxableAmount);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (
    !organisationId ||
    !orderNumber ||
    subtotal === undefined ||
    lineTax === undefined ||
    taxableAmount === undefined ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems
        .map((line) => normalizeLineItem(line))
        .filter((line): line is PurchaseLineItem => line !== null)
    : [];

  return {
    ...summary,
    organisationId,
    orderPrefix,
    orderNumber,
    lineItems,
    subtotal,
    lineTax,
    taxableAmount,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickNumber(row.receivedQty) !== undefined && { receivedQty: pickNumber(row.receivedQty) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizePurchaseOrderListResponse(body: unknown): PurchaseOrderListResponse {
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
      .map((item) => normalizePurchaseOrderSummary(item))
      .filter((item): item is PurchaseOrderSummary => item !== null),
    pagination,
  };
}

export function normalizePurchaseOrderDetailResponse(body: unknown): PurchaseOrderDetail | null {
  return normalizePurchaseOrderDetail(unwrapData(body));
}

export function normalizePurchaseReturnSummary(raw: unknown): PurchaseReturnSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const purchaseReturnId = pickString(row.purchaseReturnId, row.returnId);
  const displayNumber = pickString(row.displayNumber);
  const purchaseBillId = pickString(row.purchaseBillId, row.billId);
  const purchaseBillDisplayNumber = pickString(row.purchaseBillDisplayNumber, row.billDisplayNumber);
  const partyId = pickString(row.partyId);
  const partyName = pickString(row.partyName);
  const returnDate = pickString(row.returnDate);
  const totalAmount = pickNumber(row.totalAmount);
  const status = pickString(row.status) as PurchaseReturnSummary["status"] | undefined;

  if (
    !purchaseReturnId ||
    !displayNumber ||
    !purchaseBillId ||
    !purchaseBillDisplayNumber ||
    !partyId ||
    !partyName ||
    !returnDate ||
    totalAmount === undefined ||
    !status
  ) {
    return null;
  }

  return {
    purchaseReturnId,
    displayNumber,
    purchaseBillId,
    purchaseBillDisplayNumber,
    partyId,
    partyName,
    returnDate,
    totalAmount,
    status,
  };
}

export function normalizePurchaseReturnDetail(raw: unknown): PurchaseReturnDetail | null {
  const summary = normalizePurchaseReturnSummary(raw);
  const row = asRecord(raw);
  if (!summary || !row) return null;

  const organisationId = pickString(row.organisationId);
  const returnPrefix = pickString(row.returnPrefix) ?? "";
  const returnNumber = pickString(row.returnNumber);
  const subtotal = pickNumber(row.subtotal);
  const lineTax = pickNumber(row.lineTax);
  const taxableAmount = pickNumber(row.taxableAmount);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (
    !organisationId ||
    !returnNumber ||
    subtotal === undefined ||
    lineTax === undefined ||
    taxableAmount === undefined ||
    !createdByUserId ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  const lineItems = Array.isArray(row.lineItems)
    ? row.lineItems
        .map((line) => normalizeLineItem(line))
        .filter((line): line is PurchaseLineItem => line !== null)
    : [];

  return {
    ...summary,
    organisationId,
    returnPrefix,
    returnNumber,
    lineItems,
    subtotal,
    lineTax,
    taxableAmount,
    createdByUserId,
    createdAt,
    updatedAt,
    ...(pickString(row.reason) && { reason: pickString(row.reason) }),
    ...(pickString(row.notes) && { notes: pickString(row.notes) }),
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
  };
}

export function normalizePurchaseReturnListResponse(body: unknown): PurchaseReturnListResponse {
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
      .map((item) => normalizePurchaseReturnSummary(item))
      .filter((item): item is PurchaseReturnSummary => item !== null),
    pagination,
  };
}

export function normalizePurchaseReturnDetailResponse(body: unknown): PurchaseReturnDetail | null {
  return normalizePurchaseReturnDetail(unwrapData(body));
}

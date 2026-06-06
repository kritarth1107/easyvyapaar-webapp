import type { InventoryItem } from "@/lib/dashboard/mock-inventory-items";
import { GST_RATE_OPTIONS } from "@/lib/inventory/create-item-form";
import type {
  CreateInventoryItemRequest,
  InventoryCategory,
  InventoryItemDetail,
  InventoryItemListResponse,
  InventoryItemSummary,
  InventoryStockAdjustment,
  InventoryStockStats,
  PaginationMeta,
  StockAdjustmentResult,
  StockAdjustmentType,
} from "@/lib/types/inventory-api";

const GST_RATE_SET = new Set<string>(GST_RATE_OPTIONS);

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

export function extractBackendError(body: unknown): string | null {
  const root = asRecord(body);
  if (!root) return null;
  if (typeof root.error === "string" && root.error.trim()) return root.error;
  const nested = root.error;
  if (typeof nested === "object" && nested !== null) {
    const err = nested as Record<string, unknown>;
    if (typeof err.details === "string" && err.details.trim()) return err.details;
    if (typeof err.description === "string" && err.description.trim()) return err.description;
  }
  if (typeof root.message === "string" && root.message.trim()) return root.message;
  return null;
}

export function mapSummaryToTableItem(summary: InventoryItemSummary): InventoryItem {
  return {
    id: summary.itemId,
    name: summary.name,
    sku: summary.sku,
    hsn: summary.hsn ?? "",
    category: summary.category,
    stock: summary.stock,
    unit: summary.unit,
    salePrice: summary.salePrice,
    purchasePrice: summary.purchasePrice,
    gstPercent: summary.gstPercent,
    salesTaxMode: summary.salesTaxMode,
    serialised: summary.serialised,
    status: summary.status,
    ...(summary.availableSerialNumbers?.length
      ? { availableSerials: summary.availableSerialNumbers }
      : {}),
  };
}

export function normalizeItemSummary(raw: unknown): InventoryItemSummary | null {
  const row = asRecord(raw);
  if (!row) return null;

  const itemId = pickString(row.itemId, row.id);
  const name = pickString(row.name);
  const sku = pickString(row.sku, row.itemCode);
  const category = pickString(row.category, row.categoryName);
  const unit = pickString(row.unit);
  const status = pickString(row.status) as InventoryItemSummary["status"] | undefined;

  if (!itemId || !name || !sku || !category || !unit || !status) return null;

  const gstRate = pickString(row.gstRate);
  const gstPercent =
    pickNumber(row.gstPercent) ??
    (gstRate && gstRate !== "none" ? pickNumber(gstRate) : undefined) ??
    0;

  return {
    itemId,
    name,
    sku,
    ...(pickString(row.hsn) && { hsn: pickString(row.hsn) }),
    category,
    stock: pickNumber(row.stock ?? row.currentStock) ?? 0,
    unit,
    salePrice: pickNumber(row.salePrice ?? row.salesPrice) ?? 0,
    purchasePrice: pickNumber(row.purchasePrice) ?? 0,
    gstPercent,
    salesTaxMode:
      pickString(row.salesTaxMode) === "without_tax" ? "without_tax" : "with_tax",
    serialised: Boolean(row.serialised),
    status,
    ...(Array.isArray(row.availableSerialNumbers)
      ? {
          availableSerialNumbers: row.availableSerialNumbers
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean),
        }
      : {}),
  };
}

export function normalizeItemSummaryList(raw: unknown): InventoryItemSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeItemSummary(item))
    .filter((item): item is InventoryItemSummary => item !== null);
}

export function normalizeCategory(raw: unknown): InventoryCategory | null {
  const row = asRecord(raw);
  if (!row) return null;

  const categoryId = pickString(row.categoryId);
  const organisationId = pickString(row.organisationId);
  const name = pickString(row.name);
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const updatedAt = pickString(row.updatedAt);

  if (!categoryId || !organisationId || !name || !createdByUserId || !createdAt || !updatedAt) {
    return null;
  }

  return {
    categoryId,
    organisationId,
    name,
    isActive: Boolean(row.isActive ?? true),
    createdByUserId,
    createdAt,
    updatedAt,
  };
}

export function normalizeCategoryList(raw: unknown): InventoryCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeCategory(item))
    .filter((item): item is InventoryCategory => item !== null);
}

export function normalizeItemDetail(raw: unknown): InventoryItemDetail | null {
  const row = asRecord(raw);
  if (!row) return null;

  const itemId = pickString(row.itemId);
  const organisationId = pickString(row.organisationId);
  const categoryId = pickString(row.categoryId);
  const categoryName = pickString(row.categoryName);
  const name = pickString(row.name);
  const itemType = pickString(row.itemType);
  const unit = pickString(row.unit);
  const itemCode = pickString(row.itemCode);
  const asOfDate = pickString(row.asOfDate);

  if (
    !itemId ||
    !organisationId ||
    !categoryId ||
    !categoryName ||
    !name ||
    (itemType !== "product" && itemType !== "service") ||
    !unit ||
    !itemCode ||
    !asOfDate
  ) {
    return null;
  }

  const salesTaxMode = pickString(row.salesTaxMode);
  const purchaseTaxMode = pickString(row.purchaseTaxMode);
  const gstRate = pickString(row.gstRate);
  const status = pickString(row.status);

  if (
    (salesTaxMode !== "with_tax" && salesTaxMode !== "without_tax") ||
    (purchaseTaxMode !== "with_tax" && purchaseTaxMode !== "without_tax") ||
    !gstRate ||
    !GST_RATE_SET.has(gstRate) ||
    (status !== "ACTIVE" && status !== "INACTIVE" && status !== "ARCHIVED")
  ) {
    return null;
  }

  const serialNumbers = Array.isArray(row.serialNumbers)
    ? row.serialNumbers
        .map((entry) => {
          const serial = asRecord(entry);
          if (!serial) return null;
          const serialNumber = pickString(serial.serialNumber);
          const dateCreated = pickString(serial.dateCreated);
          const serialStatus = pickString(serial.status);
          if (!serialNumber || !dateCreated || !serialStatus) return null;
          return { serialNumber, dateCreated, status: serialStatus };
        })
        .filter((entry): entry is InventoryItemDetail["serialNumbers"][number] => entry !== null)
    : [];

  const partyPrices = Array.isArray(row.partyPrices)
    ? row.partyPrices
        .map((entry) => {
          const party = asRecord(entry);
          if (!party) return null;
          const partyId = pickString(party.partyId);
          const price = pickNumber(party.price);
          if (!partyId || price === undefined) return null;
          return { partyId, price };
        })
        .filter((entry): entry is InventoryItemDetail["partyPrices"][number] => entry !== null)
    : [];

  const customFields = Array.isArray(row.customFields)
    ? row.customFields
        .map((entry) => {
          const fieldRow = asRecord(entry);
          if (!fieldRow) return null;
          const field = pickString(fieldRow.field);
          const value = pickString(fieldRow.value);
          if (!field || !value) return null;
          return { field, value };
        })
        .filter((entry): entry is InventoryItemDetail["customFields"][number] => entry !== null)
    : [];

  const purchaseSuppliers = Array.isArray(row.purchaseSuppliers)
    ? row.purchaseSuppliers
        .map((entry) => {
          const supplierRow = asRecord(entry);
          if (!supplierRow) return null;
          const partyId = pickString(supplierRow.partyId);
          if (!partyId) return null;
          return { partyId };
        })
        .filter((entry): entry is InventoryItemDetail["purchaseSuppliers"][number] => entry !== null)
    : [];

  return {
    itemId,
    organisationId,
    categoryId,
    categoryName,
    itemType,
    name,
    showInOnlineStore: Boolean(row.showInOnlineStore),
    salesPrice: pickNumber(row.salesPrice) ?? 0,
    salesTaxMode,
    purchasePrice: pickNumber(row.purchasePrice) ?? 0,
    purchaseTaxMode,
    gstRate,
    salesDiscountPercent: pickNumber(row.salesDiscountPercent) ?? 0,
    unit,
    openingStock: pickNumber(row.openingStock) ?? 0,
    currentStock: pickNumber(row.currentStock) ?? 0,
    serialised: Boolean(row.serialised),
    serialNumbers,
    itemCode,
    ...(pickString(row.hsn) && { hsn: pickString(row.hsn) }),
    asOfDate,
    lowStockWarning: Boolean(row.lowStockWarning),
    lowStockQty: pickNumber(row.lowStockQty) ?? 0,
    ...(pickString(row.description) && { description: pickString(row.description) }),
    partyPrices,
    customFields,
    purchaseSuppliers,
    status,
    createdByUserId: pickString(row.createdByUserId) ?? "",
    ...(pickString(row.updatedByUserId) && { updatedByUserId: pickString(row.updatedByUserId) }),
    createdAt: pickString(row.createdAt) ?? "",
    updatedAt: pickString(row.updatedAt) ?? "",
  };
}

export function buildCreateItemBackendPayload(
  input: CreateInventoryItemRequest,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    categoryId: input.categoryId.trim(),
    itemType: input.itemType ?? "product",
    name: input.name.trim(),
    showInOnlineStore: input.showInOnlineStore ?? false,
    salesPrice: input.salesPrice ?? 0,
    salesTaxMode: input.salesTaxMode ?? "with_tax",
    purchasePrice: input.purchasePrice ?? 0,
    purchaseTaxMode: input.purchaseTaxMode ?? "without_tax",
    gstRate: input.gstRate ?? "none",
    salesDiscountPercent: input.salesDiscountPercent ?? 0,
    unit: input.unit.trim(),
    openingStock: input.openingStock ?? 0,
    serialised: input.serialised ?? false,
    serialNumbers: (input.serialNumbers ?? []).map((row) => ({
      serialNumber: row.serialNumber.trim(),
      dateCreated: row.dateCreated,
    })),
    itemCode: input.itemCode.trim(),
    asOfDate: input.asOfDate,
    lowStockWarning: input.lowStockWarning ?? false,
    lowStockQty: input.lowStockQty ?? 0,
    partyPrices: (input.partyPrices ?? []).filter((row) => row.partyId.trim() && row.price >= 0),
    customFields: (input.customFields ?? []).filter(
      (row) => row.field.trim() && row.value.trim(),
    ),
    purchaseSuppliers: (input.purchaseSuppliers ?? []).filter((row) => row.partyId.trim()),
  };

  const hsn = input.hsn?.trim();
  if (hsn) payload.hsn = hsn;

  const description = input.description?.trim();
  if (description) payload.description = description;

  return payload;
}

function normalizePagination(raw: unknown): PaginationMeta | null {
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

export function normalizeInventoryListResponse(body: unknown): InventoryItemSummary[] {
  return normalizeInventoryPaginatedResponse(body).items;
}

export function normalizeInventoryPaginatedResponse(body: unknown): InventoryItemListResponse {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const dataRow = asRecord(data);

  const itemsRaw = Array.isArray(data)
    ? data
    : Array.isArray(dataRow?.items)
      ? dataRow.items
      : [];

  const pagination = normalizePagination(dataRow?.pagination) ?? {
    page: 1,
    limit: itemsRaw.length,
    total: itemsRaw.length,
    totalPages: itemsRaw.length > 0 ? 1 : 0,
  };

  return {
    items: normalizeItemSummaryList(itemsRaw),
    pagination,
  };
}

export function normalizeInventoryStockStats(body: unknown): InventoryStockStats | null {
  const root = asRecord(body);
  const data = root?.success === true ? root.data : body;
  const row = asRecord(data);
  if (!row) return null;

  const stockValue = pickNumber(row.stockValue);
  const lowStockCount = pickNumber(row.lowStockCount);
  const totalItems = pickNumber(row.totalItems);

  if (stockValue === undefined || lowStockCount === undefined || totalItems === undefined) {
    return null;
  }

  return { stockValue, lowStockCount, totalItems };
}

export function normalizeItemDetailList(raw: unknown): InventoryItemDetail[] {
  const root = asRecord(raw);
  const list = root?.success === true ? root.data : raw;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => normalizeItemDetail(entry))
    .filter((entry): entry is InventoryItemDetail => entry !== null);
}

export function normalizeInventoryDetailResponse(body: unknown): InventoryItemDetail | null {
  const root = asRecord(body);
  if (!root || root.success !== true) return null;
  return normalizeItemDetail(root.data);
}

export function normalizeCategoryListResponse(body: unknown): InventoryCategory[] {
  const root = asRecord(body);
  if (!root || root.success !== true) return [];
  return normalizeCategoryList(root.data);
}

export function normalizeStockAdjustment(raw: unknown): InventoryStockAdjustment | null {
  const row = asRecord(raw);
  if (!row) return null;

  const adjustmentId = pickString(row.adjustmentId);
  const organisationId = pickString(row.organisationId);
  const itemId = pickString(row.itemId);
  const itemName = pickString(row.itemName);
  const unit = pickString(row.unit);
  const adjustmentDate = pickString(row.adjustmentDate);
  const type = pickString(row.type) as StockAdjustmentType | undefined;
  const createdByUserId = pickString(row.createdByUserId);
  const createdAt = pickString(row.createdAt);
  const quantity = pickNumber(row.quantity);

  if (
    !adjustmentId ||
    !organisationId ||
    !itemId ||
    !itemName ||
    !unit ||
    !adjustmentDate ||
    (type !== "add" && type !== "reduce") ||
    quantity === undefined ||
    !createdByUserId ||
    !createdAt
  ) {
    return null;
  }

  const serialNumbers = Array.isArray(row.serialNumbers)
    ? row.serialNumbers
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    adjustmentId,
    organisationId,
    itemId,
    itemName,
    unit,
    adjustmentDate,
    type,
    quantity,
    ...(serialNumbers.length > 0 && { serialNumbers }),
    ...(pickString(row.remarks) && { remarks: pickString(row.remarks) }),
    stockBefore: pickNumber(row.stockBefore) ?? 0,
    stockAfter: pickNumber(row.stockAfter) ?? 0,
    createdByUserId,
    createdAt,
  };
}

export function normalizeStockAdjustmentList(raw: unknown): InventoryStockAdjustment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => normalizeStockAdjustment(entry))
    .filter((entry): entry is InventoryStockAdjustment => entry !== null);
}

export function normalizeStockAdjustmentListResponse(body: unknown): InventoryStockAdjustment[] {
  const root = asRecord(body);
  if (!root || root.success !== true) return [];
  return normalizeStockAdjustmentList(root.data);
}

export function normalizeStockAdjustmentResult(body: unknown): StockAdjustmentResult | null {
  const root = asRecord(body);
  if (!root || root.success !== true) return null;
  const data = asRecord(root.data);
  if (!data) return null;
  const adjustment = normalizeStockAdjustment(data.adjustment);
  const item = normalizeItemDetail(data.item);
  if (!adjustment || !item) return null;
  return { adjustment, item };
}

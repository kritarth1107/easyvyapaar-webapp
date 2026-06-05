import type { InventoryItem } from "@/lib/dashboard/mock-inventory-items";
import { GST_RATE_OPTIONS } from "@/lib/inventory/create-item-form";
import type {
  CreateInventoryItemRequest,
  InventoryCategory,
  InventoryItemDetail,
  InventoryItemSummary,
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
    serialised: summary.serialised,
    status: summary.status,
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
    gstPercent: pickNumber(row.gstPercent) ?? 0,
    serialised: Boolean(row.serialised),
    status,
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
  };

  const hsn = input.hsn?.trim();
  if (hsn) payload.hsn = hsn;

  const description = input.description?.trim();
  if (description) payload.description = description;

  return payload;
}

export function normalizeInventoryListResponse(body: unknown): InventoryItemSummary[] {
  const root = asRecord(body);
  if (!root || root.success !== true) return [];
  return normalizeItemSummaryList(root.data);
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

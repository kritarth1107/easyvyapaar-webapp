import {
  extractBackendError,
  mapSummaryToTableItem,
  normalizeCategory,
  normalizeCategoryListResponse,
  normalizeInventoryDetailResponse,
  normalizeInventoryPaginatedResponse,
  normalizeInventoryStockStats,
  normalizeItemDetailList,
  normalizeStockAdjustmentListResponse,
  normalizeStockAdjustmentResult,
} from "@/lib/api/inventory";
import type { InventoryItem } from "@/lib/dashboard/mock-inventory-items";
import type {
  CreateInventoryItemRequest,
  CreateStockAdjustmentRequest,
  InventoryCategory,
  InventoryItemDetail,
  InventoryItemListParams,
  InventoryItemListResponse,
  InventoryStockAdjustment,
  InventoryStockStats,
  StockAdjustmentResult,
} from "@/lib/types/inventory-api";

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchInventoryCategories(
  organisationId: string,
): Promise<InventoryCategory[]> {
  const res = await fetch(
    `/api/inventory/categories?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load categories");
  }
  return normalizeCategoryListResponse(body);
}

export async function createInventoryCategory(
  organisationId: string,
  name: string,
): Promise<InventoryCategory> {
  const res = await fetch("/api/inventory/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organisationId, name }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to create category");
  }
  const category = normalizeCategory((body as { data?: unknown }).data);
  if (!category) {
    throw new Error("Failed to create category");
  }
  return category;
}

function buildInventoryListQuery(organisationId: string, params: InventoryItemListParams = {}): string {
  const search = new URLSearchParams({ organisationId });
  if (params.search?.trim()) search.set("search", params.search.trim());
  if (params.category && params.category !== "all") search.set("category", params.category);
  if (params.stockStatus) search.set("stockStatus", params.stockStatus);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  return search.toString();
}

/** Backend pagination cap (`paginationQuerySchema.limit.max`). */
export const INVENTORY_LIST_MAX_LIMIT = 100;

export async function fetchInventoryItems(
  organisationId: string,
  params: InventoryItemListParams = {},
): Promise<InventoryItemListResponse & { tableItems: InventoryItem[] }> {
  const res = await fetch(`/api/inventory/items?${buildInventoryListQuery(organisationId, params)}`);
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load items");
  }
  const data = normalizeInventoryPaginatedResponse(body);
  return {
    ...data,
    tableItems: data.items.map(mapSummaryToTableItem),
  };
}

export async function fetchAllInventoryItems(
  organisationId: string,
  params: Omit<InventoryItemListParams, "page" | "limit"> = {},
): Promise<InventoryItem[]> {
  const all: InventoryItem[] = [];
  let page = 1;

  while (true) {
    const batch = await fetchInventoryItems(organisationId, {
      ...params,
      page,
      limit: INVENTORY_LIST_MAX_LIMIT,
    });
    all.push(...batch.tableItems);

    const totalPages = batch.pagination.totalPages;
    if (!totalPages || page >= totalPages) break;
    page += 1;
  }

  return all;
}

export async function fetchInventoryStockStats(organisationId: string): Promise<InventoryStockStats> {
  const res = await fetch(
    `/api/inventory/items/stats?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load stock stats");
  }
  const stats = normalizeInventoryStockStats(body);
  if (!stats) {
    throw new Error("Failed to load stock stats");
  }
  return stats;
}

export async function fetchSerialTrackingItems(
  organisationId: string,
): Promise<InventoryItemDetail[]> {
  const res = await fetch(
    `/api/inventory/serial-tracking?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load serial tracking data");
  }
  return normalizeItemDetailList(body);
}

export async function fetchInventoryItemDetail(
  organisationId: string,
  itemId: string,
): Promise<InventoryItemDetail> {
  const res = await fetch(
    `/api/inventory/items/${encodeURIComponent(itemId)}?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load item details");
  }
  const detail = normalizeInventoryDetailResponse(body);
  if (!detail) {
    throw new Error("Failed to load item details");
  }
  return detail;
}

export async function fetchStockAdjustments(
  organisationId: string,
  itemId: string,
): Promise<InventoryStockAdjustment[]> {
  const res = await fetch(
    `/api/inventory/items/${encodeURIComponent(itemId)}/stock-adjustments?organisationId=${encodeURIComponent(organisationId)}`,
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to load stock adjustments");
  }
  return normalizeStockAdjustmentListResponse(body);
}

export async function createStockAdjustment(
  itemId: string,
  payload: CreateStockAdjustmentRequest,
): Promise<StockAdjustmentResult> {
  const res = await fetch(
    `/api/inventory/items/${encodeURIComponent(itemId)}/stock-adjustments?organisationId=${encodeURIComponent(payload.organisationId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to adjust stock");
  }
  const result = normalizeStockAdjustmentResult(body);
  if (!result) {
    throw new Error("Failed to adjust stock");
  }
  return result;
}

export async function createInventoryItem(payload: CreateInventoryItemRequest): Promise<void> {
  const res = await fetch("/api/inventory/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(extractBackendError(body) ?? "Failed to save item");
  }
}

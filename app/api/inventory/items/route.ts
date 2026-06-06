import { NextResponse } from "next/server";
import {
  buildCreateItemBackendPayload,
  extractBackendError,
  normalizeInventoryPaginatedResponse,
  normalizeItemDetail,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";
import { GST_RATE_OPTIONS } from "@/lib/inventory/create-item-form";
import type { CreateInventoryItemRequest } from "@/lib/types/inventory-api";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GST_RATES = new Set<string>(GST_RATE_OPTIONS);

function parseCreateItemBody(body: unknown): CreateInventoryItemRequest | string {
  const root = (body ?? {}) as Partial<CreateInventoryItemRequest>;

  const organisationId = typeof root.organisationId === "string" ? root.organisationId.trim() : "";
  const categoryId = typeof root.categoryId === "string" ? root.categoryId.trim() : "";
  const name = typeof root.name === "string" ? root.name.trim() : "";
  const unit = typeof root.unit === "string" ? root.unit.trim() : "";
  const itemCode = typeof root.itemCode === "string" ? root.itemCode.trim() : "";
  const asOfDate = typeof root.asOfDate === "string" ? root.asOfDate.trim() : "";

  if (!organisationId) return "organisationId is required";
  if (!categoryId) return "categoryId is required";
  if (!name) return "Item name is required";
  if (!unit) return "Unit is required";
  if (!itemCode) return "Item code is required";
  if (!ISO_DATE.test(asOfDate)) return "asOfDate must be YYYY-MM-DD";

  if (root.itemType && root.itemType !== "product" && root.itemType !== "service") {
    return "Invalid item type";
  }

  if (root.gstRate && !GST_RATES.has(root.gstRate)) {
    return "Invalid GST rate";
  }

  if (root.salesTaxMode && root.salesTaxMode !== "with_tax" && root.salesTaxMode !== "without_tax") {
    return "Invalid sales tax mode";
  }

  if (
    root.purchaseTaxMode &&
    root.purchaseTaxMode !== "with_tax" &&
    root.purchaseTaxMode !== "without_tax"
  ) {
    return "Invalid purchase tax mode";
  }

  if (root.lowStockWarning && (root.lowStockQty ?? 0) <= 0) {
    return "lowStockQty must be greater than 0 when low stock warning is enabled";
  }

  if (root.serialised) {
    const serials = (root.serialNumbers ?? [])
      .map((row) => row.serialNumber?.trim())
      .filter(Boolean);
    if (!serials.length) return "At least one serial number is required when serialised is enabled";
    const lower = serials.map((s) => s.toLowerCase());
    if (new Set(lower).size !== lower.length) return "Duplicate serial numbers are not allowed";
  }

  return {
    organisationId,
    categoryId,
    name,
    unit,
    itemCode,
    asOfDate,
    itemType: root.itemType,
    showInOnlineStore: root.showInOnlineStore,
    salesPrice: root.salesPrice,
    salesTaxMode: root.salesTaxMode,
    purchasePrice: root.purchasePrice,
    purchaseTaxMode: root.purchaseTaxMode,
    gstRate: root.gstRate,
    salesDiscountPercent: root.salesDiscountPercent,
    openingStock: root.openingStock,
    serialised: root.serialised,
    serialNumbers: root.serialNumbers,
    hsn: root.hsn,
    lowStockWarning: root.lowStockWarning,
    lowStockQty: root.lowStockQty,
    description: root.description,
    partyPrices: root.partyPrices,
    customFields: root.customFields,
  };
}

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["search", "category", "stockStatus", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/summary${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load items" },
        { status: response.status },
      );
    }

    const data = normalizeInventoryPaginatedResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Inventory items list error:", error);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseCreateItemBody(body);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const backendPayload = buildCreateItemBackendPayload(parsed);
    const { response, body: backendBody } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(parsed.organisationId)}/items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(backendBody) ?? "Failed to create item" },
        { status: response.status },
      );
    }

    const detail = normalizeItemDetail((backendBody as { data?: unknown }).data);
    if (detail) {
      return NextResponse.json({ ...(backendBody as object), data: detail }, { status: response.status });
    }

    return NextResponse.json(backendBody, { status: response.status });
  } catch (error) {
    console.error("Inventory item create error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

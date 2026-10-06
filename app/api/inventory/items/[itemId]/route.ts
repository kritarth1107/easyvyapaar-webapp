import { NextResponse } from "next/server";
import {
  buildUpdateItemBackendPayload,
  extractBackendError,
  normalizeItemDetail,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";
import { GST_RATE_OPTIONS } from "@/lib/inventory/create-item-form";
import type { UpdateInventoryItemRequest } from "@/lib/types/inventory-api";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { itemId } = await context.params;
    const trimmedItemId = itemId?.trim();
    if (!trimmedItemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/${encodeURIComponent(trimmedItemId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load item details" },
        { status: response.status },
      );
    }

    const detail = normalizeItemDetail((body as { data?: unknown }).data);
    if (!detail) {
      return NextResponse.json({ error: "Invalid item response" }, { status: 502 });
    }

    return NextResponse.json({ ...(body as object), data: detail });
  } catch (error) {
    console.error("Inventory item detail error:", error);
    return NextResponse.json({ error: "Failed to load item details" }, { status: 500 });
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GST_RATES = new Set<string>(GST_RATE_OPTIONS);

function parseUpdateItemBody(
  body: unknown,
  organisationId: string,
): UpdateInventoryItemRequest | string {
  const root = (body ?? {}) as Partial<UpdateInventoryItemRequest>;

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
  if (root.asOfDate && !ISO_DATE.test(root.asOfDate.trim())) {
    return "asOfDate must be YYYY-MM-DD";
  }
  if (root.lowStockWarning && (root.lowStockQty ?? 0) <= 0) {
    return "lowStockQty must be greater than 0 when low stock warning is enabled";
  }
  if (root.status && root.status !== "ACTIVE" && root.status !== "INACTIVE" && root.status !== "ARCHIVED") {
    return "Invalid status";
  }

  const payload: UpdateInventoryItemRequest = { organisationId };
  if (typeof root.categoryId === "string" && root.categoryId.trim()) {
    payload.categoryId = root.categoryId.trim();
  }
  if (root.itemType) payload.itemType = root.itemType;
  if (typeof root.name === "string") payload.name = root.name.trim();
  if (root.showInOnlineStore !== undefined) payload.showInOnlineStore = root.showInOnlineStore;
  if (root.salesPrice !== undefined) payload.salesPrice = root.salesPrice;
  if (root.salesTaxMode) payload.salesTaxMode = root.salesTaxMode;
  if (root.purchasePrice !== undefined) payload.purchasePrice = root.purchasePrice;
  if (root.purchaseTaxMode) payload.purchaseTaxMode = root.purchaseTaxMode;
  if (root.gstRate) payload.gstRate = root.gstRate;
  if (root.salesDiscountPercent !== undefined) {
    payload.salesDiscountPercent = root.salesDiscountPercent;
  }
  if (typeof root.unit === "string" && root.unit.trim()) payload.unit = root.unit.trim();
  if (typeof root.itemCode === "string" && root.itemCode.trim()) {
    payload.itemCode = root.itemCode.trim();
  }
  if (root.hsn !== undefined) payload.hsn = typeof root.hsn === "string" ? root.hsn : "";
  if (typeof root.asOfDate === "string") payload.asOfDate = root.asOfDate.trim();
  if (root.lowStockWarning !== undefined) payload.lowStockWarning = root.lowStockWarning;
  if (root.lowStockQty !== undefined) payload.lowStockQty = root.lowStockQty;
  if (root.description !== undefined) {
    payload.description = typeof root.description === "string" ? root.description : "";
  }
  if (root.partyPrices !== undefined) payload.partyPrices = root.partyPrices;
  if (root.customFields !== undefined) payload.customFields = root.customFields;
  if (root.purchaseSuppliers !== undefined) payload.purchaseSuppliers = root.purchaseSuppliers;
  if (root.status) payload.status = root.status;

  const keys = Object.keys(payload).filter((k) => k !== "organisationId");
  if (!keys.length) return "At least one field is required to update";

  return payload;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { itemId } = await context.params;
    const trimmedItemId = itemId?.trim();
    if (!trimmedItemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseUpdateItemBody(body, organisationId);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const backendPayload = buildUpdateItemBackendPayload(parsed);
    const { response, body: backendBody } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/${encodeURIComponent(trimmedItemId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(backendBody) ?? "Failed to update item" },
        { status: response.status },
      );
    }

    const detail = normalizeItemDetail((backendBody as { data?: unknown }).data);
    if (detail) {
      return NextResponse.json({ ...(backendBody as object), data: detail }, { status: response.status });
    }

    return NextResponse.json(backendBody, { status: response.status });
  } catch (error) {
    console.error("Inventory item update error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

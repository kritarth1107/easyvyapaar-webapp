import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeStockAdjustmentListResponse,
  normalizeStockAdjustmentResult,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";
import type { CreateStockAdjustmentRequest } from "@/lib/types/inventory-api";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

function normalizeSerialNumbers(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const entry of values) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

function parseCreateBody(body: unknown, organisationId: string): CreateStockAdjustmentRequest | string {
  const root = (body ?? {}) as Partial<CreateStockAdjustmentRequest>;
  const orgId =
    typeof root.organisationId === "string" && root.organisationId.trim()
      ? root.organisationId.trim()
      : organisationId;
  const adjustmentDate =
    typeof root.adjustmentDate === "string" ? root.adjustmentDate.trim() : "";
  const type = root.type;
  const quantity =
    root.quantity === undefined ? undefined : Number(root.quantity);
  const serialNumbers = normalizeSerialNumbers(root.serialNumbers);

  if (!orgId) return "organisationId is required";
  if (!ISO_DATE.test(adjustmentDate)) return "adjustmentDate must be YYYY-MM-DD";
  if (type !== "add" && type !== "reduce") return "type must be add or reduce";

  const hasSerials = serialNumbers.length > 0;
  const hasQty = quantity !== undefined && Number.isFinite(quantity) && quantity > 0;

  if (hasSerials && hasQty) return "Provide serialNumbers or quantity, not both";
  if (!hasSerials && !hasQty) return "quantity or serialNumbers is required";

  return {
    organisationId: orgId,
    adjustmentDate,
    type,
    ...(hasQty && { quantity }),
    ...(hasSerials && { serialNumbers }),
    ...(typeof root.remarks === "string" && root.remarks.trim() && { remarks: root.remarks.trim() }),
  };
}

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
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/${encodeURIComponent(trimmedItemId)}/stock-adjustments`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load stock adjustments" },
        { status: response.status },
      );
    }

    const adjustments = normalizeStockAdjustmentListResponse(body);
    return NextResponse.json({ ...(body as object), data: adjustments });
  } catch (error) {
    console.error("Inventory stock adjustments list error:", error);
    return NextResponse.json({ error: "Failed to load stock adjustments" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const trimmedItemId = itemId?.trim();
    if (!trimmedItemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organisationId = requireOrganisationId(request) ?? "";
    const parsed = parseCreateBody(payload, organisationId);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }

    const backendBody: Record<string, unknown> = {
      adjustmentDate: parsed.adjustmentDate,
      type: parsed.type,
      remarks: parsed.remarks,
    };
    if (parsed.quantity !== undefined) backendBody.quantity = parsed.quantity;
    if (parsed.serialNumbers?.length) backendBody.serialNumbers = parsed.serialNumbers;

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(parsed.organisationId)}/items/${encodeURIComponent(trimmedItemId)}/stock-adjustments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendBody),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to adjust stock" },
        { status: response.status },
      );
    }

    const result = normalizeStockAdjustmentResult(body);
    if (result) {
      return NextResponse.json({ ...(body as object), data: result }, { status: response.status });
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Inventory stock adjustment create error:", error);
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}

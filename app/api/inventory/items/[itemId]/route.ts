import { NextResponse } from "next/server";
import { extractBackendError, normalizeItemDetail } from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

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

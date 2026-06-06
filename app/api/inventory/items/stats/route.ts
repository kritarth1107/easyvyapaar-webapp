import { NextResponse } from "next/server";
import { extractBackendError, normalizeInventoryStockStats } from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/stats`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load stock stats" },
        { status: response.status },
      );
    }

    const stats = normalizeInventoryStockStats(body);
    return NextResponse.json({ ...(body as object), data: stats });
  } catch (error) {
    console.error("Inventory stock stats error:", error);
    return NextResponse.json({ error: "Failed to load stock stats" }, { status: 500 });
  }
}

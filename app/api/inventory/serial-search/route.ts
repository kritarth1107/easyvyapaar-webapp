import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeInventorySerialSearchResponse,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    if (!search) {
      return NextResponse.json({ error: "search is required" }, { status: 400 });
    }

    const backendParams = new URLSearchParams({ search });
    const limit = searchParams.get("limit")?.trim();
    if (limit) backendParams.set("limit", limit);

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/serial-search?${backendParams.toString()}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to search serial numbers" },
        { status: response.status },
      );
    }

    const data = normalizeInventorySerialSearchResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Inventory serial search error:", error);
    return NextResponse.json({ error: "Failed to search serial numbers" }, { status: 500 });
  }
}

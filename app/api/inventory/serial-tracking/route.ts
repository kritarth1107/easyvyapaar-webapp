import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeItemDetailList,
} from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load serial tracking data" },
        { status: response.status },
      );
    }

    const items = normalizeItemDetailList(body).filter((item) => item.serialised);
    return NextResponse.json({ ...(body as object), data: items });
  } catch (error) {
    console.error("Inventory serial tracking error:", error);
    return NextResponse.json({ error: "Failed to load serial tracking data" }, { status: 500 });
  }
}

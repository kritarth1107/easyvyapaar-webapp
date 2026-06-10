import { NextResponse } from "next/server";
import { extractBackendError, normalizeItemDetail } from "@/lib/api/inventory";
import { proxyInventoryBackend, requireOrganisationId } from "@/lib/api/inventory-proxy";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    const formData = await request.formData();
    const image = formData.get("image");
    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("image", image);

    const { response, body } = await proxyInventoryBackend(
      request,
      `inventory/organisations/${encodeURIComponent(organisationId)}/items/${encodeURIComponent(trimmedItemId)}/image`,
      { method: "POST", body: backendFormData },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to upload item image" },
        { status: response.status },
      );
    }

    const detail = normalizeItemDetail((body as { data?: unknown }).data);
    if (!detail) {
      return NextResponse.json({ error: "Invalid item image response" }, { status: 502 });
    }

    return NextResponse.json({ ...(body as object), data: detail }, { status: response.status });
  } catch (error) {
    console.error("Inventory item image upload error:", error);
    return NextResponse.json({ error: "Failed to upload item image" }, { status: 500 });
  }
}

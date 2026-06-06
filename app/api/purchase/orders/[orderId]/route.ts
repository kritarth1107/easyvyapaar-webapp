import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseOrderDetailResponse } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { orderId } = await context.params;

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/orders/${encodeURIComponent(orderId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase order" },
        { status: response.status },
      );
    }

    const order = normalizePurchaseOrderDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: order });
  } catch (error) {
    console.error("Purchase order detail error:", error);
    return NextResponse.json({ error: "Failed to load purchase order" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseOrderDetailResponse } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { orderId } = await context.params;

    let payload: unknown = {};
    try {
      payload = await request.json();
    } catch {
      // empty body is ok
    }

    const bodyPayload =
      typeof payload === "object" && payload !== null && "status" in (payload as object)
        ? payload
        : { status: "received", ...(typeof payload === "object" && payload !== null ? payload : {}) };

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/orders/${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to mark order received" },
        { status: response.status },
      );
    }

    const order = normalizePurchaseOrderDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: order }, { status: response.status });
  } catch (error) {
    console.error("Purchase order received error:", error);
    return NextResponse.json({ error: "Failed to mark order received" }, { status: 500 });
  }
}

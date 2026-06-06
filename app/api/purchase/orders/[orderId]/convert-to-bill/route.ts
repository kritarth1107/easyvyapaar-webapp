import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseBillDetailResponse } from "@/lib/api/purchases";
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

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/orders/${encodeURIComponent(orderId)}/convert-to-bill`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to convert order to bill" },
        { status: response.status },
      );
    }

    const bill = normalizePurchaseBillDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: bill }, { status: response.status });
  } catch (error) {
    console.error("Purchase order convert error:", error);
    return NextResponse.json({ error: "Failed to convert order to bill" }, { status: 500 });
  }
}

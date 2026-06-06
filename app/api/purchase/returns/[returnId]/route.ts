import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseReturnDetailResponse } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

type RouteContext = { params: Promise<{ returnId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { returnId } = await context.params;

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/returns/${encodeURIComponent(returnId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase return" },
        { status: response.status },
      );
    }

    const ret = normalizePurchaseReturnDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: ret });
  } catch (error) {
    console.error("Purchase return detail error:", error);
    return NextResponse.json({ error: "Failed to load purchase return" }, { status: 500 });
  }
}

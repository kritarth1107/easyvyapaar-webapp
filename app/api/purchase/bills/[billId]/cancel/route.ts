import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseBillDetailResponse } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

type RouteContext = { params: Promise<{ billId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { billId } = await context.params;

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/${encodeURIComponent(billId)}/cancel`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to cancel purchase bill" },
        { status: response.status },
      );
    }

    const bill = normalizePurchaseBillDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: bill }, { status: response.status });
  } catch (error) {
    console.error("Purchase bill cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel purchase bill" }, { status: 500 });
  }
}

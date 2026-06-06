import { NextResponse } from "next/server";
import { extractBackendError, normalizeFinancePaymentDetailResponse } from "@/lib/api/finance-payments";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

type RouteContext = { params: Promise<{ paymentId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { paymentId } = await context.params;
    if (!paymentId?.trim()) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/payments/${encodeURIComponent(paymentId.trim())}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payment" },
        { status: response.status },
      );
    }

    const payment = normalizeFinancePaymentDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: payment });
  } catch (error) {
    console.error("Finance payment detail error:", error);
    return NextResponse.json({ error: "Failed to load payment" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextFinancePaymentNumber } from "@/lib/api/finance-payments";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const paymentType = searchParams.get("paymentType")?.trim() || "payment_in";
    const query = `?paymentType=${encodeURIComponent(paymentType)}`;

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/payments/next-number${query}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payment number" },
        { status: response.status },
      );
    }

    const data = normalizeNextFinancePaymentNumber(body);
    if (!data) {
      return NextResponse.json({ error: "Failed to load payment number" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Finance payment next-number error:", error);
    return NextResponse.json({ error: "Failed to load payment number" }, { status: 500 });
  }
}

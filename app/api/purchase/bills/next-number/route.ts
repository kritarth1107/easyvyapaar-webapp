import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextPurchaseNumber } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load bill number" },
        { status: response.status },
      );
    }

    const data = normalizeNextPurchaseNumber(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Purchase bill next-number error:", error);
    return NextResponse.json({ error: "Failed to load bill number" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextSalesReturnNumber } from "@/lib/api/sales-returns";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/sales-returns/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load return number" },
        { status: response.status },
      );
    }

    const data = normalizeNextSalesReturnNumber(body);
    if (!data) {
      return NextResponse.json({ error: "Failed to load return number" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Sales return next-number error:", error);
    return NextResponse.json({ error: "Failed to load return number" }, { status: 500 });
  }
}

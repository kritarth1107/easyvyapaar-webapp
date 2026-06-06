import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextQuotationNumber } from "@/lib/api/quotations";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/quotations/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load quotation number" },
        { status: response.status },
      );
    }

    const data = normalizeNextQuotationNumber(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Next quotation number error:", error);
    return NextResponse.json({ error: "Failed to load quotation number" }, { status: 500 });
  }
}

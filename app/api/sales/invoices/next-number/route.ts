import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextInvoiceNumber } from "@/lib/api/sales";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/invoices/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load invoice number" },
        { status: response.status },
      );
    }

    const data = normalizeNextInvoiceNumber(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Next invoice number error:", error);
    return NextResponse.json({ error: "Failed to load invoice number" }, { status: 500 });
  }
}

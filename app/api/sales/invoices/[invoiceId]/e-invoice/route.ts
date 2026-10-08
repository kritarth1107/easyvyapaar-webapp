import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/sales";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { invoiceId } = await context.params;
    const trimmedInvoiceId = invoiceId?.trim();
    if (!trimmedInvoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/invoices/${encodeURIComponent(trimmedInvoiceId)}/e-invoice`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load e-Invoice status" },
        { status: response.status },
      );
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Sales invoice e-invoice status error:", error);
    return NextResponse.json({ error: "Failed to load e-Invoice status" }, { status: 500 });
  }
}

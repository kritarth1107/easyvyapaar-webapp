import { NextResponse } from "next/server";
import { extractBackendError, normalizeSalesInvoiceDetailResponse } from "@/lib/api/sales";
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
      `sales/organisations/${encodeURIComponent(organisationId)}/invoices/${encodeURIComponent(trimmedInvoiceId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load invoice" },
        { status: response.status },
      );
    }

    const invoice = normalizeSalesInvoiceDetailResponse(body);
    if (!invoice) {
      return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data: invoice });
  } catch (error) {
    console.error("Sales invoice detail error:", error);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

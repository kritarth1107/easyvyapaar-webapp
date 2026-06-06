import { NextResponse } from "next/server";
import { extractBackendError, normalizeQuotationDetailResponse } from "@/lib/api/quotations";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = {
  params: Promise<{ quotationId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { quotationId } = await context.params;
    const trimmedQuotationId = quotationId?.trim();
    if (!trimmedQuotationId) {
      return NextResponse.json({ error: "quotationId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/quotations/${encodeURIComponent(trimmedQuotationId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load quotation" },
        { status: response.status },
      );
    }

    const quotation = normalizeQuotationDetailResponse(body);
    if (!quotation) {
      return NextResponse.json({ error: "Failed to load quotation" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data: quotation });
  } catch (error) {
    console.error("Sales quotation detail error:", error);
    return NextResponse.json({ error: "Failed to load quotation" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { quotationId } = await context.params;
    const trimmedQuotationId = quotationId?.trim();
    if (!trimmedQuotationId) {
      return NextResponse.json({ error: "quotationId is required" }, { status: 400 });
    }

    const payload = await request.json();
    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/quotations/${encodeURIComponent(trimmedQuotationId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update quotation" },
        { status: response.status },
      );
    }

    const quotation = normalizeQuotationDetailResponse(body);
    if (!quotation) {
      return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data: quotation });
  } catch (error) {
    console.error("Sales quotation update error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}

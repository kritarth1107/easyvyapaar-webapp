import { NextResponse } from "next/server";
import { extractBackendError, normalizeSalesReturnDetailResponse } from "@/lib/api/sales-returns";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = {
  params: Promise<{ salesReturnId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { salesReturnId } = await context.params;
    const trimmedId = salesReturnId?.trim();
    if (!trimmedId) {
      return NextResponse.json({ error: "salesReturnId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/sales-returns/${encodeURIComponent(trimmedId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load sales return" },
        { status: response.status },
      );
    }

    const salesReturn = normalizeSalesReturnDetailResponse(body);
    if (!salesReturn) {
      return NextResponse.json({ error: "Failed to load sales return" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data: salesReturn });
  } catch (error) {
    console.error("Sales return detail error:", error);
    return NextResponse.json({ error: "Failed to load sales return" }, { status: 500 });
  }
}

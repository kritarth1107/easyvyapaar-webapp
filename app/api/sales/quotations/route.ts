import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeQuotationDetailResponse,
  normalizeQuotationListResponse,
} from "@/lib/api/quotations";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["status", "search", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/quotations${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load quotations" },
        { status: response.status },
      );
    }

    const data = normalizeQuotationListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Sales quotations list error:", error);
    return NextResponse.json({ error: "Failed to load quotations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/quotations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create quotation" },
        { status: response.status },
      );
    }

    const quotation = normalizeQuotationDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: quotation }, { status: response.status });
  } catch (error) {
    console.error("Sales quotation create error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}

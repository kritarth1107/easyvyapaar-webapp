import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeDeliveryChallanDetailResponse,
  normalizeDeliveryChallanListResponse,
} from "@/lib/api/delivery-challans";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["status", "search", "invoiceId", "page", "limit"] as const) {
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
      `sales/organisations/${encodeURIComponent(organisationId)}/delivery-challans${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load delivery challans" },
        { status: response.status },
      );
    }

    const data = normalizeDeliveryChallanListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Delivery challans list error:", error);
    return NextResponse.json({ error: "Failed to load delivery challans" }, { status: 500 });
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
      `sales/organisations/${encodeURIComponent(organisationId)}/delivery-challans`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create delivery challan" },
        { status: response.status },
      );
    }

    const challan = normalizeDeliveryChallanDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: challan }, { status: response.status });
  } catch (error) {
    console.error("Delivery challan create error:", error);
    return NextResponse.json({ error: "Failed to create delivery challan" }, { status: 500 });
  }
}

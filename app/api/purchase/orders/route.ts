import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizePurchaseOrderDetailResponse,
  normalizePurchaseOrderListResponse,
} from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["status", "partyId", "search", "page", "limit"] as const) {
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

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/orders${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase orders" },
        { status: response.status },
      );
    }

    const data = normalizePurchaseOrderListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Purchase orders list error:", error);
    return NextResponse.json({ error: "Failed to load purchase orders" }, { status: 500 });
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

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/orders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create purchase order" },
        { status: response.status },
      );
    }

    const order = normalizePurchaseOrderDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: order }, { status: response.status });
  } catch (error) {
    console.error("Purchase order create error:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizePurchaseReturnDetailResponse,
  normalizePurchaseReturnListResponse,
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
      `purchase/organisations/${encodeURIComponent(organisationId)}/returns${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase returns" },
        { status: response.status },
      );
    }

    const data = normalizePurchaseReturnListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Purchase returns list error:", error);
    return NextResponse.json({ error: "Failed to load purchase returns" }, { status: 500 });
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
      `purchase/organisations/${encodeURIComponent(organisationId)}/returns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create purchase return" },
        { status: response.status },
      );
    }

    const ret = normalizePurchaseReturnDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: ret }, { status: response.status });
  } catch (error) {
    console.error("Purchase return create error:", error);
    return NextResponse.json({ error: "Failed to create purchase return" }, { status: 500 });
  }
}

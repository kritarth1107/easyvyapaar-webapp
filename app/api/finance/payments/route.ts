import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeFinancePaymentDetailResponse,
  normalizeFinancePaymentListResponse,
} from "@/lib/api/finance-payments";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["paymentType", "status", "partyId", "search", "page", "limit"] as const) {
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

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/payments${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payments" },
        { status: response.status },
      );
    }

    const data = normalizeFinancePaymentListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Finance payments list error:", error);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
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

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to record payment" },
        { status: response.status },
      );
    }

    const payment = normalizeFinancePaymentDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: payment }, { status: response.status });
  } catch (error) {
    console.error("Finance payment create error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

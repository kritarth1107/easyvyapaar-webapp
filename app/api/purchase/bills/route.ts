import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizePurchaseBillDetailResponse,
  normalizePurchaseBillListResponse,
} from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["status", "paymentStatus", "partyId", "search", "page", "limit"] as const) {
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
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase bills" },
        { status: response.status },
      );
    }

    const data = normalizePurchaseBillListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Purchase bills list error:", error);
    return NextResponse.json({ error: "Failed to load purchase bills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let init: RequestInit;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      init = { method: "POST", body: formData };
    } else {
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      init = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
    }

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills`,
      init,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create purchase bill" },
        { status: response.status },
      );
    }

    const bill = normalizePurchaseBillDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: bill }, { status: response.status });
  } catch (error) {
    console.error("Purchase bill create error:", error);
    return NextResponse.json({ error: "Failed to create purchase bill" }, { status: 500 });
  }
}

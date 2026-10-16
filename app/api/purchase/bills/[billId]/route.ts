import { NextResponse } from "next/server";
import { extractBackendError, normalizePurchaseBillDetailResponse } from "@/lib/api/purchases";
import { proxyPurchaseBackend, requireOrganisationId } from "@/lib/api/purchase-proxy";

type RouteContext = { params: Promise<{ billId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { billId } = await context.params;

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/${encodeURIComponent(billId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load purchase bill" },
        { status: response.status },
      );
    }

    const bill = normalizePurchaseBillDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: bill });
  } catch (error) {
    console.error("Purchase bill detail error:", error);
    return NextResponse.json({ error: "Failed to load purchase bill" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { billId } = await context.params;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/${encodeURIComponent(billId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update purchase bill" },
        { status: response.status },
      );
    }

    const bill = normalizePurchaseBillDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: bill }, { status: response.status });
  } catch (error) {
    console.error("Purchase bill update error:", error);
    return NextResponse.json({ error: "Failed to update purchase bill" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { billId } = await context.params;

    const { response, body } = await proxyPurchaseBackend(
      request,
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/${encodeURIComponent(billId)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to delete purchase bill" },
        { status: response.status },
      );
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Purchase bill delete error:", error);
    return NextResponse.json({ error: "Failed to delete purchase bill" }, { status: 500 });
  }
}

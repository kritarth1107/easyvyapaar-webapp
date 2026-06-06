import { NextResponse } from "next/server";
import { extractBackendError, normalizeDeliveryChallanDetailResponse } from "@/lib/api/delivery-challans";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = { params: Promise<{ deliveryChallanId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { deliveryChallanId } = await context.params;
    if (!deliveryChallanId?.trim()) {
      return NextResponse.json({ error: "deliveryChallanId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/delivery-challans/${encodeURIComponent(deliveryChallanId.trim())}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load delivery challan" },
        { status: response.status },
      );
    }

    const challan = normalizeDeliveryChallanDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: challan });
  } catch (error) {
    console.error("Delivery challan detail error:", error);
    return NextResponse.json({ error: "Failed to load delivery challan" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { deliveryChallanId } = await context.params;
    if (!deliveryChallanId?.trim()) {
      return NextResponse.json({ error: "deliveryChallanId is required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/delivery-challans/${encodeURIComponent(deliveryChallanId.trim())}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update delivery challan" },
        { status: response.status },
      );
    }

    const challan = normalizeDeliveryChallanDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: challan });
  } catch (error) {
    console.error("Delivery challan update error:", error);
    return NextResponse.json({ error: "Failed to update delivery challan" }, { status: 500 });
  }
}

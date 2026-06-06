import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextDeliveryChallanNumber } from "@/lib/api/delivery-challans";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/delivery-challans/next-number`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load challan number" },
        { status: response.status },
      );
    }

    const data = normalizeNextDeliveryChallanNumber(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Delivery challan next number error:", error);
    return NextResponse.json({ error: "Failed to load challan number" }, { status: 500 });
  }
}

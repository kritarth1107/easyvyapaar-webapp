import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { proxyDashboardBackend, requireOrganisationId } from "@/lib/api/dashboard-proxy";

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyDashboardBackend(
      request,
      `billing/organisations/${encodeURIComponent(organisationId)}/renew-checkout`,
      { method: "POST", bodyless: true },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to start renewal checkout" },
        { status: response.status },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Billing renew checkout error:", error);
    return NextResponse.json({ error: "Failed to start renewal checkout" }, { status: 500 });
  }
}

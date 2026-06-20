import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { proxyDashboardBackend, requireOrganisationId } from "@/lib/api/dashboard-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyDashboardBackend(
      request,
      `billing/organisations/${encodeURIComponent(organisationId)}/account`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load subscription" },
        { status: response.status },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Billing account error:", error);
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

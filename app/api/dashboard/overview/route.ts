import { NextResponse } from "next/server";
import { extractBackendError, normalizeDashboardOverview } from "@/lib/api/dashboard";
import { proxyDashboardBackend, requireOrganisationId } from "@/lib/api/dashboard-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyDashboardBackend(
      request,
      `dashboard/organisations/${encodeURIComponent(organisationId)}/overview`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load dashboard" },
        { status: response.status },
      );
    }

    const data = normalizeDashboardOverview(body);
    if (!data) {
      return NextResponse.json({ error: "Invalid dashboard response" }, { status: 502 });
    }

    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { proxyDashboardBackend, requireOrganisationId } from "@/lib/api/dashboard-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    const skip = url.searchParams.get("skip");
    const query = new URLSearchParams();
    if (limit) query.set("limit", limit);
    if (skip) query.set("skip", skip);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { response, body } = await proxyDashboardBackend(
      request,
      `billing/organisations/${encodeURIComponent(organisationId)}/transactions${suffix}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load transactions" },
        { status: response.status },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Billing transactions error:", error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

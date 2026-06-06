import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyDashboardSummary } from "@/lib/api/parties";
import { proxyPartiesBackend, requireOrganisationId } from "@/lib/api/parties-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/summary`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load party summary" },
        { status: response.status },
      );
    }

    const summary = normalizePartyDashboardSummary(body);
    return NextResponse.json({ ...(body as object), data: summary });
  } catch (error) {
    console.error("Parties summary error:", error);
    return NextResponse.json({ error: "Failed to load party summary" }, { status: 500 });
  }
}

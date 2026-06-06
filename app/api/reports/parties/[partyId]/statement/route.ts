import { NextResponse } from "next/server";
import { extractBackendError, normalizeReportData } from "@/lib/api/reports";
import { proxyReportBackend, requireOrganisationId } from "@/lib/api/report-proxy";

type RouteContext = { params: Promise<{ partyId: string }> };

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["fromDate", "toDate"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { partyId } = await context.params;
    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyReportBackend(
      request,
      `reports/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(partyId)}/statement${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load party statement" },
        { status: response.status },
      );
    }

    const data = normalizeReportData(body, "party-outstanding");
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Party statement error:", error);
    return NextResponse.json({ error: "Failed to load party statement" }, { status: 500 });
  }
}

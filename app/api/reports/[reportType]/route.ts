import { NextResponse } from "next/server";
import { extractBackendError, normalizeReportData } from "@/lib/api/reports";
import { proxyReportBackend, requireOrganisationId } from "@/lib/api/report-proxy";
import type { ReportSlug } from "@/lib/types/reports-api";

type RouteContext = { params: Promise<{ reportType: string }> };

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["fromDate", "toDate", "partyId", "itemId", "categoryId", "search", "page", "limit"] as const) {
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

    const { reportType } = await context.params;
    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyReportBackend(
      request,
      `reports/organisations/${encodeURIComponent(organisationId)}/${encodeURIComponent(reportType)}${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load report" },
        { status: response.status },
      );
    }

    const data = normalizeReportData(body, reportType as ReportSlug);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

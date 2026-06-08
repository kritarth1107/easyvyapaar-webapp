import { NextResponse } from "next/server";
import { extractBackendError, normalizeReportData } from "@/lib/api/reports";
import { proxyReportBackend, requireOrganisationId } from "@/lib/api/report-proxy";
import { AS_OF_DATE_REPORTS, resolveBackendReportPath } from "@/lib/reports/report-backend-map";
import { isReportSlug } from "@/lib/reports/reports-api-client";
import type { ReportSlug } from "@/lib/types/reports-api";

type RouteContext = { params: Promise<{ reportType: string }> };

function buildBackendQuery(searchParams: URLSearchParams, reportType: ReportSlug): string {
  const params = new URLSearchParams();

  if (AS_OF_DATE_REPORTS.includes(reportType)) {
    const asOf = searchParams.get("toDate")?.trim() || searchParams.get("asOfDate")?.trim();
    if (asOf) params.set("asOfDate", asOf);
  } else {
    for (const key of ["fromDate", "toDate"] as const) {
      const value = searchParams.get(key)?.trim();
      if (value) params.set(key, value);
    }
  }

  for (const key of ["partyId", "itemId", "categoryId", "search", "page", "limit"] as const) {
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

    const { reportType: rawType } = await context.params;
    if (!isReportSlug(rawType)) {
      return NextResponse.json({ error: "Unknown report type" }, { status: 404 });
    }

    const reportType = rawType;
    const backendPath = resolveBackendReportPath(reportType);
    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendQuery(searchParams, reportType);

    const { response, body } = await proxyReportBackend(
      request,
      `reports/organisations/${encodeURIComponent(organisationId)}/${encodeURIComponent(backendPath)}${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load report" },
        { status: response.status },
      );
    }

    const data = normalizeReportData(body, reportType);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

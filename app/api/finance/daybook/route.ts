import { NextResponse } from "next/server";
import { extractBackendError, normalizeDaybookListResponse } from "@/lib/api/daybook";
import { proxyFinanceBackend, requireOrganisationId } from "@/lib/api/finance-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["fromDate", "toDate", "entryType", "search", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyFinanceBackend(
      request,
      `finance/organisations/${encodeURIComponent(organisationId)}/daybook${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load daybook" },
        { status: response.status },
      );
    }

    const data = normalizeDaybookListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Daybook list error:", error);
    return NextResponse.json({ error: "Failed to load daybook" }, { status: 500 });
  }
}

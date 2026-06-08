import { NextResponse } from "next/server";
import { extractBackendError, normalizeSalaryHistoryResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { staffId } = await context.params;

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}/salary-history`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load salary history" },
        { status: response.status },
      );
    }

    const items = normalizeSalaryHistoryResponse(body);
    return NextResponse.json({ ...(body as object), data: { items } });
  } catch (error) {
    console.error("Salary history error:", error);
    return NextResponse.json({ error: "Failed to load salary history" }, { status: 500 });
  }
}

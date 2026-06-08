import { NextResponse } from "next/server";
import { extractBackendError, normalizePayrollMonthSummariesResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/payroll/month-summaries`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payroll months" },
        { status: response.status },
      );
    }

    const data = normalizePayrollMonthSummariesResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Payroll month summaries error:", error);
    return NextResponse.json({ error: "Failed to load payroll months" }, { status: 500 });
  }
}

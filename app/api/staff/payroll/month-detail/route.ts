import { NextResponse } from "next/server";
import { extractBackendError, normalizePayrollMonthDetailResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.trim();
    if (!month) {
      return NextResponse.json({ error: "month is required" }, { status: 400 });
    }

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/payroll/month-detail?month=${encodeURIComponent(month)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payroll detail" },
        { status: response.status },
      );
    }

    const data = normalizePayrollMonthDetailResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Payroll month detail error:", error);
    return NextResponse.json({ error: "Failed to load payroll detail" }, { status: 500 });
  }
}

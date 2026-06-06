import { NextResponse } from "next/server";
import { extractBackendError, normalizePayrollDetailResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ payrollId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { payrollId } = await context.params;

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/payroll/${encodeURIComponent(payrollId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load payroll detail" },
        { status: response.status },
      );
    }

    const payroll = normalizePayrollDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: payroll });
  } catch (error) {
    console.error("Payroll detail error:", error);
    return NextResponse.json({ error: "Failed to load payroll detail" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError, normalizePayrollDetailResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ payrollId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { payrollId } = await context.params;
    const payload = await request.json();

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/payroll/${encodeURIComponent(payrollId)}/mark-paid`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to mark payroll as paid" },
        { status: response.status },
      );
    }

    const payroll = normalizePayrollDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: payroll });
  } catch (error) {
    console.error("Mark payroll paid error:", error);
    return NextResponse.json({ error: "Failed to mark payroll as paid" }, { status: 500 });
  }
}

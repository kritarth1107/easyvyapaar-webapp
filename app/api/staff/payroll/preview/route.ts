import { NextResponse } from "next/server";
import { extractBackendError, normalizePayrollPreviewResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/payroll/preview`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to preview payroll" },
        { status: response.status },
      );
    }

    const data = normalizePayrollPreviewResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Payroll preview error:", error);
    return NextResponse.json({ error: "Failed to preview payroll" }, { status: 500 });
  }
}

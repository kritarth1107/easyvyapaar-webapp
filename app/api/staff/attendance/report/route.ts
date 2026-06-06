import { NextResponse } from "next/server";
import { extractBackendError, normalizeAttendanceReportResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month")?.trim();
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/attendance/report${qs}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load attendance report" },
        { status: response.status },
      );
    }

    const data = normalizeAttendanceReportResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Attendance report error:", error);
    return NextResponse.json({ error: "Failed to load attendance report" }, { status: 500 });
  }
}

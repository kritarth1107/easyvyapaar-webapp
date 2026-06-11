import { NextResponse } from "next/server";
import { extractBackendError, normalizeAttendancePeriodResponse } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    for (const key of ["staffId", "fromDate", "toDate"] as const) {
      const value = searchParams.get(key)?.trim();
      if (value) params.set(key, value);
    }

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/attendance/period?${params.toString()}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load attendance period" },
        { status: response.status },
      );
    }

    const data = normalizeAttendancePeriodResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Attendance period error:", error);
    return NextResponse.json({ error: "Failed to load attendance period" }, { status: 500 });
  }
}

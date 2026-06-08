import { NextResponse } from "next/server";
import { extractBackendError, normalizeSalaryHistoryEntry } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { staffId } = await context.params;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}/salary-change`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to change salary" },
        { status: response.status },
      );
    }

    const data = normalizeSalaryHistoryEntry(body);
    return NextResponse.json({ ...(body as object), data }, { status: response.status });
  } catch (error) {
    console.error("Salary change error:", error);
    return NextResponse.json({ error: "Failed to change salary" }, { status: 500 });
  }
}

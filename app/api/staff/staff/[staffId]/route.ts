import { NextResponse } from "next/server";
import { extractBackendError, normalizeStaffDetailResponse } from "@/lib/api/staff";
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
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load staff member" },
        { status: response.status },
      );
    }

    const staff = normalizeStaffDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: staff });
  } catch (error) {
    console.error("Staff detail error:", error);
    return NextResponse.json({ error: "Failed to load staff member" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update staff" },
        { status: response.status },
      );
    }

    const staff = normalizeStaffDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: staff });
  } catch (error) {
    console.error("Staff update error:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

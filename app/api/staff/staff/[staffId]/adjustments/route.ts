import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeStaffAdjustment,
  normalizeStaffAdjustmentsResponse,
} from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { staffId } = await context.params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}/adjustments${qs}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load adjustments" },
        { status: response.status },
      );
    }

    const data = normalizeStaffAdjustmentsResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Adjustments list error:", error);
    return NextResponse.json({ error: "Failed to load adjustments" }, { status: 500 });
  }
}

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
      `staff/organisations/${encodeURIComponent(organisationId)}/staff/${encodeURIComponent(staffId)}/adjustments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to record payment" },
        { status: response.status },
      );
    }

    const data = normalizeStaffAdjustment(body);
    return NextResponse.json({ ...(body as object), data }, { status: response.status });
  } catch (error) {
    console.error("Adjustment create error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

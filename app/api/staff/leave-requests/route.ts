import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeLeaveRequest,
  normalizeLeaveRequestListResponse,
} from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

function buildListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["staffId", "status", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildListQuery(searchParams);

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/leave-requests${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load leave requests" },
        { status: response.status },
      );
    }

    const data = normalizeLeaveRequestListResponse(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Leave requests list error:", error);
    return NextResponse.json({ error: "Failed to load leave requests" }, { status: 500 });
  }
}

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
      `staff/organisations/${encodeURIComponent(organisationId)}/leave-requests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create leave request" },
        { status: response.status },
      );
    }

    const data = normalizeLeaveRequest(
      typeof body === "object" && body !== null && "data" in body
        ? (body as { data: unknown }).data
        : body,
    );
    return NextResponse.json({ success: true, data }, { status: response.status });
  } catch (error) {
    console.error("Leave request create error:", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}

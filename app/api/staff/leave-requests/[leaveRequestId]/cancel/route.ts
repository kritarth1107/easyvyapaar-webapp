import { NextResponse } from "next/server";
import { extractBackendError, normalizeLeaveRequest } from "@/lib/api/staff";
import { proxyStaffBackend, requireOrganisationId } from "@/lib/api/staff-proxy";

type RouteContext = { params: Promise<{ leaveRequestId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { leaveRequestId } = await context.params;

    const { response, body } = await proxyStaffBackend(
      request,
      `staff/organisations/${encodeURIComponent(organisationId)}/leave-requests/${encodeURIComponent(leaveRequestId)}/cancel`,
      { method: "POST" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to cancel leave request" },
        { status: response.status },
      );
    }

    const data = normalizeLeaveRequest(
      typeof body === "object" && body !== null && "data" in body
        ? (body as { data: unknown }).data
        : body,
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Leave request cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel leave request" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = { params: Promise<{ organisationId: string; memberUserId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }
    const { organisationId, memberUserId } = await context.params;
    const body = await request.json();
    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/members/${encodeURIComponent(memberUserId)}`,
      apiBaseUrl,
    );
    const backendResponse = await fetch(backendUrl.toString(), {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Update member role error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }
    const { organisationId, memberUserId } = await context.params;
    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/members/${encodeURIComponent(memberUserId)}`,
      apiBaseUrl,
    );
    const backendResponse = await fetch(backendUrl.toString(), { method: "DELETE", headers });
    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

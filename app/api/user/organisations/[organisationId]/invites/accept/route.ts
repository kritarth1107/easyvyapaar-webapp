import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = { params: Promise<{ organisationId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }
    const { organisationId } = await context.params;
    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/invites/accept`,
      apiBaseUrl,
    );
    const backendResponse = await fetch(backendUrl.toString(), { method: "POST", headers });
    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}

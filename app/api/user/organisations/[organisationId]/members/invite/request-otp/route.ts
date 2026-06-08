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
    const body = await request.json();
    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/members/invite/request-otp`,
      apiBaseUrl,
    );
    const backendResponse = await fetch(backendUrl.toString(), {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Invite request OTP error:", error);
    return NextResponse.json({ error: "Failed to send invite OTP" }, { status: 500 });
  }
}

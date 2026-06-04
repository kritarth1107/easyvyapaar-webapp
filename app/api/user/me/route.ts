import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { normalizeUserMeResponse } from "@/lib/api/user-me";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function GET(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId")?.trim() || undefined;

    const headers = getHeadersFromRequest(request);

    const backendUrl = new URL("user/me", apiBaseUrl);
    if (organisationId) {
      backendUrl.searchParams.set("organisationId", organisationId);
    }

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } catch (error) {
      console.error("Get me backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    const normalized = normalizeUserMeResponse(responseBody, organisationId);

    return NextResponse.json(normalized, { status: backendResponse.status });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

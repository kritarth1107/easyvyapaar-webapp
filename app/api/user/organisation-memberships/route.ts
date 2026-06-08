import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function GET(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 },
      );
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL("user/me/organisation-memberships", apiBaseUrl);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      });
    } catch (error) {
      console.error("Organisation memberships backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Organisation memberships error:", error);
    return NextResponse.json(
      { error: "Failed to load organisation memberships" },
      { status: 500 },
    );
  }
}

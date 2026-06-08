import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function GET(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }
    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL("user/me/pending-invites", apiBaseUrl);
    const backendResponse = await fetch(backendUrl.toString(), { method: "GET", headers, cache: "no-store" });
    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Pending invites error:", error);
    return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  }
}

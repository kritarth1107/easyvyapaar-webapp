import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { parseIndianMobile } from "@/lib/validators/indian-mobile";

export async function POST(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const { mobile } = body as { mobile?: unknown };
    const parsed = parseIndianMobile(mobile);

    if (!parsed.valid) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const headers = getHeadersFromRequest(request);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${apiBaseUrl}auth/login`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mobile: parsed.national }),
      });
    } catch (error) {
      console.error("Get OTP backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Get OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

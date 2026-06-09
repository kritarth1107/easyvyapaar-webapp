import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { setSessionCookies } from "@/lib/auth/session-cookies";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function POST(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId")?.trim() || undefined;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL("user/me/mobile/verify-otp", apiBaseUrl);
    if (organisationId) {
      backendUrl.searchParams.set("organisationId", organisationId);
    }

    let backendResponse: Response;
    try {
      backendResponse = await fetchBackend(backendUrl.toString(), {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        timeoutMs: 20_000,
      });
    } catch (error) {
      console.error("Verify mobile change OTP backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);

    if (backendResponse.ok) {
      const sessionToken = (responseBody as { data?: { sessionToken?: string } })?.data
        ?.sessionToken;
      if (sessionToken) {
        await setSessionCookies(sessionToken);
      }
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Verify mobile change OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}

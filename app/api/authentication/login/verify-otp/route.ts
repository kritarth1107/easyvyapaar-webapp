import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { setSessionCookies } from "@/lib/auth/session-cookies";
import { getHeadersFromRequest } from "@/lib/header-utils";
import type { VerifyOtpSuccessResponse } from "@/lib/types/auth-api";

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

    const { verificationToken, otp } = body as {
      verificationToken?: unknown;
      otp?: unknown;
    };

    if (typeof verificationToken !== "string" || !verificationToken.trim()) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const otpValue = typeof otp === "string" ? otp.trim() : "";
    if (!/^\d{6}$/.test(otpValue)) {
      return NextResponse.json(
        { error: "OTP must be exactly 6 digits" },
        { status: 400 }
      );
    }

    const headers = getHeadersFromRequest(request);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${apiBaseUrl}auth/login/verify-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          verificationToken: verificationToken.trim(),
          otp: otpValue,
        }),
      });
    } catch (error) {
      console.error("Verify OTP backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);

    if (backendResponse.ok) {
      const success = responseBody as VerifyOtpSuccessResponse;
      const sessionToken = success?.data?.sessionToken;

      if (sessionToken) {
        await setSessionCookies(sessionToken);
      }
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}

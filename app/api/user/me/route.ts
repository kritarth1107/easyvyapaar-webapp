import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { normalizeUserMeResponse } from "@/lib/api/user-me";
import {
  SESSION_COOKIE_NAME,
  SESSION_HINT_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth/session";
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
      backendResponse = await fetchBackend(backendUrl.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
        timeoutMs: 12_000,
      });
    } catch (error) {
      console.error("Get me backend request failed:", error);
      const isTimeout = error instanceof Error && error.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Authentication service is slow to respond. Please try again."
            : "Unable to reach authentication service",
        },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    const normalized = normalizeUserMeResponse(responseBody, organisationId);

    if (backendResponse.ok) {
      const cookieStore = await cookies();
      if (cookieStore.get(SESSION_COOKIE_NAME)?.value) {
        cookieStore.set(SESSION_HINT_COOKIE_NAME, "1", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
      }
    }

    return NextResponse.json(normalized, { status: backendResponse.status });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const backendUrl = new URL("user/me", apiBaseUrl);
    if (organisationId) {
      backendUrl.searchParams.set("organisationId", organisationId);
    }

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Update me backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    const normalized = normalizeUserMeResponse(responseBody, organisationId);
    return NextResponse.json(normalized, { status: backendResponse.status });
  } catch (error) {
    console.error("Update me error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

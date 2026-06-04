import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { isValidGstin, normalizeGstin } from "@/lib/validators/gstin";

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

    const { gstin } = (body ?? {}) as { gstin?: unknown };
    if (typeof gstin !== "string" || !gstin.trim()) {
      return NextResponse.json({ error: "GST number is required" }, { status: 400 });
    }

    const normalized = normalizeGstin(gstin);
    if (!isValidGstin(normalized)) {
      return NextResponse.json(
        { error: "Enter a valid 15-character GSTIN" },
        { status: 400 }
      );
    }

    const headers = getHeadersFromRequest(request);

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${apiBaseUrl}auth/check-gst`, {
        method: "POST",
        headers,
        body: JSON.stringify({ gstin: normalized }),
      });
    } catch (error) {
      console.error("Check GST backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 }
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Check GST error:", error);
    return NextResponse.json({ error: "Failed to verify GST" }, { status: 500 });
  }
}

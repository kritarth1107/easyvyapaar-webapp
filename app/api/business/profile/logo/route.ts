import { NextResponse } from "next/server";
import { normalizeBusinessProfileResponse } from "@/lib/api/business-profile";
import { extractBackendError } from "@/lib/api/inventory";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
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
    const organisationId = searchParams.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const formData = await request.formData();
    const logo = formData.get("logo");
    if (!logo || !(logo instanceof Blob)) {
      return NextResponse.json({ error: "Logo image file is required" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("logo", logo);

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/logo`,
      apiBaseUrl,
    );

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "POST",
        headers,
        body: backendFormData,
        cache: "no-store",
      });
    } catch (error) {
      console.error("Business logo backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: extractBackendError(responseBody) ?? "Failed to upload logo" },
        { status: backendResponse.status },
      );
    }

    const normalized = normalizeBusinessProfileResponse(responseBody);
    return NextResponse.json(normalized, { status: backendResponse.status });
  } catch (error) {
    console.error("Business logo upload error:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}

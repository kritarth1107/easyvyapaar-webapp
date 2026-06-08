import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { normalizeUserMeResponse } from "@/lib/api/user-me";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = {
  params: Promise<{ organisationId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: "Authentication service is not configured" },
        { status: 500 },
      );
    }

    const { organisationId } = await context.params;
    const trimmedOrgId = organisationId?.trim();
    if (!trimmedOrgId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const activeOrganisationId = searchParams.get("organisationId")?.trim() || undefined;

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(trimmedOrgId)}/leave`,
      apiBaseUrl,
    );
    if (activeOrganisationId) {
      backendUrl.searchParams.set("organisationId", activeOrganisationId);
    }

    let backendResponse: Response;
    try {
      backendResponse = await fetch(backendUrl.toString(), {
        method: "POST",
        headers,
        cache: "no-store",
      });
    } catch (error) {
      console.error("Leave organisation backend request failed:", error);
      return NextResponse.json(
        { error: "Unable to reach authentication service" },
        { status: 502 },
      );
    }

    const responseBody = await parseBackendBody(backendResponse);
    if (
      backendResponse.ok &&
      responseBody &&
      typeof responseBody === "object" &&
      "data" in responseBody
    ) {
      const data = (responseBody as { data?: { profile?: unknown } }).data;
      if (data?.profile) {
        const normalizedProfile = normalizeUserMeResponse(
          { success: true, data: data.profile },
          activeOrganisationId,
        );
        return NextResponse.json(
          {
            ...(responseBody as object),
            data: {
              ...data,
              profile: (normalizedProfile as { data?: unknown }).data ?? data.profile,
            },
          },
          { status: backendResponse.status },
        );
      }
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Leave organisation error:", error);
    return NextResponse.json(
      { error: "Failed to leave organisation" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeOrganisationBankAccountsResponse,
} from "@/lib/api/organisation-bank";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

function requireOrganisationId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get("organisationId")?.trim() || null;
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/bank-accounts`,
      apiBaseUrl,
    );

    const backendResponse = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const body = await parseBackendBody(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load bank accounts" },
        { status: backendResponse.status },
      );
    }

    const data = normalizeOrganisationBankAccountsResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Organisation bank accounts list error:", error);
    return NextResponse.json({ error: "Failed to load bank accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Authentication service is not configured" }, { status: 500 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `user/organisations/${encodeURIComponent(organisationId)}/bank-accounts`,
      apiBaseUrl,
    );

    const backendResponse = await fetch(backendUrl.toString(), {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await parseBackendBody(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to add bank account" },
        { status: backendResponse.status },
      );
    }

    const data = normalizeOrganisationBankAccountsResponse(body);
    return NextResponse.json({ ...(body as object), data }, { status: backendResponse.status });
  } catch (error) {
    console.error("Organisation bank account create error:", error);
    return NextResponse.json({ error: "Failed to add bank account" }, { status: 500 });
  }
}

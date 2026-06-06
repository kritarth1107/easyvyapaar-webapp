import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyListResponse } from "@/lib/api/parties";
import { proxyPartiesBackend, requireOrganisationId } from "@/lib/api/parties-proxy";
import type { CreatePartyRequest, PartyListParams } from "@/lib/types/parties-api";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["view", "partyType", "status", "balance", "search", "page", "limit"] as const) {
    const value = searchParams.get(key)?.trim();
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listQuery = buildBackendListQuery(searchParams);

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load parties" },
        { status: response.status },
      );
    }

    const data = normalizePartyListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Parties list error:", error);
    return NextResponse.json({ error: "Failed to load parties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const root = (body ?? {}) as Partial<CreatePartyRequest>;
    const organisationId = typeof root.organisationId === "string" ? root.organisationId.trim() : "";
    const name = typeof root.name === "string" ? root.name.trim() : "";
    const partyType = root.partyType;
    const partyCategory = typeof root.partyCategory === "string" ? root.partyCategory.trim() : "";

    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Party name is required" }, { status: 400 });
    }
    if (!partyType || !["customer", "supplier", "both"].includes(partyType)) {
      return NextResponse.json({ error: "Valid party type is required" }, { status: 400 });
    }
    if (!partyCategory) {
      return NextResponse.json({ error: "Party category is required" }, { status: 400 });
    }

    const { response, body: backendBody } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(root),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(backendBody) ?? "Failed to create party" },
        { status: response.status },
      );
    }

    return NextResponse.json(backendBody, { status: response.status });
  } catch (error) {
    console.error("Party create error:", error);
    return NextResponse.json({ error: "Failed to create party" }, { status: 500 });
  }
}

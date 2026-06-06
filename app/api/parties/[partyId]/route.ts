import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyDetailResponse } from "@/lib/api/parties";
import { proxyPartiesBackend, requireOrganisationId } from "@/lib/api/parties-proxy";

type RouteContext = {
  params: Promise<{ partyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { partyId } = await context.params;
    const trimmedPartyId = partyId?.trim();
    if (!trimmedPartyId) {
      return NextResponse.json({ error: "partyId is required" }, { status: 400 });
    }

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load party" },
        { status: response.status },
      );
    }

    const party = normalizePartyDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: party });
  } catch (error) {
    console.error("Party detail error:", error);
    return NextResponse.json({ error: "Failed to load party" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { partyId } = await context.params;
    const trimmedPartyId = partyId?.trim();
    if (!trimmedPartyId) {
      return NextResponse.json({ error: "partyId is required" }, { status: 400 });
    }

    const payload = await request.json();

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update party" },
        { status: response.status },
      );
    }

    const party = normalizePartyDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: party });
  } catch (error) {
    console.error("Party update error:", error);
    return NextResponse.json({ error: "Failed to update party" }, { status: 500 });
  }
}

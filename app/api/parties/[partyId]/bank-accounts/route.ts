import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyDetailResponse } from "@/lib/api/parties";
import { proxyPartiesBackend, requireOrganisationId } from "@/lib/api/parties-proxy";

type RouteContext = {
  params: Promise<{ partyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}/bank-accounts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to add bank account" },
        { status: response.status },
      );
    }

    const party = normalizePartyDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: party });
  } catch (error) {
    console.error("Party bank account create error:", error);
    return NextResponse.json({ error: "Failed to add bank account" }, { status: 500 });
  }
}

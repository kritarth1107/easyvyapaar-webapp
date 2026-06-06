import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyLedgerStatement } from "@/lib/api/parties";
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

    const { searchParams } = new URL(request.url);
    const query = new URLSearchParams();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const qs = query.toString();

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}/ledger${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load party ledger" },
        { status: response.status },
      );
    }

    const statement = normalizePartyLedgerStatement(body);
    if (!statement) {
      return NextResponse.json({ error: "Failed to load party ledger" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data: statement });
  } catch (error) {
    console.error("Party ledger error:", error);
    return NextResponse.json({ error: "Failed to load party ledger" }, { status: 500 });
  }
}

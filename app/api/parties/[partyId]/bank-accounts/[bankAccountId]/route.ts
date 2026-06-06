import { NextResponse } from "next/server";
import { extractBackendError, normalizePartyDetailResponse } from "@/lib/api/parties";
import { proxyPartiesBackend, requireOrganisationId } from "@/lib/api/parties-proxy";

type RouteContext = {
  params: Promise<{ partyId: string; bankAccountId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { partyId, bankAccountId } = await context.params;
    const trimmedPartyId = partyId?.trim();
    const trimmedBankAccountId = bankAccountId?.trim();
    if (!trimmedPartyId || !trimmedBankAccountId) {
      return NextResponse.json({ error: "partyId and bankAccountId are required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}/bank-accounts/${encodeURIComponent(trimmedBankAccountId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to update bank account" },
        { status: response.status },
      );
    }

    const party = normalizePartyDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: party });
  } catch (error) {
    console.error("Party bank account update error:", error);
    return NextResponse.json({ error: "Failed to update bank account" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { partyId, bankAccountId } = await context.params;
    const trimmedPartyId = partyId?.trim();
    const trimmedBankAccountId = bankAccountId?.trim();
    if (!trimmedPartyId || !trimmedBankAccountId) {
      return NextResponse.json({ error: "partyId and bankAccountId are required" }, { status: 400 });
    }

    const { response, body } = await proxyPartiesBackend(
      request,
      `parties/organisations/${encodeURIComponent(organisationId)}/parties/${encodeURIComponent(trimmedPartyId)}/bank-accounts/${encodeURIComponent(trimmedBankAccountId)}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to delete bank account" },
        { status: response.status },
      );
    }

    const party = normalizePartyDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: party });
  } catch (error) {
    console.error("Party bank account delete error:", error);
    return NextResponse.json({ error: "Failed to delete bank account" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError, normalizeNextCreditNoteNumber } from "@/lib/api/credit-notes";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

export async function GET(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const noteType = searchParams.get("noteType")?.trim() || "credit";
    const query = `?noteType=${encodeURIComponent(noteType)}`;

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/credit-notes/next-number${query}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load note number" },
        { status: response.status },
      );
    }

    const data = normalizeNextCreditNoteNumber(body);
    if (!data) {
      return NextResponse.json({ error: "Failed to load note number" }, { status: 500 });
    }

    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Credit note next-number error:", error);
    return NextResponse.json({ error: "Failed to load note number" }, { status: 500 });
  }
}

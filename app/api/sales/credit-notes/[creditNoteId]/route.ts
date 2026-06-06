import { NextResponse } from "next/server";
import { extractBackendError, normalizeCreditNoteDetailResponse } from "@/lib/api/credit-notes";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type RouteContext = { params: Promise<{ creditNoteId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { creditNoteId } = await context.params;
    if (!creditNoteId?.trim()) {
      return NextResponse.json({ error: "creditNoteId is required" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/credit-notes/${encodeURIComponent(creditNoteId.trim())}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load credit note" },
        { status: response.status },
      );
    }

    const creditNote = normalizeCreditNoteDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: creditNote });
  } catch (error) {
    console.error("Credit note detail error:", error);
    return NextResponse.json({ error: "Failed to load credit note" }, { status: 500 });
  }
}

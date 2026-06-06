import { NextResponse } from "next/server";
import {
  extractBackendError,
  normalizeCreditNoteDetailResponse,
  normalizeCreditNoteListResponse,
} from "@/lib/api/credit-notes";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

function buildBackendListQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ["noteType", "status", "search", "invoiceId", "page", "limit"] as const) {
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

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/credit-notes${listQuery}`,
      { method: "GET" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load credit notes" },
        { status: response.status },
      );
    }

    const data = normalizeCreditNoteListResponse(body);
    return NextResponse.json({ ...(body as object), data });
  } catch (error) {
    console.error("Credit notes list error:", error);
    return NextResponse.json({ error: "Failed to load credit notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxySalesBackend(
      request,
      `sales/organisations/${encodeURIComponent(organisationId)}/credit-notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create credit note" },
        { status: response.status },
      );
    }

    const creditNote = normalizeCreditNoteDetailResponse(body);
    return NextResponse.json({ ...(body as object), data: creditNote }, { status: response.status });
  } catch (error) {
    console.error("Credit note create error:", error);
    return NextResponse.json({ error: "Failed to create credit note" }, { status: 500 });
  }
}

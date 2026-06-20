import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { getApiBaseUrl } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = { params: Promise<{ invoiceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = new URL(request.url).searchParams.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { invoiceId } = await context.params;
    const trimmedInvoiceId = invoiceId?.trim();
    if (!trimmedInvoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Sales service is not configured" }, { status: 500 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `sales/organisations/${encodeURIComponent(organisationId)}/invoices/${encodeURIComponent(trimmedInvoiceId)}/pdf`,
      apiBaseUrl,
    );

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to load invoice PDF" },
        { status: response.status },
      );
    }

    const pdf = await response.arrayBuffer();
    const disposition = response.headers.get("Content-Disposition");
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=300",
        ...(disposition ? { "Content-Disposition": disposition } : {}),
      },
    });
  } catch (error) {
    console.error("Sales invoice PDF error:", error);
    return NextResponse.json({ error: "Failed to load invoice PDF" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/purchases";
import { getApiBaseUrl } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = { params: Promise<{ billId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = new URL(request.url).searchParams.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { billId } = await context.params;
    const trimmedBillId = billId?.trim();
    if (!trimmedBillId) {
      return NextResponse.json({ error: "billId is required" }, { status: 400 });
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Purchase service is not configured" }, { status: 500 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `purchase/organisations/${encodeURIComponent(organisationId)}/bills/${encodeURIComponent(trimmedBillId)}/pdf`,
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
        { error: extractBackendError(body) ?? "Failed to load purchase bill PDF" },
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
    console.error("Purchase bill PDF error:", error);
    return NextResponse.json({ error: "Failed to load purchase bill PDF" }, { status: 500 });
  }
}

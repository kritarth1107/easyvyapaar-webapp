import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { getApiBaseUrl } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

type RouteContext = { params: Promise<{ transactionId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const organisationId = new URL(request.url).searchParams.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const { transactionId } = await context.params;
    const trimmedId = transactionId?.trim();
    if (!trimmedId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Billing service is not configured" }, { status: 500 });
    }

    const headers = getHeadersFromRequest(request);
    const backendUrl = new URL(
      `billing/organisations/${encodeURIComponent(organisationId)}/transactions/${encodeURIComponent(trimmedId)}/invoice`,
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
        { error: extractBackendError(body) ?? "Failed to download invoice" },
        { status: response.status },
      );
    }

    const pdf = await response.arrayBuffer();
    const disposition = response.headers.get("Content-Disposition");
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        ...(disposition ? { "Content-Disposition": disposition } : {}),
      },
    });
  } catch (error) {
    console.error("Billing invoice download error:", error);
    return NextResponse.json({ error: "Failed to download invoice" }, { status: 500 });
  }
}

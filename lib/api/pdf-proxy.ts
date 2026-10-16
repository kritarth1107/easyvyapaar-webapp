import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { getApiBaseUrl } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";
import { buildContentDisposition, parseContentDispositionFilename } from "@/lib/print/content-disposition";

/**
 * Streams a backend PDF to the browser. `backendPath` is relative to the API base,
 * e.g. `sales/organisations/:orgId/credit-notes/:id/pdf`. The Content-Disposition is
 * re-emitted with an ASCII fallback + UTF-8 filename* so Unicode names survive.
 */
export async function proxyBackendPdf(
  request: Request,
  backendPath: (organisationId: string) => string,
  options: { errorMessage: string; fallbackFilename: string; queryKeys?: readonly string[] },
) {
  try {
    const incoming = new URL(request.url).searchParams;
    const organisationId = incoming.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "API service is not configured" }, { status: 500 });
    }
    const backendUrl = new URL(backendPath(organisationId), apiBaseUrl);
    for (const key of options.queryKeys ?? []) {
      const value = incoming.get(key)?.trim();
      if (value) backendUrl.searchParams.set(key, value);
    }

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: getHeadersFromRequest(request),
      cache: "no-store",
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      return NextResponse.json(
        { error: extractBackendError(body) ?? options.errorMessage },
        { status: response.status },
      );
    }

    const pdf = await response.arrayBuffer();
    const filename =
      parseContentDispositionFilename(response.headers.get("Content-Disposition")) ?? options.fallbackFilename;
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "Content-Disposition": buildContentDisposition(filename),
      },
    });
  } catch (error) {
    console.error(`${options.errorMessage}:`, error);
    return NextResponse.json({ error: options.errorMessage }, { status: 500 });
  }
}

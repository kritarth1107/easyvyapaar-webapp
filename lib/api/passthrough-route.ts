import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/sales";
import { proxySalesBackend, requireOrganisationId } from "@/lib/api/sales-proxy";

type ForwardOptions = {
  /** Backend path after `organisations/:orgId/`, e.g. "proformas" or `proformas/${id}/convert`. */
  scope: "sales" | "reports";
  path: string;
  /** Query keys copied from the incoming request (organisationId is never forwarded). */
  queryKeys?: readonly string[];
  errorMessage: string;
};

/**
 * Thin BFF forwarder for endpoints whose response is consumed as-is by the client
 * (client-side normalisers live next to the API client).
 */
export async function forwardOrganisationRequest(request: Request, options: ForwardOptions) {
  try {
    const organisationId = requireOrganisationId(request);
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }

    const incoming = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of options.queryKeys ?? []) {
      const value = incoming.get(key)?.trim();
      if (value) query.set(key, value);
    }
    const qs = query.toString();

    const method = request.method.toUpperCase();
    let body: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const text = await request.text();
      if (text.trim()) {
        try {
          JSON.parse(text);
        } catch {
          return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }
      }
      // Fastify rejects an empty body with Content-Type: application/json, so send {}.
      body = text.trim() ? text : "{}";
    }

    const { response, body: backendBody } = await proxySalesBackend(
      request,
      `${options.scope}/organisations/${encodeURIComponent(organisationId)}/${options.path}${qs ? `?${qs}` : ""}`,
      {
        method,
        ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body } : {}),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(backendBody) ?? options.errorMessage },
        { status: response.status },
      );
    }
    return NextResponse.json(backendBody, { status: response.status });
  } catch (error) {
    console.error(`${options.errorMessage}:`, error);
    return NextResponse.json({ error: options.errorMessage }, { status: 500 });
  }
}

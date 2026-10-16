import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getBodylessHeadersFromRequest, getHeadersFromRequest } from "@/lib/header-utils";

export async function proxyInventoryBackend(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: unknown }> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return {
      response: new Response(null, { status: 500 }),
      body: { error: "Inventory service is not configured" },
    };
  }

  // Bodyless calls (GET/DELETE/action POSTs) must not send Content-Type: application/json,
  // otherwise Fastify rejects the empty body.
  const headers =
    init?.body == null ? getBodylessHeadersFromRequest(request) : getHeadersFromRequest(request);
  const backendUrl = new URL(path.replace(/^\//, ""), apiBaseUrl);

  try {
    const response = await fetch(backendUrl.toString(), {
      cache: "no-store",
      ...init,
      headers: {
        ...headers,
        ...(init?.headers ?? {}),
      },
    });
    const body = await parseBackendBody(response);
    return { response, body };
  } catch (error) {
    console.error("Inventory backend request failed:", error);
    return {
      response: new Response(null, { status: 502 }),
      body: { error: "Unable to reach inventory service" },
    };
  }
}

export function requireOrganisationId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const fromQuery = searchParams.get("organisationId")?.trim();
  return fromQuery || null;
}

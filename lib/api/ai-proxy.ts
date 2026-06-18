import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function proxyAiBackend(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: unknown }> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return {
      response: new Response(null, { status: 500 }),
      body: { error: "API service is not configured" },
    };
  }

  const headers = getHeadersFromRequest(request);
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
    console.error("AI backend request failed:", error);
    return {
      response: new Response(null, { status: 502 }),
      body: { error: "Unable to reach AI service" },
    };
  }
}

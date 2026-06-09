const DEFAULT_BACKEND_TIMEOUT_MS = 12_000;

export async function fetchBackend(
  input: string | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_BACKEND_TIMEOUT_MS;
  const { timeoutMs: _timeout, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function getApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) return null;
  return url.endsWith("/") ? url : `${url}/`;
}

export async function parseBackendBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return { error: "Invalid JSON response from authentication service" };
    }
  }

  const text = await response.text();
  if (!text) {
    return { message: response.statusText || "Empty response from authentication service" };
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

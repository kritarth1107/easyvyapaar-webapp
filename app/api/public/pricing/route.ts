import { NextResponse } from "next/server";
import { getApiBaseUrl, fetchBackend, parseBackendBody } from "@/lib/api/backend";
import { normalizePublicPricing } from "@/lib/api/pricing";

export const revalidate = 300;

export async function GET() {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json({ error: "API not configured" }, { status: 503 });
  }

  try {
    const response = await fetchBackend(new URL("public/pricing", apiBaseUrl).toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      timeoutMs: 10_000,
    });
    const body = await parseBackendBody(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to load pricing" },
        { status: response.status },
      );
    }

    const data = normalizePublicPricing(body);
    if (!data) {
      return NextResponse.json({ error: "Invalid pricing response" }, { status: 502 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Public pricing proxy error:", error);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 502 });
  }
}

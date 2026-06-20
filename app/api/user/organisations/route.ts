import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { proxyDashboardBackend } from "@/lib/api/dashboard-proxy";

export async function POST(request: Request) {
  try {
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { response, body } = await proxyDashboardBackend(request, "user/organisations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to create business" },
        { status: response.status },
      );
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    console.error("Create organisation error:", error);
    return NextResponse.json({ error: "Failed to create business" }, { status: 500 });
  }
}

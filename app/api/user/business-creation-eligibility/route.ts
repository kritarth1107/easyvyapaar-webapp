import { NextResponse } from "next/server";
import { extractBackendError } from "@/lib/api/inventory";
import { proxyDashboardBackend } from "@/lib/api/dashboard-proxy";

export async function GET(request: Request) {
  try {
    const { response, body } = await proxyDashboardBackend(request, "user/me/business-creation-eligibility", {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: extractBackendError(body) ?? "Failed to check plan limits" },
        { status: response.status },
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Business creation eligibility error:", error);
    return NextResponse.json({ error: "Failed to check plan limits" }, { status: 500 });
  }
}

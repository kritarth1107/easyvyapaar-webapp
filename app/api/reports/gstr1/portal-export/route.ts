import { NextResponse } from "next/server";
import { getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function GET(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "API not configured" }, { status: 500 });
    }
    const url = new URL(request.url);
    const organisationId = url.searchParams.get("organisationId")?.trim();
    if (!organisationId) {
      return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
    }
    const fromDate = url.searchParams.get("fromDate")?.trim();
    const toDate = url.searchParams.get("toDate")?.trim();
    const qs = new URLSearchParams();
    if (fromDate) qs.set("fromDate", fromDate);
    if (toDate) qs.set("toDate", toDate);
    const backendUrl = new URL(
      `reports/organisations/${encodeURIComponent(organisationId)}/gstr1/portal-export?${qs.toString()}`,
      apiBaseUrl,
    );
    const headers = getHeadersFromRequest(request);
    const backendResponse = await fetch(backendUrl.toString(), { headers, cache: "no-store" });
    const body = await parseBackendBody(backendResponse);
    return NextResponse.json(body, { status: backendResponse.status });
  } catch (error) {
    console.error("GSTR-1 portal export error:", error);
    return NextResponse.json({ error: "Failed to export GSTR-1" }, { status: 500 });
  }
}

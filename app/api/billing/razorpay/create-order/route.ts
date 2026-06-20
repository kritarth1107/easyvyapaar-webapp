import { NextResponse } from "next/server";
import { fetchBackend, getApiBaseUrl, parseBackendBody } from "@/lib/api/backend";
import { getHeadersFromRequest } from "@/lib/header-utils";

export async function POST(request: Request) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json({ error: "Billing service is not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const paymentToken =
      typeof (body as { paymentToken?: unknown })?.paymentToken === "string"
        ? (body as { paymentToken: string }).paymentToken.trim()
        : "";

    if (!paymentToken) {
      return NextResponse.json({ error: "paymentToken is required" }, { status: 400 });
    }

    const headers = getHeadersFromRequest(request);
    const backendResponse = await fetchBackend(`${apiBaseUrl}billing/razorpay/create-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paymentToken }),
      timeoutMs: 20_000,
    });

    const responseBody = await parseBackendBody(backendResponse);
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}
